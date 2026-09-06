import { Card, GameStateClientView, PenaltyLog, Player, PlayerClientView, Rank, Suit, CenterDeck } from './types';
import { createDeck, getNextRank, shuffleDeck } from './deck';
import { canPlayOnAnyCenterDeck, canPlayOnCenterDeck, canPlayOnOtherRightDeck } from './validator';

export function calculateRankPoints(rank: number, totalPlayers: number): number {
  if (totalPlayers >= 5) {
    if (rank === 1) return 2000;
    if (rank === 2) return 1000;
    if (rank === 3) return 500;
    if (rank === 4) return 250;
    if (rank === 5) return 100;
  } else if (totalPlayers === 4) {
    if (rank === 1) return 2000;
    if (rank === 2) return 1000;
    if (rank === 3) return 500;
    if (rank === 4) return 250;
  } else if (totalPlayers === 3) {
    if (rank === 1) return 2000;
    if (rank === 2) return 1000;
    if (rank === 3) return 500;
  } else {
    // 2 players
    if (rank === 1) return 2000;
    if (rank === 2) return 500;
  }
  return 100;
}

export class DukkiBazaarRoom {
  public roomCode: string;
  public status: 'LOBBY' | 'PLAYING' | 'GAME_OVER' = 'LOBBY';
  public players: Player[] = [];
  public currentTurnIndex: number = 0;
  public baseRank: Rank | null = null;
  public centerDecks: CenterDeck[] = [
    { id: 0, suit: null, cards: [], topCard: null, isOpen: false, isCompleted: false, nextAcceptedRank: null },
    { id: 1, suit: null, cards: [], topCard: null, isOpen: false, isCompleted: false, nextAcceptedRank: null },
    { id: 2, suit: null, cards: [], topCard: null, isOpen: false, isCompleted: false, nextAcceptedRank: null },
    { id: 3, suit: null, cards: [], topCard: null, isOpen: false, isCompleted: false, nextAcceptedRank: null },
  ];
  public centerBazaar: Card[] = [];
  public unusedCards: Card[] = [];
  public turnTimeRemaining: number = 30;
  public lastMove: {
    playerId: string;
    action: 'DRAW' | 'CENTER' | 'RIGHT_DECK' | 'TIMEOUT';
    targetPlayerId?: string;
    card?: Card;
    wasPriorityViolation?: boolean;
    timestamp: number;
  } | null = null;
  public penaltyHistory: PenaltyLog[] = [];
  public winner: Player | null = null;
  public rankings: Array<{ 
    playerId: string; 
    name: string; 
    avatarColor: string; 
    rank: number;
    scoreEarned?: number;
    totalScore?: number;
  }> = [];
  public activePenaltyAnimation: {
    fromPlayerIds: string[];
    toPlayerId: string;
    cardsCount: number;
    penalizedName: string;
    isFalseAccusation: boolean;
    reason?: string;
  } | null = null;

  private turnInterval: NodeJS.Timeout | null = null;
  private onStateChange: () => void;
  private onGameOver?: (room: DukkiBazaarRoom) => void;

  constructor(roomCode: string, onStateChange: () => void, onGameOver?: (room: DukkiBazaarRoom) => void) {
    this.roomCode = roomCode;
    this.onStateChange = onStateChange;
    this.onGameOver = onGameOver;
  }

  public addPlayer(data: { id: string; sessionId: string; name: string; avatarColor: string }): Player {
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

    const player: Player = {
      id: data.id,
      sessionId: data.sessionId,
      name: data.name.trim() || `Player ${this.players.length + 1}`,
      avatarColor: data.avatarColor,
      isHost: this.players.length === 0,
      isConnected: true,
      disconnectTime: null,
      seatIndex: this.players.length,
      hiddenCards: [],
      rightDeck: [],
      isBazaarOpen: false,
      floatingCard: null,
      isFinished: false,
      rank: null,
    };

    this.players.push(player);
    return player;
  }

