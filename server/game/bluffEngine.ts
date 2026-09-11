import { Card, GameStateClientView, PlayerClientView, Rank, Suit, BluffChallengeResult, BluffStateClientView } from './types';
import { createDeck, shuffleDeck } from './deck';
import { drawRandomRewardCard, CollectibleRewardInfo } from '../../src/lib/collectibles';

const RANK_ORDER: Record<Rank, number> = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13,
};

const SUIT_ORDER: Record<Suit, number> = {
  'S': 1, 'H': 2, 'C': 3, 'D': 4,
};

function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const rankDiff = (RANK_ORDER[a.rank] || 0) - (RANK_ORDER[b.rank] || 0);
    if (rankDiff !== 0) return rankDiff;
    return (SUIT_ORDER[a.suit] || 0) - (SUIT_ORDER[b.suit] || 0);
  });
}

export interface BluffPlayer {
  id: string; // socket.id
  sessionId: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  isConnected: boolean;
  disconnectTime: number | null;
  seatIndex: number;
  cards: Card[]; // Private hand
  isFinished: boolean;
  rank: number | null;
}

export class BluffMasterRoom {
  public roomCode: string;
  public gameType: 'BLUFF_MASTER' = 'BLUFF_MASTER';
  public status: 'LOBBY' | 'PLAYING' | 'GAME_OVER' = 'LOBBY';
  public players: BluffPlayer[] = [];
  public currentTurnIndex: number = 0;
  
  // Bluff Center State
  public centerPile: Card[] = [];
  public latestPlayedCards: Card[] = [];
  public latestPlayerId: string | null = null;
  public latestPlayerName: string | null = null;
  public latestPlayerAvatar: string | null = null;
  public currentDeclaredRank: Rank | null = null;
  public currentClaimCount: number = 0;
  public cycleLeaderId: string | null = null;
  public passedPlayerIds: string[] = [];
  public isCycleCleared: boolean = false;
  public lastChallengeResult: BluffChallengeResult | null = null;
  public latestActionMessage: string | null = null;

  public turnTimeRemaining: number = 30;
  public rankings: Array<{
    playerId: string;
    name: string;
    avatarColor: string;
    rank: number;
    scoreEarned?: number;
    rewardCard?: CollectibleRewardInfo;
  }> = [];

  private turnInterval: NodeJS.Timeout | null = null;
  private onStateChange: () => void;
  private onGameOver?: (room: BluffMasterRoom) => void;

  constructor(roomCode: string, onStateChange: () => void, onGameOver?: (room: BluffMasterRoom) => void) {
    this.roomCode = roomCode;
    this.onStateChange = onStateChange;
    this.onGameOver = onGameOver;
  }

