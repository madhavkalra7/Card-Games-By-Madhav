import {
  Card,
  GameStateClientView,
  PlayerClientView,
  Rank,
  Suit,
  Spectator,
  DoctorConfig,
  DoctorRoundScore,
  DoctorStateClientView,
} from './types';
import { SUITS, RANKS, shuffleDeck } from './deck';
import { drawRandomRewardCard, CollectibleRewardInfo } from '../../src/lib/collectibles';
import { calculateRankPoints, calculateRankCoins } from './engine';

export function getDoctorCardValue(card: Card): number {
  if (card.isJoker || (card.rank as string) === 'JKR' || (card.suit as string) === 'JKR') return 50;
  if (card.rank === 'A') return 1;
  if (card.rank === 'J') return 11;
  if (card.rank === 'Q') return 12;
  if (card.rank === 'K') return 13;
  const num = parseInt(card.rank, 10);
  return isNaN(num) ? 0 : num;
}

export function calculateHandSum(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + getDoctorCardValue(c), 0);
}

export function createDoctorDeck(playerCount: number = 4, cardsPerPlayer: number = 8): Card[] {
  const totalCardsNeeded = playerCount * cardsPerPlayer + 20;
  const deckCount = totalCardsNeeded > 45 ? 2 : 1;
  const deck: Card[] = [];

  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          id: `${suit}-${rank}-${d}`,
          suit,
          rank,
        });
      }
    }
    // 2 Jokers per deck (Red Joker & Black Joker), each worth 50 points!
    deck.push({
      id: `JKR-RED-${d}`,
      suit: 'H',
      rank: 'JKR' as unknown as Rank,
      isJoker: true,
    });
    deck.push({
      id: `JKR-BLK-${d}`,
      suit: 'S',
      rank: 'JKR' as unknown as Rank,
      isJoker: true,
    });
  }

  return shuffleDeck(deck);
}

export interface DoctorPlayer {
  id: string; // socket.id
  sessionId: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  isConnected: boolean;
  disconnectTime: number | null;
  seatIndex: number;
  cards: Card[];
  isFinished: boolean;
  rank: number | null;
}

export class DoctorRoom {
  public roomCode: string;
  public gameType: 'DOCTOR' = 'DOCTOR';
  public status: 'LOBBY' | 'PLAYING' | 'GAME_OVER' = 'LOBBY';
  public players: DoctorPlayer[] = [];
  public currentTurnIndex: number = 0;

  // Custom Settings (Input window / config after room creation)
  public config: DoctorConfig = {
    cardsPerPlayer: 8,
    showLimit: 10,
    totalRounds: 3,
  };

  // Turn & Deck State
  public currentRound: number = 1;
  public turnPhase: 'DRAW' | 'DISCARD' = 'DRAW';
  public drawDeck: Card[] = [];
  public discardPile: Card[] = [];
  public lastDiscardGroup: Card[] = [];
  public lastDiscardPlayerName?: string;

  // Scoring & Rounds History
  public scoresHistory: DoctorRoundScore[] = [];
  public cumulativeScores: Record<string, number> = {};
  public isRoundOver: boolean = false;
  public roundResult: DoctorRoundScore | null = null;
  public latestActionMessage: string | null = null;

  public winner: DoctorPlayer | null = null;
  public turnTimeRemaining: number = 0;
  public rankings: Array<{
    playerId: string;
    name: string;
    avatarColor: string;
    rank: number;
    scoreEarned?: number;
    coinsEarned?: number;
    totalScore?: number;
    rewardCard?: CollectibleRewardInfo;
  }> = [];

  public spectators: Spectator[] = [];
  public autoAbortTimer: {
    deadline: number;
    secondsRemaining: number;
    disconnectedPlayerName: string;
  } | null = null;

  private turnTimer: NodeJS.Timeout | null = null;
  private turnDeadline: number = 0;
  private botTimer: NodeJS.Timeout | null = null;
  private onStateChange: () => void;
  private onGameOver?: (room: DoctorRoom) => void;

  constructor(roomCode: string, onStateChange: () => void, onGameOver?: (room: DoctorRoom) => void) {
    this.roomCode = roomCode;
    this.onStateChange = onStateChange;
    this.onGameOver = onGameOver;
  }

