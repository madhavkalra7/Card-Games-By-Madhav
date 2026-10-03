import { Card } from './types';

export function getDoctorCardValue(card: Card): number {
  if (card.isJoker || (card.rank as string) === 'JKR' || (card.suit as string) === 'JKR') return 50;
  if (card.rank === 'A') return 1;
  if (card.rank === 'J') return 11;
  if (card.rank === 'Q') return 12;
  if (card.rank === 'K') return 13;
  const num = parseInt(card.rank, 10);
  return isNaN(num) ? 0 : num;
}

export function calculateDoctorHandSum(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + getDoctorCardValue(c), 0);
}