  public addPlayer(data: { id: string; sessionId: string; name: string; avatarColor: string }): BluffPlayer {
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

    const player: BluffPlayer = {
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
      // If during game, pass turn if active
      if (this.players[this.currentTurnIndex]?.id === socketId) {
        this.advanceTurn();
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

  public startGame(requesterId?: string): { success: boolean; error?: string } {
    if (requesterId) {
      const requester = this.players.find(p => p.id === requesterId);
      if (!requester?.isHost) {
        return { success: false, error: "Only the host can start the game." };
      }
    }

    if (this.players.length < 2) {
      return { success: false, error: "Need at least 2 players to start Bluff Master." };
    }

    this.status = 'PLAYING';
    this.centerPile = [];
    this.latestPlayedCards = [];
    this.latestPlayerId = null;
    this.latestPlayerName = null;
    this.latestPlayerAvatar = null;
    this.currentDeclaredRank = null;
    this.currentClaimCount = 0;
    this.cycleLeaderId = null;
    this.passedPlayerIds = [];
    this.isCycleCleared = false;
    this.lastChallengeResult = null;
    this.rankings = [];

    // Distribute full 52 cards deck among 2 to 5 players
    const deck = shuffleDeck(createDeck());
    const totalPlayers = this.players.length;

    this.players.forEach((player, idx) => {
      player.cards = [];
      player.isFinished = false;
      player.rank = null;
    });

    // Deal cards sequentially so count is evenly distributed
    deck.forEach((card, index) => {
      const targetPlayerIndex = index % totalPlayers;
      this.players[targetPlayerIndex].cards.push(card);
    });

    // Sort each player's hand by rank for easy fanned-out viewing
    this.players.forEach(player => {
      player.cards = sortCards(player.cards);
    });

    // Randomize first turn or start with host
    this.currentTurnIndex = 0;
    this.cycleLeaderId = this.players[0].id;
    this.latestActionMessage = `${this.players[0].name} starts the match. Lead with any claim!`;

    this.startTurnTimer();
    return { success: true };
  }

  private startTurnTimer() {
    if (this.turnInterval) clearInterval(this.turnInterval);
    this.turnTimeRemaining = 30;

    this.turnInterval = setInterval(() => {
      this.turnTimeRemaining--;
      if (this.turnTimeRemaining <= 0) {
        this.handleTurnTimeout();
      }
      this.onStateChange();
    }, 1000);
  }

  private handleTurnTimeout() {
    const activePlayer = this.getActivePlayer();
    if (!activePlayer) return;

    // If there is an active cycle claim, auto-pass on timeout
    if (this.currentDeclaredRank) {
      this.passTurn(activePlayer.id);
    } else {
      // If leading a fresh cycle, auto-play first card of hand honestly
      if (activePlayer.cards.length > 0) {
        const card = activePlayer.cards[0];
        this.playCards(activePlayer.id, [card.id], card.rank);
      } else {
        this.advanceTurn();
      }
    }
  }

  public getActivePlayer(): BluffPlayer | null {
    if (this.status !== 'PLAYING') return null;
    return this.players[this.currentTurnIndex] || null;
  }

  private advanceTurn() {
    if (this.status !== 'PLAYING') return;

    let attempts = 0;
    do {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
      attempts++;
    } while (this.players[this.currentTurnIndex].isFinished && attempts <= this.players.length);

    this.turnTimeRemaining = 30;
    this.onStateChange();
  }

  // 1. Play Claim (Lead or Add Cards)
  public playCards(playerId: string, cardIds: string[], declaredRank: Rank): { success: boolean; error?: string } {
    if (this.status !== 'PLAYING') return { success: false, error: "Game is not in progress." };

    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: "Player not found." };

    const activePlayer = this.getActivePlayer();
    if (activePlayer?.id !== playerId) {
      return { success: false, error: "It is not your turn." };
    }

    if (!cardIds || cardIds.length === 0) {
      return { success: false, error: "Select at least 1 card to play." };
    }

    // Verify player actually holds these cards
    const cardsToPlay: Card[] = [];
    for (const cId of cardIds) {
      const found = player.cards.find(c => c.id === cId);
      if (!found) {
        return { success: false, error: "Card not in hand." };
      }
      cardsToPlay.push(found);
    }

    // If continuing an active cycle, declared rank MUST match current cycle rank
    if (this.currentDeclaredRank && declaredRank !== this.currentDeclaredRank) {
      return { success: false, error: `Must play as the active claim rank: ${this.currentDeclaredRank}` };
    }

    // Remove played cards from player's hand
    player.cards = player.cards.filter(c => !cardIds.includes(c.id));

    // Place cards face down onto the center pile
    this.centerPile.push(...cardsToPlay);
    this.latestPlayedCards = cardsToPlay;
    this.latestPlayerId = player.id;
    this.latestPlayerName = player.name;
    this.latestPlayerAvatar = player.avatarColor;
    this.currentDeclaredRank = declaredRank;
    this.currentClaimCount = cardIds.length;
    this.passedPlayerIds = []; // reset passes on new card play
    this.isCycleCleared = false;
    this.lastChallengeResult = null;

    this.latestActionMessage = `${player.name} played ${cardIds.length} card(s) as "${declaredRank}"`;

    // Check if player emptied their hand on this play!
    // Note: Other players still get 1 turn to call "Show" on this final play!
    if (player.cards.length === 0) {
      this.latestActionMessage = `🚨 ${player.name} played their LAST card(s)! Challenge now if you suspect a bluff!`;
    }

    this.advanceTurn();
    this.startTurnTimer();
    return { success: true, message: this.latestActionMessage };
  }

  // 2. Challenge / Show (Call Bluff)
  public challenge(challengerId: string): { success: boolean; error?: string } {
    if (this.status !== 'PLAYING') return { success: false, error: "Game is not in progress." };

    const challenger = this.players.find(p => p.id === challengerId);
    if (!challenger) return { success: false, error: "Challenger not found." };

    if (!this.latestPlayerId || !this.currentDeclaredRank || this.latestPlayedCards.length === 0) {
      return { success: false, error: "No active play to challenge." };
    }

    if (this.latestPlayerId === challengerId) {
      return { success: false, error: "Cannot challenge your own play." };
    }

    const accused = this.players.find(p => p.id === this.latestPlayerId);
    if (!accused) return { success: false, error: "Target player not found." };

    // Inspect latest played cards
    const declaredRank = this.currentDeclaredRank;
    const revealedCards = [...this.latestPlayedCards];
    const wasBluff = revealedCards.some(card => card.rank !== declaredRank);

    const penalizedPlayer = wasBluff ? accused : challenger;
    const winnerOfChallenge = wasBluff ? challenger : accused;
    const pileCount = this.centerPile.length;

    // Transfer entire center pile to penalized player's hand
    penalizedPlayer.cards.push(...this.centerPile);
    penalizedPlayer.cards = sortCards(penalizedPlayer.cards);

    this.lastChallengeResult = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      challengerId: challenger.id,
      challengerName: challenger.name,
      challengerAvatar: challenger.avatarColor,
      accusedId: accused.id,
      accusedName: accused.name,
      accusedAvatar: accused.avatarColor,
      declaredRank,
      cardsCount: revealedCards.length,
      revealedCards,
      wasBluff,
      penalizedPlayerId: penalizedPlayer.id,
      penalizedPlayerName: penalizedPlayer.name,
      cardsPenalizedCount: pileCount,
      timestamp: Date.now(),
    };

    if (wasBluff) {
      this.latestActionMessage = `💥 BLUFF CAUGHT! ${accused.name} lied about "${declaredRank}"! ${accused.name} picks up all ${pileCount} cards!`;
    } else {
      this.latestActionMessage = `🛡️ HONEST PLAY! ${accused.name} told the truth about "${declaredRank}"! ${challenger.name} picks up all ${pileCount} cards!`;
    }

    // Reset center pile & cycle
    this.centerPile = [];
    this.latestPlayedCards = [];
    this.latestPlayerId = null;
    this.latestPlayerName = null;
    this.latestPlayerAvatar = null;
    this.currentDeclaredRank = null;
    this.currentClaimCount = 0;
    this.passedPlayerIds = [];
    this.isCycleCleared = true;

    // Check if any player finished
    this.checkWinConditions();

    // The winner of the challenge leads the next cycle
    const nextLeaderIndex = this.players.findIndex(p => p.id === winnerOfChallenge.id);
    if (nextLeaderIndex !== -1 && !winnerOfChallenge.isFinished) {
      this.currentTurnIndex = nextLeaderIndex;
      this.cycleLeaderId = winnerOfChallenge.id;
    } else {
      this.advanceTurn();
    }

    this.startTurnTimer();
    this.onStateChange();
    return { success: true, result: this.lastChallengeResult };
  }

  // 3. Pass Turn
  public passTurn(playerId: string): { success: boolean; error?: string } {
    if (this.status !== 'PLAYING') return { success: false, error: "Game is not in progress." };

    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: "Player not found." };

    const activePlayer = this.getActivePlayer();
    if (activePlayer?.id !== playerId) {
      return { success: false, error: "It is not your turn." };
    }

    if (!this.currentDeclaredRank) {
      return { success: false, error: "Cannot pass when leading a fresh cycle. You must declare a rank." };
    }

    if (!this.passedPlayerIds.includes(playerId)) {
      this.passedPlayerIds.push(playerId);
    }

    this.latestActionMessage = `${player.name} passed their turn.`;

    // Check if all OTHER active players have passed in succession back to the latest player who contributed cards!
    const activeUnfinishedPlayers = this.players.filter(p => !p.isFinished);
    const otherActivePlayers = activeUnfinishedPlayers.filter(p => p.id !== this.latestPlayerId);
    const allOthersPassed = otherActivePlayers.every(p => this.passedPlayerIds.includes(p.id));

    // If turn has travelled back to the player who played cards, and everyone else passed:
    // Cycle is SWEPT / DISCARDED from the table!
    const nextPlayerIndex = (this.currentTurnIndex + 1) % this.players.length;
    const nextPlayerId = this.players[nextPlayerIndex]?.id;

    if (allOthersPassed && nextPlayerId === this.latestPlayerId) {
      const sweptCount = this.centerPile.length;
      this.centerPile = [];
      this.latestPlayedCards = [];
      this.currentDeclaredRank = null;
      this.currentClaimCount = 0;
      this.passedPlayerIds = [];
      this.isCycleCleared = true;

      const cycleWinner = this.players.find(p => p.id === this.latestPlayerId);
      this.latestActionMessage = `🧹 All passed! Table pile (${sweptCount} cards) swept! ${cycleWinner?.name || 'Leader'} leads fresh cycle!`;

      // Check if the cycle winner had emptied their hand with that last play!
      if (cycleWinner && cycleWinner.cards.length === 0 && !cycleWinner.isFinished) {
        this.awardPlayerFinish(cycleWinner);
      }

      this.currentTurnIndex = nextPlayerIndex;
      this.cycleLeaderId = this.latestPlayerId;
      this.startTurnTimer();
      this.onStateChange();
      return { success: true };
    }

    this.advanceTurn();
    this.startTurnTimer();
    return { success: true };
  }