  public addSpectator(data: { id: string; sessionId: string; name: string; avatarColor: string }): Spectator {
    const existing = this.spectators.find((s) => s.sessionId === data.sessionId);
    if (existing) {
      existing.id = data.id;
      existing.name = data.name;
      existing.avatarColor = data.avatarColor;
      this.onStateChange();
      return existing;
    }
    const spectator: Spectator = { ...data };
    this.spectators.push(spectator);
    this.onStateChange();
    return spectator;
  }

  public removeSpectator(id: string) {
    this.spectators = this.spectators.filter((s) => s.id !== id && s.sessionId !== id);
    this.onStateChange();
  }

  public addPlayer(data: { id: string; sessionId: string; name: string; avatarColor: string }): DoctorPlayer {
    const existing = this.players.find((p) => p.sessionId === data.sessionId);
    if (existing) {
      existing.id = data.id;
      existing.isConnected = true;
      existing.disconnectTime = null;
      this.onStateChange();
      return existing;
    }

    const player: DoctorPlayer = {
      id: data.id,
      sessionId: data.sessionId,
      name: data.name,
      avatarColor: data.avatarColor,
      isHost: this.players.length === 0,
      isConnected: true,
      disconnectTime: null,
      seatIndex: this.players.length,
      cards: [],
      isFinished: false,
      rank: null,
    };

    this.players.push(player);
    this.cumulativeScores[player.id] = 0;
    this.onStateChange();
    return player;
  }

  public removePlayer(id: string) {
    const player = this.players.find((p) => p.id === id || p.sessionId === id);
    if (!player) return;

    if (this.status === 'LOBBY') {
      this.players = this.players.filter((p) => p.sessionId !== player.sessionId);
      if (player.isHost && this.players.length > 0) {
        this.players[0].isHost = true;
      }
      this.players.forEach((p, idx) => {
        p.seatIndex = idx;
      });
      delete this.cumulativeScores[player.id];
    } else {
      player.isConnected = false;
      player.disconnectTime = Date.now();
    }
    this.onStateChange();
  }

  public markDisconnected(socketId: string) {
    const player = this.players.find((p) => p.id === socketId);
    if (player) {
      player.isConnected = false;
      player.disconnectTime = Date.now();
    }
  }

  public reconnectPlayer(sessionId: string, newSocketId: string): boolean {
    const player = this.players.find((p) => p.sessionId === sessionId);
    if (!player) return false;

    const oldId = player.id;
    player.id = newSocketId;
    player.isConnected = true;
    player.disconnectTime = null;
    if (this.cumulativeScores[oldId] !== undefined) {
      this.cumulativeScores[newSocketId] = this.cumulativeScores[oldId];
      if (oldId !== newSocketId) delete this.cumulativeScores[oldId];
    }
    return true;
  }

  public updateConfig(newConfig: Partial<DoctorConfig>, hostId: string): { success: boolean; error?: string } {
    if (this.status !== 'LOBBY') {
      return { success: false, error: 'Cannot change settings while match is in progress.' };
    }
    const host = this.players.find((p) => p.id === hostId || p.sessionId === hostId);
    if (!host || !host.isHost) {
      return { success: false, error: 'Only the room host can customize Doctor settings.' };
    }

    if (newConfig.cardsPerPlayer && [8, 10, 12].includes(newConfig.cardsPerPlayer)) {
      this.config.cardsPerPlayer = newConfig.cardsPerPlayer;
    }
    if (typeof newConfig.showLimit === 'number') {
      const clamped = Math.max(10, Math.min(15, Math.floor(newConfig.showLimit)));
      this.config.showLimit = clamped;
    }
    if (typeof newConfig.totalRounds === 'number') {
      const clampedRounds = Math.max(1, Math.min(10, Math.floor(newConfig.totalRounds)));
      this.config.totalRounds = clampedRounds;
    }

    this.onStateChange();
    return { success: true };
  }

  public startGame(requesterId: string): { success: boolean; error?: string } {
    if (this.status !== 'LOBBY') {
      return { success: false, error: 'Match has already started.' };
    }
    const host = this.players.find((p) => p.id === requesterId || p.sessionId === requesterId);
    if (!host || !host.isHost) {
      return { success: false, error: 'Only the host can start the match.' };
    }
    if (this.players.length < 2) {
      return { success: false, error: 'At least 2 players are required for Doctor.' };
    }

    this.currentRound = 1;
    this.scoresHistory = [];
    this.cumulativeScores = {};
    for (const p of this.players) {
      this.cumulativeScores[p.id] = 0;
    }

    this.startRound(1);
    return { success: true };
  }

