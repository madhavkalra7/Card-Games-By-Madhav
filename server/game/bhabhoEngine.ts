import { Card, GameStateClientView, PlayerClientView, Rank, Suit, BhabhoTrickCard, BhabhoLastTrickResult, BhabhoStateClientView, Spectator } from './types';
import { createDeck, shuffleDeck } from './deck';
import { drawRandomRewardCard, CollectibleRewardInfo } from '../../src/lib/collectibles';
import { calculateRankPoints, calculateRankCoins } from './engine';

// In Bhabho (Getaway), Ace is the highest rank (14) and 2 is the lowest (2)
const RANK_ORDER: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

const SUIT_ORDER: Record<Suit, number> = {
  'S': 1, // Spades (Hukkum)
  'H': 2, // Hearts (Paan)
  'C': 3, // Clubs (Chidi)
  'D': 4, // Diamonds (Eent)
};

export function sortBhabhoCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const suitDiff = (SUIT_ORDER[a.suit] || 0) - (SUIT_ORDER[b.suit] || 0);
    if (suitDiff !== 0) return suitDiff;
    return (RANK_ORDER[a.rank] || 0) - (RANK_ORDER[b.rank] || 0);
  });
}

export interface BhabhoPlayer {
  id: string; // socket.id
  sessionId: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  isConnected: boolean;
  disconnectTime: number | null;
  seatIndex: number;
  cards: Card[]; // Private hand
  isFinished: boolean; // Has emptied hand and escaped
  rank: number | null; // Escape position: 1 (#1 Escaped), 2, 3, etc.
}

export class BhabhoRoom {
  public roomCode: string;
  public gameType: 'BHABHO' = 'BHABHO';
  public status: 'LOBBY' | 'PLAYING' | 'GAME_OVER' = 'LOBBY';
  public players: BhabhoPlayer[] = [];
  public currentTurnIndex: number = 0;

  // Bhabho Trick State
  public leadSuit: Suit | null = null;
  public currentTrick: BhabhoTrickCard[] = [];
  public currentTrickStarterId: string | null = null;
  public wastePileCount: number = 0;
  public escapedPlayerIds: string[] = [];
  public roundNumber: number = 1;
  public isFirstTrickOfGame: boolean = true;
  public lastTrickResult: BhabhoLastTrickResult | null = null;
  public latestActionMessage: string | null = null;
  public isResolvingTrick: boolean = false;
  public trickDelayMs: number = 2000;
  private trickResolutionTimer: NodeJS.Timeout | null = null;

