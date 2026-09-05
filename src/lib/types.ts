export type Suit = 'H' | 'D' | 'C' | 'S';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export interface PlayerClientView {
  id: string;
  sessionId: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  isConnected: boolean;
  seatIndex: number;
  hiddenCount: number;
  rightDeckTop: Card | null;
  rightDeckCount: number;
  isBazaarOpen: boolean;
  hasFloatingCard: boolean;
  isFinished?: boolean;
  rank?: number | null;
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
  }>;
}