  public startRound(roundNumber: number) {
    this.status = 'PLAYING';
    this.currentRound = roundNumber;
    this.isRoundOver = false;
    this.roundResult = null;
    this.turnPhase = 'DRAW';

    // Deal fresh deck for the round
    const fullDeck = createDoctorDeck(this.players.length, this.config.cardsPerPlayer);

    // Deal cardsPerPlayer to each player
    let cardIdx = 0;
    for (const p of this.players) {
      p.cards = fullDeck.slice(cardIdx, cardIdx + this.config.cardsPerPlayer);
      p.isFinished = false;
      p.rank = null;
      cardIdx += this.config.cardsPerPlayer;
    }

    // Remaining cards form drawDeck
    const remainingDeck = fullDeck.slice(cardIdx);

    // Turn 1 card face-up to start discard pile
    const initialDiscard = remainingDeck.shift();
    if (initialDiscard) {
      this.discardPile = [initialDiscard];
      this.lastDiscardGroup = [initialDiscard];
      this.lastDiscardPlayerName = 'Table Dealer';
    } else {
      this.discardPile = [];
      this.lastDiscardGroup = [];
      this.lastDiscardPlayerName = undefined;
    }

    this.drawDeck = remainingDeck;

    // Start with player after previous round starter or winner
    this.currentTurnIndex = (roundNumber - 1) % this.players.length;
    this.latestActionMessage = `Round ${roundNumber} started! Hand Limit: ≤${this.config.showLimit}. Turn: ${this.players[this.currentTurnIndex].name}`;

    this.startTurnTimer();
    this.onStateChange();
    this.checkBotTurn();
  }

  // Draw 1 card from face-down center drawDeck
  public drawCard(playerId: string): { success: boolean; error?: string; card?: Card } {
    if (this.status !== 'PLAYING' || this.isRoundOver) {
      return { success: false, error: 'Round is not active.' };
    }
    const current = this.players[this.currentTurnIndex];
    if (current.id !== playerId && current.sessionId !== playerId) {
      return { success: false, error: "Not your turn to play." };
    }
    if (this.turnPhase !== 'DRAW') {
      return { success: false, error: 'You have already drawn! Please discard card(s).' };
    }

    // Check if drawDeck is empty -> reshuffle older discard pile
    if (this.drawDeck.length === 0) {
      this.reshuffleDiscardIntoDrawDeck();
    }

    if (this.drawDeck.length === 0) {
      return { success: false, error: 'No cards available in deck! You must pick from discard or call Show.' };
    }

    const card = this.drawDeck.pop()!;
    current.cards.push(card);
    this.turnPhase = 'DISCARD';
    this.latestActionMessage = `${current.name} drew 1 card from center deck. Must discard.`;

    this.resetTurnTimer();
    this.onStateChange();
    this.checkBotTurn();
    return { success: true, card };
  }

  // Pick previous player's discard group from table discard pile
  public pickDiscard(playerId: string): { success: boolean; error?: string; cards?: Card[] } {
    if (this.status !== 'PLAYING' || this.isRoundOver) {
      return { success: false, error: 'Round is not active.' };
    }
    const current = this.players[this.currentTurnIndex];
    if (current.id !== playerId && current.sessionId !== playerId) {
      return { success: false, error: "Not your turn to play." };
    }
    if (this.turnPhase !== 'DRAW') {
      return { success: false, error: 'You have already drawn! Please discard card(s).' };
    }
    if (this.lastDiscardGroup.length === 0) {
      return { success: false, error: 'Discard pile is empty.' };
    }

    // Pick ALL cards in lastDiscardGroup together!
    const pickedCards = [...this.lastDiscardGroup];
    current.cards.push(...pickedCards);

    // Remove them from discardPile
    this.discardPile = this.discardPile.slice(0, this.discardPile.length - pickedCards.length);

    // Update lastDiscardGroup to top remaining card on discard pile (if any)
    if (this.discardPile.length > 0) {
      this.lastDiscardGroup = [this.discardPile[this.discardPile.length - 1]];
      this.lastDiscardPlayerName = 'Previous';
    } else {
      this.lastDiscardGroup = [];
      this.lastDiscardPlayerName = undefined;
    }

    this.turnPhase = 'DISCARD';
    this.latestActionMessage = `${current.name} picked ${pickedCards.length} card(s) (${pickedCards.map((c) => c.rank).join(', ')}) from discard!`;

    this.resetTurnTimer();
    this.onStateChange();
    this.checkBotTurn();
    return { success: true, cards: pickedCards };
  }