  public winner: BhabhoPlayer | null = null;
  public turnTimeRemaining: number = 0;
  public rankings: Array<{
    playerId: string;
    name: string;
    avatarColor: string;
    rank: number;
    scoreEarned?: number;
    coinsEarned?: number;
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
  private onStateChange: () => void;
  private onGameOver?: (room: BhabhoRoom) => void;

  constructor(roomCode: string, onStateChange: () => void, onGameOver?: (room: BhabhoRoom) => void) {
    this.roomCode = roomCode;
    this.onStateChange = onStateChange;
    this.onGameOver = onGameOver;
  }

  public addSpectator(data: { id: string; sessionId: string; name: string; avatarColor: string }): Spectator {
    const existing = this.spectators.find(s => s.sessionId === data.sessionId);
    if (existing) {
      existing.id = data.id;
      existing.name = data.name;
      existing.avatarColor = data.avatarColor;
      this.onStateChange();
      return existing;
    }
    const spectator: Spectator = {
      id: data.id,
      sessionId: data.sessionId,
      name: data.name.trim() || 'Spectator',
      avatarColor: data.avatarColor,
    };
    this.spectators.push(spectator);
    this.onStateChange();
    return spectator;
  }

  public removeSpectator(socketId: string): void {
    const idx = this.spectators.findIndex(s => s.id === socketId);
    if (idx !== -1) {
      this.spectators.splice(idx, 1);
      this.onStateChange();
    }
  }

  public addPlayer(data: { id: string; sessionId: string; name: string; avatarColor: string }): BhabhoPlayer {
    const existing = this.players.find(p => p.sessionId === data.sessionId);
    if (existing) {
      existing.id = data.id;
      existing.isConnected = true;
      existing.disconnectTime = null;
      return existing;
    }

    if (this.players.length >= 5) {
      throw new Error("Room is already full (max 5 players).");
    }

    if (this.status !== 'LOBBY') {
      throw new Error("Game is already in progress.");
    }

    const player: BhabhoPlayer = {
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
    return player;
  }

  public removePlayer(socketId: string) {
    const pIndex = this.players.findIndex(p => p.id === socketId);
    if (pIndex === -1) return;

    const player = this.players[pIndex];
    if (this.status === 'LOBBY') {
      this.players.splice(pIndex, 1);
      this.players.forEach((p, idx) => {
        p.seatIndex = idx;
        p.isHost = idx === 0;
      });
    } else {
      player.isConnected = false;
      player.disconnectTime = Date.now();
      // If during active turn, pass or auto-play
      if (this.players[this.currentTurnIndex]?.id === socketId) {
        this.handleTurnTimeout();
      }
    }
  }

  public markDisconnected(socketId: string) {
    const player = this.players.find(p => p.id === socketId);
    if (player) {
      player.isConnected = false;
      player.disconnectTime = Date.now();
    }
  }

  public reconnectPlayer(sessionId: string, newSocketId: string): boolean {
    const player = this.players.find(p => p.sessionId === sessionId);
    if (!player) return false;

    player.id = newSocketId;
    player.isConnected = true;
    player.disconnectTime = null;
    return true;
  }

  public getActivePlayer(): BhabhoPlayer | null {
    if (this.players.length === 0) return null;
    return this.players[this.currentTurnIndex] || null;
  }

  public getActivePlayers(): BhabhoPlayer[] {
    return this.players.filter(p => !p.isFinished && p.cards.length > 0);
  }

  public startGame(requesterId?: string): { success: boolean; error?: string } {
    if (requesterId) {
      const requester = this.players.find(p => p.id === requesterId);
      if (!requester?.isHost) {
        return { success: false, error: "Only the host can start the game." };
      }
    }

    // Promote waiting spectators into available player seats
    while (this.players.length < 5 && this.spectators.length > 0) {
      const nextSpectator = this.spectators.shift()!;
      this.players.push({
        id: nextSpectator.id,
        sessionId: nextSpectator.sessionId,
        name: nextSpectator.name,
        avatarColor: nextSpectator.avatarColor,
        isHost: false,
        isConnected: true,
        disconnectTime: null,
        seatIndex: this.players.length,
        cards: [],
        isFinished: false,
        rank: null,
      });
    }

    if (this.players.length < 2) {
      return { success: false, error: "Need at least 2 players to start Bhabho (3-5 recommended)." };
    }

    this.status = 'PLAYING';
    this.currentTrick = [];
    this.leadSuit = null;
    this.currentTrickStarterId = null;
    this.wastePileCount = 0;
    this.escapedPlayerIds = [];
    this.roundNumber = 1;
    this.isFirstTrickOfGame = true;
    this.lastTrickResult = null;
    this.rankings = [];
    this.winner = null;
    this.isResolvingTrick = false;
    if (this.trickResolutionTimer) {
      clearTimeout(this.trickResolutionTimer);
      this.trickResolutionTimer = null;
    }

    // Distribute full 52 cards deck among all players
    const deck = shuffleDeck(createDeck());
    const totalPlayers = this.players.length;

    this.players.forEach((player) => {
      player.cards = [];
      player.isFinished = false;
      player.rank = null;
    });

    // Deal all 52 cards clockwise
    deck.forEach((card, index) => {
      const targetPlayerIndex = index % totalPlayers;
      this.players[targetPlayerIndex].cards.push(card);
    });

    // Sort each player's hand by suit and rank for great visual grouping
    this.players.forEach(player => {
      player.cards = sortBhabhoCards(player.cards);
    });

    // Rule: The player holding the Ace of Spades (♠ A / Hukkum Ka Ikka) MUST start the first trick!
    const aceOfSpadesHolderIndex = this.players.findIndex(p =>
      p.cards.some(c => c.suit === 'S' && c.rank === 'A')
    );

    this.currentTurnIndex = aceOfSpadesHolderIndex >= 0 ? aceOfSpadesHolderIndex : 0;
    const startingPlayer = this.players[this.currentTurnIndex];
    this.currentTrickStarterId = startingPlayer.id;

    this.latestActionMessage = `${startingPlayer.name} holds the Ace of Spades (♠ A) and opens the table!`;

    this.startTurnTimer();
    return { success: true };
  }

  // Determine legal card IDs for the given player
  public getLegalCardIds(player: BhabhoPlayer): string[] {
    if (this.status !== 'PLAYING') return [];
    const activePlayer = this.getActivePlayer();
    if (!activePlayer || activePlayer.id !== player.id) return [];
    if (player.cards.length === 0 || player.isFinished) return [];

    // Case 1: Starting a new trick
    if (this.currentTrick.length === 0) {
      if (this.isFirstTrickOfGame) {
        // Must play the Ace of Spades (♠ A)
        const aceOfSpades = player.cards.find(c => c.suit === 'S' && c.rank === 'A');
        if (aceOfSpades) {
          return [aceOfSpades.id];
        }
      }
      // Any card in hand can be led
      return player.cards.map(c => c.id);
    }

    // Case 2: Following in an active trick (leadSuit is set)
    if (this.leadSuit) {
      const cardsOfLeadSuit = player.cards.filter(c => c.suit === this.leadSuit);
      if (cardsOfLeadSuit.length > 0) {
        // Player MUST follow suit!
        return cardsOfLeadSuit.map(c => c.id);
      }
      // Player has NO card of the lead suit: Can play ANY card as a THULLA!
      return player.cards.map(c => c.id);
    }

    return player.cards.map(c => c.id);
  }

  public playCard(playerId: string, cardId: string): { success: boolean; error?: string } {
    if (this.status !== 'PLAYING') {
      return { success: false, error: 'Game is not currently active.' };
    }

    if (this.isResolvingTrick) {
      return { success: false, error: 'Trick is currently resolving, please wait.' };
    }

    const activePlayer = this.getActivePlayer();
    if (!activePlayer || activePlayer.id !== playerId) {
      return { success: false, error: "Not your turn to play." };
    }

    const cardIndex = activePlayer.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return { success: false, error: "Selected card is not in your hand." };
    }

    const legalCardIds = this.getLegalCardIds(activePlayer);
    if (!legalCardIds.includes(cardId)) {
      if (this.leadSuit) {
        return {
          success: false,
          error: `Suit follow rule violated! You have ${this.leadSuit} cards in your hand and must follow suit.`,
        };
      }
      return { success: false, error: "Illegal card play." };
    }

    const [card] = activePlayer.cards.splice(cardIndex, 1);

    // If starting a fresh trick, set the lead suit
    if (this.currentTrick.length === 0) {
      this.leadSuit = card.suit;
      this.currentTrickStarterId = activePlayer.id;
      this.isFirstTrickOfGame = false;
    }

    // Determine if this play constitutes a THULLA
    const isThulla = this.leadSuit !== null && card.suit !== this.leadSuit;

    this.currentTrick.push({
      card,
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      playerAvatar: activePlayer.avatarColor,
      isThulla,
      timestamp: Date.now(),
    });

    // Check if the current player emptied their hand with this play
    this.checkPlayerEscape(activePlayer);

    if (isThulla) {
      // ==========================================
      // THULLA TRIGGERED!
      // ==========================================
      // A player broke the suit because they had no cards of the lead suit.
      // The player who played the HIGHEST card of the lead suit in this trick
      // must pick up ALL cards currently on the table into their hand!
      const leadSuitCardsInTrick = this.currentTrick.filter(t => t.card.suit === this.leadSuit);

      // Find the trick card with the highest rank in lead suit
      let highestTrickCard = leadSuitCardsInTrick[0];
      for (const t of leadSuitCardsInTrick) {
        if ((RANK_ORDER[t.card.rank] || 0) > (RANK_ORDER[highestTrickCard.card.rank] || 0)) {
          highestTrickCard = t;
        }
      }

      const penalizedPlayer = this.players.find(p => p.id === highestTrickCard.playerId)!;
      const allTrickCards = this.currentTrick.map(t => t.card);

      this.lastTrickResult = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'THULLA',
        cards: allTrickCards,
        leadSuit: this.leadSuit!,
        winnerOrPenalizedPlayerId: penalizedPlayer.id,
        winnerOrPenalizedPlayerName: penalizedPlayer.name,
        thullaPlayerId: activePlayer.id,
        thullaPlayerName: activePlayer.name,
        highestCard: highestTrickCard.card,
        timestamp: Date.now(),
      };

      this.latestActionMessage = `💥 THULLA! ${activePlayer.name} threw ${card.rank}${card.suit}! ${penalizedPlayer.name} held highest ${this.leadSuit} (${highestTrickCard.card.rank}) and collects ${allTrickCards.length} cards!`;

      // Pause turn timer during the 2-second resolution window
      if (this.turnTimer) {
        clearInterval(this.turnTimer);
        this.turnTimer = null;
      }
      this.isResolvingTrick = true;

      // Broadcast state change IMMEDIATELY so all players see the final card placed on the table
      this.onStateChange();

      // 2-second break before clearing the cycle
      this.trickResolutionTimer = setTimeout(() => {
        this.trickResolutionTimer = null;
        if (this.status !== 'PLAYING') return;

        // Transfer all trick cards into penalized player's hand
        penalizedPlayer.cards.push(...allTrickCards);
        penalizedPlayer.cards = sortBhabhoCards(penalizedPlayer.cards);

        // In case penalized player had just emptied their hand in this trick, they are back in the game!
        if (penalizedPlayer.isFinished) {
          penalizedPlayer.isFinished = false;
          penalizedPlayer.rank = null;
          this.escapedPlayerIds = this.escapedPlayerIds.filter(id => id !== penalizedPlayer.id);
        }

        // Reset trick
        this.currentTrick = [];
        this.leadSuit = null;
        this.roundNumber++;
        this.isResolvingTrick = false;

        // Check if game over
        if (this.checkGameOver()) {
          return;
        }

        // Penalized player leads the next trick!
        const nextTurnIndex = this.players.findIndex(p => p.id === penalizedPlayer.id);
        this.currentTurnIndex = nextTurnIndex >= 0 ? nextTurnIndex : 0;
        this.currentTrickStarterId = penalizedPlayer.id;

        this.startTurnTimer();
        this.onStateChange();
      }, this.trickDelayMs);

      return { success: true };
    }

    // ==========================================
    // CLEAN PLAY (FOLLOWED SUIT)
    // ==========================================
    // Has the trick completed?
    // A trick completes when every active player who was in the game for this trick has played
    const trickComplete = this.isTrickComplete();

    if (trickComplete) {
      // Trick finished cleanly without any thulla!
      // The player who played the HIGHEST card of the lead suit wins the trick.
      let highestTrickCard = this.currentTrick[0];
      for (const t of this.currentTrick) {
        if ((RANK_ORDER[t.card.rank] || 0) > (RANK_ORDER[highestTrickCard.card.rank] || 0)) {
          highestTrickCard = t;
        }
      }

      const winnerPlayer = this.players.find(p => p.id === highestTrickCard.playerId)!;
      const allTrickCards = this.currentTrick.map(t => t.card);

      this.lastTrickResult = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'CLEARED',
        cards: allTrickCards,
        leadSuit: this.leadSuit!,
        winnerOrPenalizedPlayerId: winnerPlayer.id,
        winnerOrPenalizedPlayerName: winnerPlayer.name,
        highestCard: highestTrickCard.card,
        timestamp: Date.now(),
      };

      this.latestActionMessage = `✨ Clean Trick! ${winnerPlayer.name} won with highest ${this.leadSuit} (${highestTrickCard.card.rank}). Clearing ${this.currentTrick.length} cards...`;

      // Pause turn timer during the 2-second resolution window
      if (this.turnTimer) {
        clearInterval(this.turnTimer);
        this.turnTimer = null;
      }
      this.isResolvingTrick = true;

      // Broadcast state change IMMEDIATELY so all players see the final card placed on the table
      this.onStateChange();

      // 2-second break before clearing the cycle
      this.trickResolutionTimer = setTimeout(() => {
        this.trickResolutionTimer = null;
        if (this.status !== 'PLAYING') return;

        // Cards are swept to the waste pile (no penalty)
        this.wastePileCount += allTrickCards.length;

        // Reset trick
        this.currentTrick = [];
        this.leadSuit = null;
        this.roundNumber++;
        this.isResolvingTrick = false;

        // Check if game over
        if (this.checkGameOver()) {
          return;
        }

        // Who leads the next trick?
        if (!winnerPlayer.isFinished && winnerPlayer.cards.length > 0) {
          // Trick winner leads!
          const nextIndex = this.players.findIndex(p => p.id === winnerPlayer.id);
          this.currentTurnIndex = nextIndex >= 0 ? nextIndex : 0;
        } else {
          // Winner emptied hand and escaped! Lead passes clockwise to next active player
          const winnerIndex = this.players.findIndex(p => p.id === winnerPlayer.id);
          this.currentTurnIndex = this.getNextActivePlayerIndex(winnerIndex);
        }

        this.currentTrickStarterId = this.players[this.currentTurnIndex]?.id || null;
        this.startTurnTimer();
        this.onStateChange();
      }, this.trickDelayMs);

      return { success: true };
    }