  public reconnectPlayer(sessionId: string, newSocketId: string): Player | null {
    const player = this.players.find(p => p.sessionId === sessionId);
    if (player) {
      player.id = newSocketId;
      player.isConnected = true;
      player.disconnectTime = null;
      this.notifyState();
      return player;
    }
    return null;
  }

  public markDisconnected(socketId: string): void {
    const player = this.players.find(p => p.id === socketId);
    if (player) {
      player.isConnected = false;
      player.disconnectTime = Date.now();
      this.notifyState();
    }
  }

  public kickPlayer(hostSocketId: string, targetPlayerId: string): boolean {
    const host = this.players.find(p => p.id === hostSocketId);
    if (!host || !host.isHost || this.status !== 'LOBBY') return false;

    const idx = this.players.findIndex(p => p.id === targetPlayerId);
    if (idx !== -1 && !this.players[idx].isHost) {
      this.players.splice(idx, 1);
      // Re-index seats
      this.players.forEach((p, i) => { p.seatIndex = i; });
      this.notifyState();
      return true;
    }
    return false;
  }

  public removePlayer(socketId: string): void {
    const idx = this.players.findIndex(p => p.id === socketId);
    if (idx === -1) return;

    const leavingPlayer = this.players[idx];
    const wasHost = leavingPlayer.isHost;
    const wasCurrentTurn = (this.currentTurnIndex === idx);

    // If game was playing and player was still active (not finished), collect their cards
    const abandonedCards: Card[] = [];
    if (this.status === 'PLAYING' && !leavingPlayer.isFinished) {
      if (leavingPlayer.hiddenCards.length > 0) {
        abandonedCards.push(...leavingPlayer.hiddenCards);
      }
      if (leavingPlayer.rightDeck.length > 0) {
        abandonedCards.push(...leavingPlayer.rightDeck);
      }
      if (leavingPlayer.floatingCard) {
        abandonedCards.push(leavingPlayer.floatingCard);
      }
    }

    // Remove player from room
    this.players.splice(idx, 1);

    // Handle host reassignment
    if (wasHost && this.players.length > 0) {
      this.players[0].isHost = true;
    }

    // Re-index seats
    this.players.forEach((p, i) => { p.seatIndex = i; });

    // If no players remain
    if (this.players.length === 0) {
      this.cleanup();
      return;
    }

    // If game was playing, handle remaining game flow
    if (this.status === 'PLAYING') {
      const remainingActive = this.players.filter(p => !p.isFinished);

      // If 1 or 0 active players remain, wrap up the game!
      if (remainingActive.length <= 1) {
        if (remainingActive.length === 1) {
          const lastPlayer = remainingActive[0];
          lastPlayer.isFinished = true;
          const finalRank = this.rankings.length + 1;
          lastPlayer.rank = finalRank;
          this.rankings.push({
            playerId: lastPlayer.id,
            name: lastPlayer.name,
            avatarColor: lastPlayer.avatarColor,
            rank: finalRank,
          });
          if (!this.winner) {
            this.winner = lastPlayer;
          }
        }
        // Compute score rewards for all players
        const totalMatchPlayers = this.players.length;
        for (const r of this.rankings) {
          r.scoreEarned = calculateRankPoints(r.rank, totalMatchPlayers);
        }
        this.status = 'GAME_OVER';
        this.stopTurnTimer();
        this.notifyState();
        this.onGameOver?.(this);
        return;
      }

      // Distribute abandoned cards only among ACTIVE (non-finished) remaining players!
      if (abandonedCards.length > 0 && remainingActive.length > 0) {
        const shuffledAbandoned = shuffleDeck(abandonedCards);
        const remCount = remainingActive.length;
        const baseCardsPerPlayer = Math.floor(shuffledAbandoned.length / remCount);
        const remainderCards = shuffledAbandoned.length % remCount;

        // 1. Distribute equal base cards to each active player's hidden deck
        let cardIdx = 0;
        for (const remPlayer of remainingActive) {
          const slice = shuffledAbandoned.slice(cardIdx, cardIdx + baseCardsPerPlayer);
          remPlayer.hiddenCards.push(...slice);
          cardIdx += baseCardsPerPlayer;
        }

        // 2. Distribute remainder cards to players with the fewest cards
        if (remainderCards > 0) {
          const sortedByCards = [...remainingActive].sort(
            (a, b) => (a.hiddenCards.length + a.rightDeck.length) - (b.hiddenCards.length + b.rightDeck.length)
          );

          for (let r = 0; r < remainderCards; r++) {
            const recipient = sortedByCards[r % sortedByCards.length];
            recipient.hiddenCards.push(shuffledAbandoned[cardIdx + r]);
          }
        }
      }

      // Handle turn advancement
      if (wasCurrentTurn) {
        this.advanceTurn();
      } else if (idx < this.currentTurnIndex) {
        this.currentTurnIndex--;
        if (this.currentTurnIndex >= this.players.length) {
          this.currentTurnIndex = 0;
        }
        if (this.players[this.currentTurnIndex]?.isFinished) {
          this.advanceTurn();
        }
      }

      this.lastMove = {
        playerId: leavingPlayer.id,
        action: 'TIMEOUT',
        timestamp: Date.now(),
      };
    }

    this.notifyState();
  }

