import { Card, Rank, Suit } from './types';

export const SUITS: Suit[] = ['H', 'D', 'C', 'S'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

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