  private awardPlayerFinish(player: BluffPlayer) {
    if (player.isFinished) return;

    player.isFinished = true;
    const rankAwarded = this.rankings.length + 1;
    player.rank = rankAwarded;

    let score = 500;
    if (rankAwarded === 1) score = 2000;
    else if (rankAwarded === 2) score = 1000;
    else if (rankAwarded === 3) score = 500;

    const rewardCard = (rankAwarded === 1 || rankAwarded === 2) ? drawRandomRewardCard(rankAwarded) : undefined;

    this.rankings.push({
      playerId: player.id,
      name: player.name,
      avatarColor: player.avatarColor,
      rank: rankAwarded,
      scoreEarned: score,
      rewardCard,
    });

    this.latestActionMessage = `🎉 ${player.name} emptied their hand and took #${rankAwarded} place!`;
    this.checkWinConditions();
  }

  private checkWinConditions() {
    // Check if any player emptied their hand without pending challenges
    this.players.forEach(p => {
      if (p.cards.length === 0 && !p.isFinished && this.latestPlayerId !== p.id) {
        this.awardPlayerFinish(p);
      }
    });

    const unfinishedPlayers = this.players.filter(p => !p.isFinished);

    // If only 1 player remains with cards, match is over!
    if (unfinishedPlayers.length <= 1) {
      if (unfinishedPlayers.length === 1) {
        const lastPlayer = unfinishedPlayers[0];
        lastPlayer.isFinished = true;
        const lastRank = this.rankings.length + 1;
        lastPlayer.rank = lastRank;
        this.rankings.push({
          playerId: lastPlayer.id,
          name: lastPlayer.name,
          avatarColor: lastPlayer.avatarColor,
          rank: lastRank,
          scoreEarned: 50,
        });
      }

      this.status = 'GAME_OVER';
      if (this.turnInterval) {
        clearInterval(this.turnInterval);
        this.turnInterval = null;
      }

      this.onStateChange();
      if (this.onGameOver) {
        this.onGameOver(this);
      }
    }
  }