    // Trick is still ongoing: Pass turn to next active player clockwise
    this.currentTurnIndex = this.getNextActivePlayerIndex(this.currentTurnIndex);
    this.startTurnTimer();
    this.onStateChange();
    return { success: true };
  }

  private isTrickComplete(): boolean {
    // Collect IDs of players who have already played in the current trick
    const playedPlayerIds = new Set(this.currentTrick.map(t => t.playerId));

    // A trick is complete if all active players (who are not finished) have played
    const remainingToPlay = this.players.filter(p => !p.isFinished && !playedPlayerIds.has(p.id));
    return remainingToPlay.length === 0;
  }

  private checkPlayerEscape(player: BhabhoPlayer) {
    if (player.cards.length === 0 && !player.isFinished) {
      player.isFinished = true;
      this.escapedPlayerIds.push(player.id);
      player.rank = this.escapedPlayerIds.length;
      this.latestActionMessage = `🏃 ${player.name} emptied their hand and escaped (#${player.rank})!`;
    }
  }

  private getNextActivePlayerIndex(fromIndex: number): number {
    const total = this.players.length;
    for (let offset = 1; offset <= total; offset++) {
      const idx = (fromIndex + offset) % total;
      const p = this.players[idx];
      if (!p.isFinished && p.cards.length > 0) {
        return idx;
      }
    }
    return fromIndex;
  }

  private checkGameOver(): boolean {
    const activePlayers = this.getActivePlayers();

    // Game is over when at most 1 player remains with cards
    if (activePlayers.length <= 1) {
      this.status = 'GAME_OVER';
      if (this.turnTimer) {
        clearInterval(this.turnTimer);
        this.turnTimer = null;
      }

      // The last remaining player is the BHABHO (sole loser)!
      const loser = activePlayers[0] || null;
      if (loser) {
        loser.isFinished = true;
        loser.rank = this.players.length; // Final rank
        if (!this.escapedPlayerIds.includes(loser.id)) {
          this.escapedPlayerIds.push(loser.id);
        }
      }

      // Build structured rankings
      this.rankings = this.players.map(p => {
        const rank = p.rank || (p.id === loser?.id ? this.players.length : 1);
        const isBhabho = rank === this.players.length;
        const scoreEarned = isBhabho ? 0 : calculateRankPoints(rank, this.players.length);
        const coinsEarned = isBhabho ? 0 : calculateRankCoins(rank, this.players.length);

        let rewardCard: CollectibleRewardInfo | undefined;
        if (rank === 1) {
          rewardCard = drawRandomRewardCard(1);
        } else if (rank === 2) {
          rewardCard = drawRandomRewardCard(2);
        }

        return {
          playerId: p.id,
          name: p.name,
          avatarColor: p.avatarColor,
          rank,
          scoreEarned,
          coinsEarned,
          rewardCard,
        };
      });

      // Sort rankings 1st to last
      this.rankings.sort((a, b) => a.rank - b.rank);

      const topEscaped = this.players.find(p => p.rank === 1);
      this.winner = topEscaped || this.players[0];

      if (loser) {
        this.latestActionMessage = `🃏 GAME OVER! ${loser.name} is the BHABHO! Everyone else escaped!`;
      } else {
        this.latestActionMessage = `🃏 GAME OVER! Match finished!`;
      }

      this.onGameOver?.(this);
      this.onStateChange();
      return true;
    }

    return false;
  }

  private startTurnTimer() {
    if (this.turnTimer) {
      clearInterval(this.turnTimer);
      this.turnTimer = null;
    }

    const DURATION_SEC = 30;
    this.turnDeadline = Date.now() + DURATION_SEC * 1000;
    this.turnTimeRemaining = DURATION_SEC;

    this.turnTimer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((this.turnDeadline - Date.now()) / 1000));
      this.turnTimeRemaining = remaining;

      if (remaining <= 0) {
        if (this.turnTimer) {
          clearInterval(this.turnTimer);
          this.turnTimer = null;
        }
        this.handleTurnTimeout();
      } else {
        this.onStateChange();
      }
    }, 1000);
  }

  private handleTurnTimeout() {
    const activePlayer = this.getActivePlayer();
    if (!activePlayer || activePlayer.cards.length === 0) return;

    const legalCardIds = this.getLegalCardIds(activePlayer);
    if (legalCardIds.length === 0) return;

    // Pick the lowest ranked legal card to auto-play
    let cardToPlayId = legalCardIds[0];
    let lowestVal = 999;

    for (const cid of legalCardIds) {
      const c = activePlayer.cards.find(card => card.id === cid);
      if (c) {
        const val = RANK_ORDER[c.rank] || 0;
        if (val < lowestVal) {
          lowestVal = val;
          cardToPlayId = c.id;
        }
      }
    }

    this.playCard(activePlayer.id, cardToPlayId);
  }

  public playAgain(hostSocketId: string): { success: boolean; error?: string } {
    const host = this.players.find(p => p.id === hostSocketId);
    if (!host || !host.isHost) {
      return { success: false, error: "Only the host can start a new match." };
    }
    // Promote waiting spectators into available player seats
    while (this.players.length < 5 && this.spectators.length > 0) {
      const nextSpectator = this.spectators.shift()!;
      this.players.push({
        id: nextSpectator.id,
        sessionId: nextSpectator.sessionId,
        name: nextSpectator.name,
        avatarColor: nextSpectator.avatarColor,
        isHost: false,
        isConnected: true,
        disconnectTime: null,
        seatIndex: this.players.length,
        cards: [],
        isFinished: false,
        rank: null,
      });
    }
    return this.startGame(hostSocketId);
  }

  public kickPlayer(hostSocketId: string, targetPlayerId: string): boolean {
    const host = this.players.find(p => p.id === hostSocketId);
    if (!host || !host.isHost || hostSocketId === targetPlayerId) return false;

    const idx = this.players.findIndex(p => p.id === targetPlayerId);
    if (idx === -1) return false;

    this.removePlayer(targetPlayerId);
    this.onStateChange();
    return true;
  }

  // Safe client view (player sees ONLY their own cards!)
  public getClientView(requesterSocketId: string): GameStateClientView {
    const requestingPlayer = this.players.find(p => p.id === requesterSocketId);
    const activePlayer = this.getActivePlayer();
    const isSpectator = !requestingPlayer && this.spectators.some(s => s.id === requesterSocketId);

    const isMyTurn = activePlayer?.id === requesterSocketId;
    const legalCardIds = requestingPlayer ? this.getLegalCardIds(requestingPlayer) : [];

    // Find highest lead card in current trick
    let highestLeadCard: { card: Card; playerId: string; playerName: string } | null = null;
    if (this.leadSuit && this.currentTrick.length > 0) {
      const leadCards = this.currentTrick.filter(t => t.card.suit === this.leadSuit);
      if (leadCards.length > 0) {
        let best = leadCards[0];
        for (const t of leadCards) {
          if ((RANK_ORDER[t.card.rank] || 0) > (RANK_ORDER[best.card.rank] || 0)) {
            best = t;
          }
        }
        highestLeadCard = {
          card: best.card,
          playerId: best.playerId,
          playerName: best.playerName,
        };
      }
    }

    const playersClientView: PlayerClientView[] = this.players.map(p => ({
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
      isFinished: p.isFinished,
      rank: p.rank,
    }));

    const bhabhoState: BhabhoStateClientView = {
      leadSuit: this.leadSuit,
      currentTrick: this.currentTrick,
      currentTrickStarterId: this.currentTrickStarterId,
      highestLeadCard,
      lastTrickResult: this.lastTrickResult,
      myHand: requestingPlayer ? requestingPlayer.cards : [],
      wastePileCount: this.wastePileCount,
      escapedPlayerIds: this.escapedPlayerIds,
      latestActionMessage: this.latestActionMessage,
      roundNumber: this.roundNumber,
      canPlayCardIds: isMyTurn && !this.isResolvingTrick ? legalCardIds : [],
      isResolvingTrick: this.isResolvingTrick,
    };

    return {
      roomCode: this.roomCode,
      gameType: 'BHABHO',
      status: this.status,
      players: playersClientView,
      myPlayerId: requesterSocketId,
      currentTurnPlayerId: activePlayer?.id || '',
      centerBaseRank: null,
      centerDecks: [],
      centerCard: null,
      centerCount: this.currentTrick.length,
      turnTimeRemaining: this.turnTimeRemaining,
      myFloatingCard: null,
      bluffState: null,
      bhabhoState,
      lastMove: null,
      isSpectator,
      spectatorCount: this.spectators.length,
      autoAbortTimer: this.autoAbortTimer,
      winner: this.winner ? {
        id: this.winner.id,
        name: this.winner.name,
        avatarColor: this.winner.avatarColor,
      } : this.rankings[0] ? {
        id: this.rankings[0].playerId,
        name: this.rankings[0].name,
        avatarColor: this.rankings[0].avatarColor,
      } : null,
      rankings: this.rankings,
    };
  }
}