  // Discard 1 card OR 2, 3, 4 cards of the EXACT SAME RANK
  public discardCards(playerId: string, cardIds: string[]): { success: boolean; error?: string } {
    if (this.status !== 'PLAYING' || this.isRoundOver) {
      return { success: false, error: 'Round is not active.' };
    }
    const current = this.players[this.currentTurnIndex];
    if (current.id !== playerId && current.sessionId !== playerId) {
      return { success: false, error: "Not your turn to play." };
    }
    if (this.turnPhase !== 'DISCARD') {
      return { success: false, error: 'You must draw a card before discarding.' };
    }
    if (!cardIds || cardIds.length === 0) {
      return { success: false, error: 'Select at least 1 card to discard.' };
    }

    // Verify all selected cards exist in current hand
    const selectedCards: Card[] = [];
    for (const cid of cardIds) {
      const found = current.cards.find((c) => c.id === cid);
      if (!found) {
        return { success: false, error: 'Card not found in your hand.' };
      }
      selectedCards.push(found);
    }

    // Validate discard set:
    // Either single card OR all cards have identical rank (e.g. all 4s, or all Jokers)
    if (selectedCards.length > 1) {
      const first = selectedCards[0];
      const allSame = selectedCards.every((c) =>
        first.isJoker ? c.isJoker : (!c.isJoker && c.rank === first.rank)
      );
      if (!allSame) {
        return { success: false, error: 'Pairs, Triples, or Quads must have the EXACT SAME RANK to discard together!' };
      }
    }

    // Remove discarded cards from hand
    current.cards = current.cards.filter((c) => !cardIds.includes(c.id));

    // Place on discardPile and update lastDiscardGroup
    this.discardPile.push(...selectedCards);
    this.lastDiscardGroup = [...selectedCards];
    this.lastDiscardPlayerName = current.name;

    const thrownSum = calculateHandSum(selectedCards);
    this.latestActionMessage = `${current.name} discarded ${selectedCards.length} card(s) (${selectedCards.map((c) => c.rank).join(', ')}) [-${thrownSum} pts].`;

    // Reshuffle discard into drawDeck if drawDeck is empty
    if (this.drawDeck.length === 0) {
      this.reshuffleDiscardIntoDrawDeck();
    }

    // Advance turn to next player
    this.advanceTurn();
    return { success: true };
  }

  // Reshuffle older discard pile cards back into drawDeck when empty
  private reshuffleDiscardIntoDrawDeck() {
    if (this.discardPile.length <= this.lastDiscardGroup.length) return;

    // Leave the active lastDiscardGroup on the table!
    const activeGroupCount = this.lastDiscardGroup.length;
    const cardsToRecycle = this.discardPile.slice(0, this.discardPile.length - activeGroupCount);
    this.discardPile = this.discardPile.slice(this.discardPile.length - activeGroupCount);

    this.drawDeck = shuffleDeck(cardsToRecycle);
    this.latestActionMessage = `🔄 Draw deck was empty! Shuffled ${this.drawDeck.length} cards back into table deck.`;
  }

