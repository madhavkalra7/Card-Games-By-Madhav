import { Card, Rank, Suit, CenterDeck } from './types';

export const SUITS: Suit[] = ['H', 'D', 'C', 'S'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const RANK_ORDER: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function getRankIndex(rank: Rank): number {
  return RANK_ORDER.indexOf(rank);
}

export function getNextRank(rank: Rank): Rank {
  const idx = getRankIndex(rank);
  return RANK_ORDER[(idx + 1) % RANK_ORDER.length];
}

export function isNextRank(baseRank: Rank, testRank: Rank): boolean {
  return getNextRank(baseRank) === testRank;
}

export function isSameRank(rank1: Rank, rank2: Rank): boolean {
  return rank1 === rank2;
}

export function canPlayOnCenter(card: Card, centerCard: Card | null): boolean {
  if (!centerCard) return true;
  return isSameRank(centerCard.rank, card.rank) || isNextRank(centerCard.rank, card.rank);
}

/**
 * Validates whether a card can be placed on a specific center deck (0, 1, 2, 3)
 */
export function canPlayOnCenterDeck(
  card: Card,
  deck: CenterDeck,
  baseRank: Rank,
  allDecks: CenterDeck[]
): { valid: boolean; reason?: string } {
  // 1. If this deck is NOT open yet:
  if (!deck.isOpen) {
    if (card.rank !== baseRank) {
      return { valid: false, reason: `Only rank ${baseRank} can start this empty center deck.` };
    }
    const suitAlreadyOpen = allDecks.some(d => d.isOpen && d.suit === card.suit);
    if (suitAlreadyOpen) {
      return { valid: false, reason: `The ${card.suit} suit deck is already opened on the table.` };
    }
    return { valid: true };
  }

  // 2. If this deck IS open:
  if (deck.isCompleted) {
    return { valid: false, reason: `This center deck is already fully completed.` };
  }

  if (card.suit !== deck.suit) {
    return { valid: false, reason: `Wrong suit: this deck is ${deck.suit}, but your card is ${card.suit}.` };
  }

  if (card.rank !== deck.nextAcceptedRank) {
    return { valid: false, reason: `Wrong rank: this deck needs ${deck.nextAcceptedRank}, but your card is ${card.rank}.` };
  }

  return { valid: true };
}

/**
 * Checks if the card can be played on ANY of the 4 center decks
 */
export function canPlayOnAnyCenterDeck(
  card: Card,
  decks: CenterDeck[],
  baseRank: Rank | null
): { canPlay: boolean; targetDeckId?: number; reason?: string } {
  if (!baseRank || !decks || decks.length === 0) return { canPlay: false };

  // First check open decks matching suit
  for (const deck of decks) {
    if (deck.isOpen && deck.suit === card.suit && !deck.isCompleted) {
      if (card.rank === deck.nextAcceptedRank) {
        return { canPlay: true, targetDeckId: deck.id };
      }
    }
  }

  // If card is baseRank, check if any deck is empty and suit isn't already open
  if (card.rank === baseRank) {
    const suitAlreadyOpen = decks.some(d => d.isOpen && d.suit === card.suit);
    if (!suitAlreadyOpen) {
      const emptyDeck = decks.find(d => !d.isOpen);
      if (emptyDeck) {
        return { canPlay: true, targetDeckId: emptyDeck.id };
      }
    }
  }

  return { canPlay: false };
}

export function canPlayOnOtherRightDeck(
  card: Card,
  targetTopCard: Card | null,
  _isBazaarOpen?: boolean
): { valid: boolean; reason?: string } {
  if (!targetTopCard) {
    return { valid: false, reason: "Cannot play on an empty right deck of another player." };
  }
  if (!isNextRank(targetTopCard.rank, card.rank)) {
    return { 
      valid: false, 
      reason: `Card rank (${card.rank}) must be exactly next rank after target top card (${targetTopCard.rank}).` 
    };
  }
  return { valid: true };
}