  public startGame(hostSocketId: string): { success: boolean; error?: string } {
    const host = this.players.find(p => p.id === hostSocketId);
    if (!host || !host.isHost) {
      return { success: false, error: "Only the host can start the game." };
    }

    if (this.players.length < 3) {
      return { success: false, error: "Minimum 3 players required to start Dukki Bazaar." };
    }

    if (this.players.length > 5) {
      return { success: false, error: "Maximum 5 players allowed." };
    }

    // Reset game state
    const fullDeck = shuffleDeck(createDeck());
    
    // 1 card for initial center Bazaar establishes the Base Rank!
    const initialCenter = fullDeck.pop()!;
    this.baseRank = initialCenter.rank;
    this.centerBazaar = [initialCenter];

    // Initialize 4 Center Decks:
    // Deck 0: Started with initialCenter card
    // Decks 1, 2, 3: Three empty center decks on which cards of same started number can be dropped
    this.centerDecks = [
      {
        id: 0,
        suit: initialCenter.suit,
        cards: [initialCenter],
        topCard: initialCenter,
        isOpen: true,
        isCompleted: false,
        nextAcceptedRank: getNextRank(this.baseRank),
      },
      {
        id: 1,
        suit: null,
        cards: [],
        topCard: null,
        isOpen: false,
        isCompleted: false,
        nextAcceptedRank: this.baseRank,
      },
      {
        id: 2,
        suit: null,
        cards: [],
        topCard: null,
        isOpen: false,
        isCompleted: false,
        nextAcceptedRank: this.baseRank,
      },
      {
        id: 3,
        suit: null,
        cards: [],
        topCard: null,
        isOpen: false,
        isCompleted: false,
        nextAcceptedRank: this.baseRank,
      },
    ];

    // Distribute remaining 51 cards equally among players
    const playerCount = this.players.length;
    const cardsPerPlayer = Math.floor(fullDeck.length / playerCount);

    for (const player of this.players) {
      player.hiddenCards = fullDeck.splice(0, cardsPerPlayer);
      player.rightDeck = [];
      player.isBazaarOpen = false;
      player.floatingCard = null;
      player.isFinished = false;
      player.rank = null;
    }

    // Any remaining cards stay in unused stack
    this.unusedCards = fullDeck;

    this.status = 'PLAYING';
    this.currentTurnIndex = 0;
    this.lastMove = null;
    this.winner = null;
    this.rankings = [];
    this.penaltyHistory = [];
    this.activePenaltyAnimation = null;

    this.startTurnTimer();
    this.notifyState();
    return { success: true };
  }

