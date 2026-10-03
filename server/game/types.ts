export type Suit = 'H' | 'D' | 'C' | 'S'; // Hearts, Diamonds, Clubs, Spades
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string; // e.g. "H-A", "S-10", "jkr-1-red"
  suit: Suit;
  rank: Rank;
  isJoker?: boolean;
}

export interface Player {
  id: string; // socket ID
  sessionId: string; // persistent client ID for reconnects
  name: string;
  avatarColor: string;
  isHost: boolean;
  isConnected: boolean;
  disconnectTime: number | null;
  seatIndex: number;
  hiddenCards: Card[]; // Server-side full deck! Never transmitted wholly to clients.
  rightDeck: Card[];   // Server-side right deck stack
  isBazaarOpen: boolean;
  floatingCard: Card | null;
  isFinished?: boolean;
  rank?: number | null;
}

export type GameType = 'DUKKI_BAZAAR' | 'BLUFF_MASTER' | 'BHABHO' | 'DOCTOR';

export interface PlayerClientView {
  id: string;
  sessionId: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  isConnected: boolean;
  seatIndex: number;
  hiddenCount: number;
  cardsCount?: number;
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
  playSeq?: number;
}

export interface BhabhoTrickCard {
  card: Card;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  isThulla: boolean;
  timestamp: number;
}

export interface BhabhoLastTrickResult {
  id: string;
  type: 'CLEARED' | 'THULLA';
  cards: Card[];
  leadSuit: Suit;
  winnerOrPenalizedPlayerId: string;
  winnerOrPenalizedPlayerName: string;
  thullaPlayerId?: string;
  thullaPlayerName?: string;
  highestCard?: Card;
  timestamp: number;
}

export interface BhabhoStateClientView {
  leadSuit: Suit | null;
  currentTrick: BhabhoTrickCard[];
  currentTrickStarterId: string | null;
  highestLeadCard: {
    card: Card;
    playerId: string;
    playerName: string;
  } | null;
  lastTrickResult: BhabhoLastTrickResult | null;
  myHand: Card[]; // The player's own private hand
  wastePileCount: number;
  escapedPlayerIds: string[]; // List of players who have successfully gotten away
  latestActionMessage?: string | null;
  roundNumber: number;
  canPlayCardIds: string[]; // List of card IDs in player's hand that are legal to play
  isResolvingTrick?: boolean; // 2-second pause when trick finishes so players see the last played card
}

export interface PenaltyReason {
  type: 'MISSED_CENTER' | 'WRONG_CARD_PLAYED' | 'INVALID_SEQUENCE';
  description: string;
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

export interface DoctorConfig {
  cardsPerPlayer: 8 | 10 | 12;
  showLimit: number; // 10 to 15
  totalRounds: number; // 1 to 10
}

export interface DoctorRoundScore {
  roundNumber: number;
  scores: Record<string, number>; // Points added this round (0 for winner)
  handSums: Record<string, number>; // Hand sum of each player
  callerId: string;
  callerName: string;
  winnerId: string;
  winnerName: string;
  isWrongShow: boolean;
  penaltyPlayerId?: string;
  penaltyPoints?: number;
  revealedHands: Record<string, Card[]>;
}

export interface DoctorStateClientView {
  config: DoctorConfig;
  currentRound: number;
  totalRounds: number;
  myHand: Card[];
  myHandSum: number;
  canCallShow: boolean;
  turnPhase: 'DRAW' | 'DISCARD';
  lastDiscardGroup: Card[];
  lastDiscardPlayerName?: string;
  discardPileCount: number;
  drawDeckCount: number;
  scoresHistory: DoctorRoundScore[];
  cumulativeScores: Record<string, number>;
  latestActionMessage?: string | null;
  isRoundOver: boolean;
  roundResult: DoctorRoundScore | null;
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
  bluffState?: BluffStateClientView | null; // Only the active player gets their floating card value
  bhabhoState?: BhabhoStateClientView | null; // Bhabho state for active client
  doctorState?: DoctorStateClientView | null; // Doctor game state
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
  isSpectator?: boolean;
  spectatorCount?: number;
  autoAbortTimer?: {
    deadline: number;
    secondsRemaining: number;
    disconnectedPlayerName: string;
  } | null;
  rankings?: Array<{
    playerId: string;
    name: string;
    avatarColor: string;
    rank: number;
    scoreEarned?: number;
    coinsEarned?: number;
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

export interface Spectator {
  id: string;
  sessionId: string;
  name: string;
  avatarColor: string;
}