  public playAgain(hostSocketId: string): { success: boolean; error?: string } {
    const host = this.players.find(p => p.id === hostSocketId);
    if (!host || !host.isHost) {
      return { success: false, error: "Only the host can start a new match." };
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

  // Generate safe client view (player sees ONLY their own cards!)
  public getClientView(requesterSocketId: string): GameStateClientView {
    const requestingPlayer = this.players.find(p => p.id === requesterSocketId);
    const activePlayer = this.getActivePlayer();

    const isMyTurn = activePlayer?.id === requesterSocketId;
    const canChallenge = !!(
      this.status === 'PLAYING' &&
      this.latestPlayerId &&
      this.latestPlayerId !== requesterSocketId &&
      this.latestPlayedCards.length > 0
    );

    const canPass = !!(
      this.status === 'PLAYING' &&
      isMyTurn &&
      this.currentDeclaredRank !== null
    );

    const canAddCards = !!(
      this.status === 'PLAYING' &&
      isMyTurn &&
      this.currentDeclaredRank !== null &&
      requestingPlayer &&
      requestingPlayer.cards.length > 0
    );

    const canLead = !!(
      this.status === 'PLAYING' &&
      isMyTurn &&
      this.currentDeclaredRank === null &&
      requestingPlayer &&
      requestingPlayer.cards.length > 0
    );

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

    const bluffState: BluffStateClientView = {
      centerPileCount: this.centerPile.length,
      currentDeclaredRank: this.currentDeclaredRank,
      currentClaimCount: this.currentClaimCount,
      latestPlayerId: this.latestPlayerId,
      latestPlayerName: this.latestPlayerName,
      latestPlayerAvatar: this.latestPlayerAvatar || undefined,
      lastChallengeResult: this.lastChallengeResult,
      cycleLeaderId: this.cycleLeaderId,
      passedPlayerIds: this.passedPlayerIds,
      isCycleCleared: this.isCycleCleared,
      myHand: requestingPlayer ? requestingPlayer.cards : [],
      canChallenge,
      canPass,
      canAddCards,
      canLead,
      latestActionMessage: this.latestActionMessage,
    };

    return {
      roomCode: this.roomCode,
      gameType: 'BLUFF_MASTER',
      status: this.status,
      players: playersClientView,
      myPlayerId: requesterSocketId,
      currentTurnPlayerId: activePlayer?.id || '',
      centerBaseRank: null,
      centerDecks: [],
      centerCard: null,
      centerCount: this.centerPile.length,
      turnTimeRemaining: this.turnTimeRemaining,
      myFloatingCard: null,
      bluffState,
      lastMove: null,
      winner: this.rankings[0] ? {
        id: this.rankings[0].playerId,
        name: this.rankings[0].name,
        avatarColor: this.rankings[0].avatarColor,
      } : null,
      rankings: this.rankings,
    };
  }
}