  // Call SHOW (Declared by active player on their turn)
  public callShow(playerId: string): { success: boolean; error?: string } {
    if (this.status !== 'PLAYING' || this.isRoundOver) {
      return { success: false, error: 'Round is not active.' };
    }
    const current = this.players[this.currentTurnIndex];
    if (current.id !== playerId && current.sessionId !== playerId) {
      return { success: false, error: "You can only call Show on your turn." };
    }

    const callerSum = calculateHandSum(current.cards);
    if (callerSum > this.config.showLimit) {
      return {
        success: false,
        error: `Your hand sum is ${callerSum}, which exceeds the Show limit (≤${this.config.showLimit})!`,
      };
    }

    // Clear timers
    if (this.turnTimer) clearTimeout(this.turnTimer);
    if (this.botTimer) clearTimeout(this.botTimer);

    // Calculate hand sum for every player
    const handSums: Record<string, number> = {};
    const revealedHands: Record<string, Card[]> = {};
    for (const p of this.players) {
      handSums[p.id] = calculateHandSum(p.cards);
      revealedHands[p.id] = [...p.cards];
    }

    // Determine if anyone has a sum <= callerSum (excluding caller)
    const otherPlayers = this.players.filter((p) => p.id !== current.id);
    const beatingPlayers = otherPlayers.filter((p) => handSums[p.id] <= callerSum);

    let isWrongShow = false;
    let roundWinner: DoctorPlayer = current;
    let penaltyPoints = 0;
    let penaltyPlayerId: string | undefined = undefined;

    const roundScores: Record<string, number> = {};

    if (beatingPlayers.length === 0) {
      // ✅ SUCCESSFUL SHOW: Caller has strictly lowest sum!
      isWrongShow = false;
      roundWinner = current;
      roundScores[current.id] = 0; // 0 points for winner!

      for (const op of otherPlayers) {
        roundScores[op.id] = handSums[op.id];
      }

      this.latestActionMessage = `🎉 SHOW SUCCESSFUL! ${current.name} had lowest sum (${callerSum}) and scores 0 PTS!`;
    } else {
      // 🚨 WRONG SHOW (Caught / Failed Show)!
      isWrongShow = true;
      penaltyPlayerId = current.id;

      // Penalty = 50 points per player who beat or tied the caller!
      penaltyPoints = beatingPlayers.length * 50;

      // Actual round winner is player with minimum sum
      let minSum = 999999;
      let trueWinner = otherPlayers[0];
      for (const op of otherPlayers) {
        if (handSums[op.id] < minSum) {
          minSum = handSums[op.id];
          trueWinner = op;
        }
      }
      roundWinner = trueWinner;

      // Winner gets 0 points
      roundScores[roundWinner.id] = 0;

      // Failed caller gets their hand sum + penalty!
      roundScores[current.id] = callerSum + penaltyPoints;

      // Other non-winner players get their hand sums
      for (const p of this.players) {
        if (p.id !== roundWinner.id && p.id !== current.id) {
          roundScores[p.id] = handSums[p.id];
        }
      }

      this.latestActionMessage = `🚨 WRONG SHOW by ${current.name}! Sum: ${callerSum}. ${roundWinner.name} had ${minSum} PTS! Penalty: +${penaltyPoints} PTS!`;
    }

    // Update cumulative scores
    for (const p of this.players) {
      const added = roundScores[p.id] || 0;
      this.cumulativeScores[p.id] = (this.cumulativeScores[p.id] || 0) + added;
    }

    const roundScoreData: DoctorRoundScore = {
      roundNumber: this.currentRound,
      scores: roundScores,
      handSums,
      callerId: current.id,
      callerName: current.name,
      winnerId: roundWinner.id,
      winnerName: roundWinner.name,
      isWrongShow,
      penaltyPlayerId,
      penaltyPoints: isWrongShow ? penaltyPoints : undefined,
      revealedHands,
    };

    this.scoresHistory.push(roundScoreData);
    this.roundResult = roundScoreData;
    this.isRoundOver = true;

    // Check if final round reached
    if (this.currentRound >= this.config.totalRounds) {
      this.finishGame();
    }

    this.onStateChange();
    return { success: true };
  }

  // Advance to next round when host or players trigger
  public nextRound(requesterId: string): { success: boolean; error?: string } {
    if (!this.isRoundOver) {
      return { success: false, error: 'Current round is not over yet.' };
    }
    if (this.currentRound >= this.config.totalRounds) {
      return { success: false, error: 'All rounds have been completed.' };
    }

    this.startRound(this.currentRound + 1);
    return { success: true };
  }