  public getCurrentPlayer(): Player | null {
    if (this.status !== 'PLAYING' || this.players.length === 0) return null;
    return this.players[this.currentTurnIndex];
  }

  public drawCard(socketId: string): { success: boolean; card?: Card; error?: string } {
    if (this.status !== 'PLAYING') return { success: false, error: "Game not in progress." };

    const current = this.getCurrentPlayer();
    if (!current || current.id !== socketId) {
      return { success: false, error: "It is not your turn." };
    }

    if (current.floatingCard) {
      return { success: false, error: "You already have an active card drawn." };
    }

    if (current.hiddenCards.length === 0) {
      return { success: false, error: "No hidden cards remaining." };
    }

    const drawn = current.hiddenCards.pop()!;
    current.floatingCard = drawn;

    this.lastMove = {
      playerId: current.id,
      action: 'DRAW',
      timestamp: Date.now(),
    };

    this.notifyState();
    return { success: true, card: drawn };
  }

  private triggerAutoPenalty(offender: Player, reason: string): { cardsTransferred: number } {
    // Only players who have OPENED the bazaar donate 1 card to the penalized player
    const bazaarOpenDonors = this.players.filter(
      p => p.id !== offender.id && p.isBazaarOpen && p.hiddenCards.length > 0
    );

    let transferredCount = 0;
    const fromPlayerIds: string[] = [];

    for (const donor of bazaarOpenDonors) {
      const card = donor.hiddenCards.pop();
      if (card) {
        offender.hiddenCards.unshift(card); // goes to bottom of offender's hidden deck
        transferredCount++;
        fromPlayerIds.push(donor.id);
      }
    }

    const logEntry: PenaltyLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      accuserName: 'AUTO PENALTY',
      accuserAvatar: '#d4af37',
      targetName: offender.name,
      targetAvatar: offender.avatarColor,
      reason: reason,
      isValid: true,
      penalizedPlayerName: offender.name,
      cardsTransferred: transferredCount,
    };

    this.penaltyHistory.push(logEntry);

    this.activePenaltyAnimation = {
      fromPlayerIds,
      toPlayerId: offender.id,
      cardsCount: transferredCount,
      penalizedName: offender.name,
      isFalseAccusation: false,
      reason: reason,
    };

    setTimeout(() => {
      this.activePenaltyAnimation = null;
      this.notifyState();
    }, 3500);

