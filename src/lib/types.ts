export type Suit = 'H' | 'D' | 'C' | 'S';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type GameType = 'DUKKI_BAZAAR' | 'BLUFF_MASTER';

export interface PlayerClientView {
  id: string;
  sessionId: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  isConnected: boolean;
  seatIndex: number;
  hiddenCount: number;
  cardsCount?: number; // total cards held (for Bluff Master)
  rightDeckTop: Card | null;
  rightDeckCount: number;
  isBazaarOpen: boolean;
  hasFloatingCard: boolean;
  floatingCard?: Card | null;
  isFinished?: boolean;
  rank?: number | null;
}

export interface BluffChallengeResult {
  id: string;
  challengerId: string;
  challengerName: string;
  challengerAvatar: string;
  accusedId: string;
  accusedName: string;
  accusedAvatar: string;
  declaredRank: Rank;
  cardsCount: number;
  revealedCards: Card[];
  wasBluff: boolean;
  penalizedPlayerId: string;
  penalizedPlayerName: string;
  cardsPenalizedCount: number;
  timestamp: number;
}

export interface BluffStateClientView {
  centerPileCount: number;
  currentDeclaredRank: Rank | null;
  currentClaimCount: number;
  latestPlayerId: string | null;
  latestPlayerName: string | null;
  latestPlayerAvatar?: string;
  lastChallengeResult: BluffChallengeResult | null;
  cycleLeaderId: string | null;
  passedPlayerIds: string[];
  isCycleCleared: boolean;
  myHand: Card[]; // The player's own cards for Bluff Master
  canChallenge: boolean;
  canPass: boolean;
  canAddCards: boolean;
  canLead: boolean;
  latestActionMessage?: string | null;
}

export interface PenaltyLog {
  id: string;
  timestamp: number;
  accuserName: string;
  accuserAvatar: string;
  targetName: string;
  targetAvatar: string;
  reason: string;
  isValid: boolean;
  penalizedPlayerName: string;
  cardsTransferred: number;
}

export interface CenterDeck {
  id: number; // 0, 1, 2, 3
  suit: Suit | null;
  cards: Card[];
  topCard: Card | null;
  isOpen: boolean;
  isCompleted: boolean;
  nextAcceptedRank: Rank | null;
}

export interface GameStateClientView {
  roomCode: string;
  gameType?: GameType;
  status: 'LOBBY' | 'PLAYING' | 'GAME_OVER';
  players: PlayerClientView[];
  myPlayerId: string;
  currentTurnPlayerId: string;
  centerBaseRank: Rank | null;
  centerDecks: CenterDeck[];
  centerCard: Card | null;
  centerCount: number;
  turnTimeRemaining: number;
  myFloatingCard: Card | null;
  bluffState?: BluffStateClientView | null;
  lastMove: {
    playerId: string;
    action: 'DRAW' | 'CENTER' | 'RIGHT_DECK' | 'TIMEOUT';
    targetPlayerId?: string;
    card?: Card;
    timestamp: number;
  } | null;
  activePenaltyAnimation?: {
    fromPlayerIds: string[];
    toPlayerId: string;
    cardsCount: number;
    penalizedName: string;
    isFalseAccusation: boolean;
    reason?: string;
  } | null;
  winner: {
    id: string;
    name: string;
    avatarColor: string;
  } | null;
  rankings?: Array<{
    playerId: string;
    name: string;
    avatarColor: string;
    rank: number;
    scoreEarned?: number;
    totalScore?: number;
    rewardCard?: {
      id: string;
      name: string;
      hindiName: string;
      rank: string;
      suit: string;
      family: string;
      rarity: string;
      power: number;
      collectorNumber: number;
      specialEffect?: string;
      accentColor: string;
      glowColor: string;
    };
  }>;
}

export interface CardFlightEvent {
  id: string;
  card: Card;
  fromPlayerId: string;
  fromPlayerName: string;
  fromSource: 'FLOATING' | 'RIGHT_DECK';
  targetType: 'CENTER' | 'RIGHT_DECK';
  targetDeckId?: number;
  targetPlayerId?: string;
  targetPlayerName?: string;
  isOwnRightDeck?: boolean;
  timestamp: number;
}