  // End entire game and crown the player with lowest cumulative score
  private finishGame() {
    this.status = 'GAME_OVER';

    // Sort players by cumulative score ascending (LOWEST SCORE WINS!)
    const sorted = [...this.players].sort((a, b) => {
      const scoreA = this.cumulativeScores[a.id] ?? 99999;
      const scoreB = this.cumulativeScores[b.id] ?? 99999;
      return scoreA - scoreB;
    });

    this.winner = sorted[0];

    this.rankings = sorted.map((p, idx) => {
      const rank = idx + 1;
      const totalPoints = this.cumulativeScores[p.id] || 0;
      const scoreEarned = calculateRankPoints(rank, this.players.length);
      const coinsEarned = calculateRankCoins(rank, this.players.length);
      const rewardCard = rank === 1 ? drawRandomRewardCard(1) : undefined;

      return {
        playerId: p.id,
        name: p.name,
        avatarColor: p.avatarColor,
        rank,
        scoreEarned,
        coinsEarned,
        totalScore: totalPoints,
        rewardCard,
      };
    });

    this.latestActionMessage = `🏆 GAME COMPLETED! ${this.winner.name} won Doctor with lowest cumulative score (${this.cumulativeScores[this.winner.id]} PTS)!`;

    if (this.onGameOver) {
      this.onGameOver(this);
    }
  }

  private advanceTurn() {
    this.turnPhase = 'DRAW';
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    this.resetTurnTimer();
    this.onStateChange();
    this.checkBotTurn();
  }

  private startTurnTimer() {
    if (this.turnTimer) clearTimeout(this.turnTimer);
    const TURN_SECONDS = 30;
    this.turnTimeRemaining = TURN_SECONDS;
    this.turnDeadline = Date.now() + TURN_SECONDS * 1000;

    this.turnTimer = setInterval(() => {
      const left = Math.max(0, Math.ceil((this.turnDeadline - Date.now()) / 1000));
      this.turnTimeRemaining = left;
      if (left <= 0) {
        if (this.turnTimer) clearInterval(this.turnTimer);
        this.handleTurnTimeout();
      }
    }, 1000);
  }

  private resetTurnTimer() {
    const TURN_SECONDS = 30;
    this.turnTimeRemaining = TURN_SECONDS;
    this.turnDeadline = Date.now() + TURN_SECONDS * 1000;
  }

  private handleTurnTimeout() {
    if (this.status !== 'PLAYING' || this.isRoundOver) return;
    const current = this.players[this.currentTurnIndex];
    if (!current) return;

    // If turn phase is DRAW: auto-draw 1 card
    if (this.turnPhase === 'DRAW') {
      this.drawCard(current.id);
    }

    // Auto-discard highest card
    if (this.turnPhase === 'DISCARD' && current.cards.length > 0) {
      const highestCard = [...current.cards].sort((a, b) => getDoctorCardValue(b) - getDoctorCardValue(a))[0];
      this.discardCards(current.id, [highestCard.id]);
    }
  }

  // Bot logic for disconnected players / auto turns
  private checkBotTurn() {
    if (this.status !== 'PLAYING' || this.isRoundOver) return;
    const current = this.players[this.currentTurnIndex];
    if (!current || current.isConnected) return; // Only automate if disconnected

    if (this.botTimer) clearTimeout(this.botTimer);
    this.botTimer = setTimeout(() => {
      if (this.status !== 'PLAYING' || this.isRoundOver) return;
      const p = this.players[this.currentTurnIndex];
      if (!p || p.isConnected) return;

      const mySum = calculateHandSum(p.cards);

      // Check if bot can and should call Show
      if (this.turnPhase === 'DRAW' && mySum <= this.config.showLimit && mySum <= 8) {
        this.callShow(p.id);
        return;
      }

      // If phase is DRAW:
      if (this.turnPhase === 'DRAW') {
        // Evaluate picking from discard if it's low or matching
        if (this.lastDiscardGroup.length === 1 && getDoctorCardValue(this.lastDiscardGroup[0]) <= 3) {
          this.pickDiscard(p.id);
        } else {
          this.drawCard(p.id);
        }
      }

      // If phase is DISCARD:
      if (this.turnPhase === 'DISCARD' && p.cards.length > 0) {
        // Discard highest pair or highest card
        const rankGroups: Record<string, Card[]> = {};
        for (const c of p.cards) {
          rankGroups[c.rank] = rankGroups[c.rank] || [];
          rankGroups[c.rank].push(c);
        }

        let bestGroup: Card[] = [];
        let maxThrowSum = -1;

        for (const cards of Object.values(rankGroups)) {
          const sum = calculateHandSum(cards);
          if (sum > maxThrowSum) {
            maxThrowSum = sum;
            bestGroup = cards;
          }
        }

        const idsToThrow = bestGroup.length > 0 ? bestGroup.map((c) => c.id) : [p.cards[0].id];
        this.discardCards(p.id, idsToThrow);
      }
    }, 1500);
  }