    return { cardsTransferred: transferredCount };
  }

  public placeOnCenter(
    socketId: string,
    targetDeckId?: number,
    fromRightDeck?: boolean
  ): { success: boolean; error?: string; openedBazaar?: boolean; autoPenalized?: boolean; reason?: string } {
    if (this.status !== 'PLAYING') return { success: false, error: "Game not in progress." };

    const current = this.getCurrentPlayer();
    if (!current || current.id !== socketId) {
      return { success: false, error: "It is not your turn." };
    }

    let card: Card;
    if (fromRightDeck) {
      if (current.rightDeck.length === 0) {
        return { success: false, error: "Your right deck is empty." };
      }
      if (current.floatingCard) {
        return { success: false, error: "Please place your drawn card first." };
      }
      card = current.rightDeck[current.rightDeck.length - 1];
    } else {
      if (!current.floatingCard) {
        return { success: false, error: "Please draw a card from your hidden deck first." };
      }
      card = current.floatingCard;
    }

    // Determine target center deck
    let targetDeck: CenterDeck | undefined;
    if (typeof targetDeckId === 'number' && targetDeckId >= 0 && targetDeckId < this.centerDecks.length) {
      targetDeck = this.centerDecks[targetDeckId];
    } else {
      // Auto-target: check open deck matching suit, or first unopened deck if card is base rank
      const matchingOpen = this.centerDecks.find(d => d.isOpen && d.suit === card.suit && !d.isCompleted);
      if (matchingOpen) {
        targetDeck = matchingOpen;
      } else if (card.rank === this.baseRank) {
        const unopened = this.centerDecks.find(d => !d.isOpen);
        if (unopened) {
          targetDeck = unopened;
        }
      }
      if (!targetDeck) {
        targetDeck = this.centerDecks[0];
      }
    }

    const validation = canPlayOnCenterDeck(card, targetDeck, this.baseRank!, this.centerDecks);

    // If dragged on wrong center deck / wrong suit / wrong rank: AUTO PENALTY!
    if (!validation.valid) {
      const penaltyReason = validation.reason || `Invalid Center Play (${card.rank}${card.suit})`;
      
      if (!fromRightDeck) {
        // Floating card goes to offender's right deck
        current.rightDeck.push(card);
        current.floatingCard = null;
      }
      // If fromRightDeck, card is already on the right deck, remains there

      this.triggerAutoPenalty(current, penaltyReason);

      this.lastMove = {
        playerId: current.id,
        action: 'RIGHT_DECK',
        card,
        wasPriorityViolation: false,
        timestamp: Date.now(),
      };

      // Illegal move always ends turn
      this.advanceTurn();
      return { success: true, autoPenalized: true, reason: penaltyReason };
    }

    // Valid placement on target center deck!
    if (fromRightDeck) {
      current.rightDeck.pop();
    } else {
      current.floatingCard = null;
    }

    if (!targetDeck.isOpen) {
      targetDeck.isOpen = true;
      targetDeck.suit = card.suit;
    }
    targetDeck.cards.push(card);
    targetDeck.topCard = card;

    // Check if rail is completed (ends on rank right before baseRank)
    if (getNextRank(card.rank) === this.baseRank) {
      targetDeck.isCompleted = true;
      targetDeck.nextAcceptedRank = null;
    } else {
      targetDeck.nextAcceptedRank = getNextRank(card.rank);
    }

    this.centerBazaar.push(card);

    let openedBazaar = false;
    if (!current.isBazaarOpen) {
      current.isBazaarOpen = true;
      openedBazaar = true;
    }

    this.lastMove = {
      playerId: current.id,
      action: 'CENTER',
      card,
      wasPriorityViolation: false,
      timestamp: Date.now(),
    };

    if (this.checkWinCondition(current)) {
      this.handlePlayerFinished(current);
      return { success: true, openedBazaar };
    }

    // Per rules: As long as cards are placed validly in Center, turn continues!
    this.startTurnTimer();
    this.notifyState();
    return { success: true, openedBazaar };
  }

  public placeOnRightDeck(
    socketId: string,
    targetPlayerId: string,
    fromRightDeck?: boolean
  ): { success: boolean; error?: string; autoPenalized?: boolean; reason?: string } {
    if (this.status !== 'PLAYING') return { success: false, error: "Game not in progress." };

    const current = this.getCurrentPlayer();
    if (!current || current.id !== socketId) {
      return { success: false, error: "It is not your turn." };
    }

    const target = this.players.find(p => p.id === targetPlayerId);
    if (!target) {
      return { success: false, error: "Target player not found." };
    }

    let card: Card;
    if (fromRightDeck) {
      if (current.rightDeck.length === 0) {
        return { success: false, error: "Your right deck is empty." };
      }
      if (current.floatingCard) {
        return { success: false, error: "Please place your drawn card first." };
      }
      if (target.id === current.id) {
        return { success: false, error: "Card is already on your right deck." };
      }
      card = current.rightDeck[current.rightDeck.length - 1];
    } else {
      if (!current.floatingCard) {
        return { success: false, error: "Please draw a card from your hidden deck first." };
      }
      card = current.floatingCard;
    }

    const centerPlayable = canPlayOnAnyCenterDeck(card, this.centerDecks, this.baseRank);
    const couldHavePlayedCenter = centerPlayable.canPlay;

    if (target.id === current.id) {
      // Placing on own right deck (can only happen from floatingCard)
      target.rightDeck.push(card);
      current.floatingCard = null;

      if (couldHavePlayedCenter) {
        // Priority violation (Missed Center!)
        const reason = `Missed Center! ${card.rank}${card.suit} was playable on Center Deck ${centerPlayable.targetDeckId !== undefined ? (centerPlayable.targetDeckId + 1) : ''}.`;
        this.triggerAutoPenalty(current, reason);

        this.lastMove = {
          playerId: current.id,
          action: 'RIGHT_DECK',
          targetPlayerId: target.id,
          card,
          wasPriorityViolation: true,
          timestamp: Date.now(),
        };

        this.advanceTurn();
        return { success: true, autoPenalized: true, reason };
      }

      // Valid discard on own right deck - ENDS TURN!
      this.lastMove = {
        playerId: current.id,
        action: 'RIGHT_DECK',
        targetPlayerId: target.id,
        card,
        wasPriorityViolation: false,
        timestamp: Date.now(),
      };

      if (this.checkWinCondition(current)) {
        this.handlePlayerFinished(current);
        return { success: true };
      }

      this.advanceTurn();
      return { success: true };
    } else {
      // Placing on ANOTHER player's right deck
      if (couldHavePlayedCenter) {
        // Priority violation: Must play center if possible!
        if (!fromRightDeck) {
          current.rightDeck.push(card);
          current.floatingCard = null;
        }

        const reason = `Missed Center! ${card.rank}${card.suit} was playable on Center Deck ${centerPlayable.targetDeckId !== undefined ? (centerPlayable.targetDeckId + 1) : ''}.`;
        this.triggerAutoPenalty(current, reason);

        this.lastMove = {
          playerId: current.id,
          action: 'RIGHT_DECK',
          targetPlayerId: current.id,
          card,
          wasPriorityViolation: true,
          timestamp: Date.now(),
        };

        this.advanceTurn();
        return { success: true, autoPenalized: true, reason };
      }

      const targetTop = target.rightDeck.length > 0 ? target.rightDeck[target.rightDeck.length - 1] : null;
      const validation = canPlayOnOtherRightDeck(card, targetTop, current.isBazaarOpen);

      if (!validation.valid) {
        // Dragged onto opponent illegally: AUTO PENALTY!
        const reason = validation.reason || 'Illegal placement on opponent right deck';
        if (!fromRightDeck) {
          current.rightDeck.push(card);
          current.floatingCard = null;
        }

        this.triggerAutoPenalty(current, reason);

        this.lastMove = {
          playerId: current.id,
          action: 'RIGHT_DECK',
          targetPlayerId: current.id,
          card,
          wasPriorityViolation: false,
          timestamp: Date.now(),
        };

        this.advanceTurn();
        return { success: true, autoPenalized: true, reason };
      }

      // Valid placement onto opponent's right deck!
      if (fromRightDeck) {
        current.rightDeck.pop();
      } else {
        current.floatingCard = null;
      }
      target.rightDeck.push(card);

      this.lastMove = {
        playerId: current.id,
        action: 'RIGHT_DECK',
        targetPlayerId: target.id,
        card,
        wasPriorityViolation: false,
        timestamp: Date.now(),
      };

      if (this.checkWinCondition(current)) {
        this.handlePlayerFinished(current);
        return { success: true };
      }

      // Per rules: Valid placement on opponent right deck keeps turn!
      this.startTurnTimer();
      this.notifyState();
      return { success: true };
    }
  }

  public requestPenalty(
    accuserSocketId: string,
    targetPlayerId: string,
    reasonType: 'MISSED_CENTER' | 'WRONG_CARD_PLAYED' | 'INVALID_SEQUENCE'
  ): { success: boolean; result?: PenaltyLog; error?: string } {
    if (this.status !== 'PLAYING') {
      return { success: false, error: "Can only call penalties during active game." };
    }

    const accuser = this.players.find(p => p.id === accuserSocketId);
    if (!accuser) {
      return { success: false, error: "Accuser not found." };
    }

    if (!accuser.isBazaarOpen) {
      return { success: false, error: "Only players with BAZAAR OPEN can issue penalties!" };
    }

    const target = this.players.find(p => p.id === targetPlayerId);
    if (!target) {
      return { success: false, error: "Target player not found." };
    }

    if (accuser.id === target.id) {
      return { success: false, error: "You cannot accuse yourself." };
    }

    // Verify accusation against recent game history
    let isValid = false;

    if (reasonType === 'MISSED_CENTER') {
      // Valid if target's last action was placing on a right deck when center was playable
      if (this.lastMove && this.lastMove.playerId === target.id && this.lastMove.action === 'RIGHT_DECK') {
        isValid = !!this.lastMove.wasPriorityViolation;
      }
    } else if (reasonType === 'WRONG_CARD_PLAYED' || reasonType === 'INVALID_SEQUENCE') {
      // Valid if target placed a card illegally
      if (this.lastMove && this.lastMove.playerId === target.id) {
        isValid = !!this.lastMove.wasPriorityViolation;
      }
    }

    // Resolve consequence:
    // If valid -> target is punished
    // If invalid -> accuser is punished (false accusation penalty)
    const punishedPlayer = isValid ? target : accuser;
    const fromPlayers = this.players.filter(p => p.id !== punishedPlayer.id && p.hiddenCards.length > 0);

    let transferredCount = 0;
    const fromPlayerIds: string[] = [];

    for (const donor of fromPlayers) {
      const card = donor.hiddenCards.pop();
      if (card) {
        punishedPlayer.hiddenCards.unshift(card); // Put into bottom of hidden deck
        transferredCount++;
        fromPlayerIds.push(donor.id);
      }
    }

    const logEntry: PenaltyLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      accuserName: accuser.name,
      accuserAvatar: accuser.avatarColor,
      targetName: target.name,
      targetAvatar: target.avatarColor,
      reason: reasonType,
      isValid,
      penalizedPlayerName: punishedPlayer.name,
      cardsTransferred: transferredCount,
    };

    this.penaltyHistory.push(logEntry);

    // Trigger animated penalty flying cards on clients
    this.activePenaltyAnimation = {
      fromPlayerIds,
      toPlayerId: punishedPlayer.id,
      cardsCount: transferredCount,
      penalizedName: punishedPlayer.name,
      isFalseAccusation: !isValid,
    };

    // Auto-clear animation flag after 3 seconds
    setTimeout(() => {
      this.activePenaltyAnimation = null;
      this.notifyState();
    }, 3200);

    this.notifyState();
    return { success: true, result: logEntry };
  }

  public playAgain(hostSocketId: string): { success: boolean; error?: string } {
    const host = this.players.find(p => p.id === hostSocketId);
    if (!host || !host.isHost) {
      return { success: false, error: "Only the host can start a new match." };
    }
    return this.startGame(hostSocketId);
  }

  private advanceTurn(): void {
    if (this.players.length === 0) return;
    const activePlayers = this.players.filter(p => !p.isFinished);
    if (activePlayers.length <= 1) return;

    let attempts = 0;
    do {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
      attempts++;
    } while (this.players[this.currentTurnIndex]?.isFinished && attempts < this.players.length);

    this.startTurnTimer();
    this.notifyState();
  }

  private startTurnTimer(): void {
    this.stopTurnTimer();
    // Turn timer completely disabled per rules: Cards never disappear or expire
    this.turnTimeRemaining = 0;
  }

  private stopTurnTimer(): void {
    if (this.turnInterval) {
      clearInterval(this.turnInterval);
      this.turnInterval = null;
    }
  }

  private handleTimeout(): void {
    // Disabled: Turn does not time out automatically
  }

  private checkWinCondition(player: Player): boolean {
    return player.hiddenCards.length === 0 && player.rightDeck.length === 0 && player.floatingCard === null;
  }

  public handlePlayerFinished(player: Player): boolean {
    if (player.isFinished) return false;

    player.isFinished = true;
    const currentRank = this.rankings.length + 1;
    player.rank = currentRank;
    this.rankings.push({
      playerId: player.id,
      name: player.name,
      avatarColor: player.avatarColor,
      rank: currentRank,
    });

    if (!this.winner) {
      this.winner = player;
    }

    const remainingActive = this.players.filter(p => !p.isFinished);

    if (remainingActive.length <= 1) {
      if (remainingActive.length === 1) {
        const lastPlayer = remainingActive[0];
        lastPlayer.isFinished = true;
        const finalRank = this.rankings.length + 1;
        lastPlayer.rank = finalRank;
        this.rankings.push({
          playerId: lastPlayer.id,
          name: lastPlayer.name,
          avatarColor: lastPlayer.avatarColor,
          rank: finalRank,
        });
      }

      // Compute score rewards for all players
      const totalMatchPlayers = this.players.length;
      for (const r of this.rankings) {
        r.scoreEarned = calculateRankPoints(r.rank, totalMatchPlayers);
      }

      this.status = 'GAME_OVER';
      this.stopTurnTimer();
      this.notifyState();
      this.onGameOver?.(this);
      return true;
    }

    // Advance turn to next active player since this player is done
    this.advanceTurn();
    this.notifyState();
    return false;
  }

  public passTurn(socketId: string): { success: boolean; error?: string } {
    if (this.status !== 'PLAYING') return { success: false, error: "Game not in progress." };
    const current = this.getCurrentPlayer();
    if (!current || current.id !== socketId) return { success: false, error: "It is not your turn." };
    if (current.floatingCard) return { success: false, error: "Must play your drawn card first." };
    if (current.hiddenCards.length > 0) return { success: false, error: "You still have cards in your hidden deck to draw." };

    this.advanceTurn();
    return { success: true };
  }

  public getCenterCard(): Card | null {
    if (this.centerBazaar.length === 0) return null;
    return this.centerBazaar[this.centerBazaar.length - 1];
  }

  public getClientView(forPlayerSocketId: string): GameStateClientView {
    const currentTurnPlayer = this.getCurrentPlayer();
    const requestingPlayer = this.players.find(p => p.id === forPlayerSocketId);

    const clientPlayers: PlayerClientView[] = this.players.map(p => ({
      id: p.id,
      sessionId: p.sessionId,
      name: p.name,
      avatarColor: p.avatarColor,
      isHost: p.isHost,
      isConnected: p.isConnected,
      seatIndex: p.seatIndex,
      hiddenCount: p.hiddenCards.length,
      rightDeckTop: p.rightDeck.length > 0 ? p.rightDeck[p.rightDeck.length - 1] : null,
      rightDeckCount: p.rightDeck.length,
      isBazaarOpen: p.isBazaarOpen,
      hasFloatingCard: p.floatingCard !== null,
      floatingCard: p.floatingCard,
      isFinished: p.isFinished || false,
      rank: p.rank || null,
    }));

    return {
      roomCode: this.roomCode,
      status: this.status,
      players: clientPlayers,
      myPlayerId: forPlayerSocketId,
      currentTurnPlayerId: currentTurnPlayer?.id || '',
      centerBaseRank: this.baseRank,
      centerDecks: this.centerDecks,
      centerCard: this.getCenterCard(),
      centerCount: this.centerBazaar.length,
      turnTimeRemaining: this.turnTimeRemaining,
      myFloatingCard: requestingPlayer?.floatingCard || null,
      lastMove: this.lastMove,
      activePenaltyAnimation: this.activePenaltyAnimation,
      winner: this.winner ? {
        id: this.winner.id,
        name: this.winner.name,
        avatarColor: this.winner.avatarColor,
      } : null,
      rankings: this.rankings,
    };
  }

  private notifyState(): void {
    this.onStateChange();
  }

  public cleanup(): void {
    this.stopTurnTimer();
  }
}