  public kickPlayer(hostId: string, targetPlayerId: string): boolean {
    const host = this.players.find((p) => p.id === hostId || p.sessionId === hostId);
    if (!host || !host.isHost) return false;
    const target = this.players.find((p) => p.id === targetPlayerId || p.sessionId === targetPlayerId);
    if (!target || target.isHost) return false;

    this.removePlayer(target.id);
    return true;
  }

  public playAgain(requesterId: string): { success: boolean; error?: string } {
    if (this.status !== 'GAME_OVER') {
      return { success: false, error: 'Game is not over yet.' };
    }
    const host = this.players.find((p) => p.id === requesterId || p.sessionId === requesterId);
    if (!host || !host.isHost) {
      return { success: false, error: 'Only the host can restart the game.' };
    }

    this.status = 'LOBBY';
    this.winner = null;
    this.rankings = [];
    this.scoresHistory = [];
    this.currentRound = 1;
    this.roundResult = null;
    this.isRoundOver = false;
    this.cumulativeScores = {};
    for (const p of this.players) {
      p.cards = [];
      p.isFinished = false;
      p.rank = null;
      this.cumulativeScores[p.id] = 0;
    }

    this.onStateChange();
    return { success: true };
  }

  // Construct Client View for socket synchronization
  public getClientView(requestingPlayerId?: string): GameStateClientView {
    const requestingPlayer = this.players.find(
      (p) => p.id === requestingPlayerId || p.sessionId === requestingPlayerId
    );
    const isSpectator = !requestingPlayer;

    const myHand = requestingPlayer ? [...requestingPlayer.cards] : [];
    const myHandSum = calculateHandSum(myHand);
    const isMyTurn =
      !this.isRoundOver &&
      requestingPlayer &&
      this.players[this.currentTurnIndex]?.id === requestingPlayer.id;

    const canCallShow =
      !!isMyTurn &&
      this.turnPhase === 'DRAW' &&
      myHandSum <= this.config.showLimit;

    const doctorState: DoctorStateClientView = {
      config: { ...this.config },
      currentRound: this.currentRound,
      totalRounds: this.config.totalRounds,
      myHand,
      myHandSum,
      canCallShow,
      turnPhase: this.turnPhase,
      lastDiscardGroup: this.lastDiscardGroup,
      lastDiscardPlayerName: this.lastDiscardPlayerName,
      discardPileCount: this.discardPile.length,
      drawDeckCount: this.drawDeck.length,
      scoresHistory: this.scoresHistory,
      cumulativeScores: this.cumulativeScores,
      latestActionMessage: this.latestActionMessage,
      isRoundOver: this.isRoundOver,
      roundResult: this.roundResult,
    };

    const playersView: PlayerClientView[] = this.players.map((p) => ({
      id: p.id,
      sessionId: p.sessionId,
      name: p.name,
      avatarColor: p.avatarColor,
      isHost: p.isHost,
      isConnected: p.isConnected,
      seatIndex: p.seatIndex,
      hiddenCount: p.cards.length,
      cardsCount: p.cards.length,
      rightDeckTop: null,
      rightDeckCount: 0,
      isBazaarOpen: false,
      hasFloatingCard: false,
      floatingCard: null,
      isFinished: p.isFinished,
      rank: p.rank,
    }));

    return {
      roomCode: this.roomCode,
      gameType: 'DOCTOR',
      status: this.status,
      players: playersView,
      myPlayerId: requestingPlayerId || '',
      currentTurnPlayerId: this.players[this.currentTurnIndex]?.id || '',
      centerBaseRank: null,
      centerDecks: [],
      centerCard: this.lastDiscardGroup.length > 0 ? this.lastDiscardGroup[this.lastDiscardGroup.length - 1] : null,
      centerCount: this.discardPile.length,
      turnTimeRemaining: this.turnTimeRemaining,
      myFloatingCard: null,
      doctorState,
      lastMove: null,
      activePenaltyAnimation: null,
      winner: this.winner
        ? {
            id: this.winner.id,
            name: this.winner.name,
            avatarColor: this.winner.avatarColor,
          }
        : null,
      isSpectator,
      spectatorCount: this.spectators.length,
      autoAbortTimer: this.autoAbortTimer,
      rankings: this.rankings,
    };
  }
}
