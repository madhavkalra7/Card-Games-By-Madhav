import { Card, Suit, Rank } from './types';

export interface CoinPack {
  id: string;
  coins: number;
  priceRupees: number;
  title: string;
  badge?: string;
  tagline: string;
  chipCount: 1 | 2 | 3 | 4;
  gradient: string;
  borderGlow: string;
}

export type CardRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC_GOLD';

export interface DailyStoreCard {
  id: string;
  card: Card;
  name: string;
  rarity: CardRarity;
  priceCoins: number;
  badge?: string;
  lore: string;
  isGoldenJoker?: boolean;
  glowColor: string;
  gradient: string;
}

// M Coin Packs:
// 1000 m coins -> 99 rs
// 3000 m coins -> 249 rs
// 5000 m coins -> 399 rs
// 10000 m coins -> 799 rs
export const M_COIN_PACKS: CoinPack[] = [
  {
    id: 'pack_1000',
    coins: 1000,
    priceRupees: 99,
    title: 'Pouch of M Coins',
    tagline: '1,000 Casino Chips',
    badge: 'STARTER',
    chipCount: 1,
    gradient: 'from-[#1c0a0f] via-[#100609] to-[#070204]',
    borderGlow: 'border-red-500/40 hover:border-amber-400 shadow-[0_0_20px_rgba(225,29,72,0.2)]',
  },
  {
    id: 'pack_3000',
    coins: 3000,
    priceRupees: 249,
    title: 'Stack of M Coins',
    tagline: '3,000 Casino Chips',
    badge: 'POPULAR',
    chipCount: 2,
    gradient: 'from-[#220c13] via-[#14070b] to-[#070204]',
    borderGlow: 'border-red-500/50 hover:border-amber-400 shadow-[0_0_25px_rgba(225,29,72,0.25)]',
  },
  {
    id: 'pack_5000',
    coins: 5000,
    priceRupees: 399,
    title: 'Vault of M Coins',
    tagline: '5,000 Casino Chips',
    badge: 'BEST VALUE',
    chipCount: 3,
    gradient: 'from-[#280d16] via-[#16070c] to-[#070204]',
    borderGlow: 'border-rose-500/60 hover:border-amber-300 shadow-[0_0_30px_rgba(225,29,72,0.3)]',
  },
  {
    id: 'pack_10000',
    coins: 10000,
    priceRupees: 799,
    title: 'Royal M Treasury',
    tagline: '10,000 Casino Chips',
    badge: 'HIGH ROLLER',
    chipCount: 4,
    gradient: 'from-[#2e0e1a] via-[#1a080e] to-[#080205]',
    borderGlow: 'border-amber-500/70 hover:border-yellow-300 shadow-[0_0_35px_rgba(245,158,11,0.35)]',
  },
];

// Fixed 24K Solid Gold Joker Card (10,000 M Coins)
export const GOLDEN_JOKER_CARD: DailyStoreCard = {
  id: 'card_golden_joker_fixed',
  card: {
    id: 'store_golden_joker',
    suit: 'H',
    rank: 'JKR' as unknown as Rank,
    isJoker: true,
    isGolden: true,
    isGoldenJoker: true,
  },
  name: '24K Golden Joker',
  rarity: 'MYTHIC_GOLD',
  priceCoins: 10000,
  badge: '24K SOLID GOLD',
  lore: 'Pure 24K solid gold bullion master card. The ultimate permanent symbol of casino royalty.',
  isGoldenJoker: true,
  glowColor: '#F59E0B',
  gradient: 'from-[#261504] via-[#160d02] to-[#070301]',
};


// Curated pool of rotating collectible cards
const ROTATION_CARD_POOL: Omit<DailyStoreCard, 'id'>[] = [
  {
    card: { id: 'c_ace_spades', suit: 'S', rank: 'A' },
    name: 'Celestial Ace of Spades',
    rarity: 'LEGENDARY',
    priceCoins: 4500,
    badge: 'ROYAL HIGH',
    lore: 'The legendary death-card of Indian bazaar kings, blessed with starlight obsidian foil.',
    glowColor: '#A855F7',
    gradient: 'from-purple-950/40 via-zinc-950 to-black',
  },
  {
    card: { id: 'c_king_hearts', suit: 'H', rank: 'K' },
    name: 'Neon King of Hearts',
    rarity: 'EPIC',
    priceCoins: 3500,
    badge: 'ROYAL BLOOD',
    lore: 'The suicide king reborn in retro-cyberpunk neon crimson glow.',
    glowColor: '#EF4444',
    gradient: 'from-rose-950/40 via-zinc-950 to-black',
  },
  {
    card: { id: 'c_queen_diamonds', suit: 'D', rank: 'Q' },
    name: 'Koh-i-Noor Diamond Queen',
    rarity: 'EPIC',
    priceCoins: 2800,
    badge: 'MAHARANI',
    lore: 'Inspired by the historic Koh-i-Noor gemstone, gleaming with cyan-diamond prisms.',
    glowColor: '#06B6D4',
    gradient: 'from-cyan-950/40 via-zinc-950 to-black',
  },
  {
    card: { id: 'c_jack_clubs', suit: 'C', rank: 'J' },
    name: 'Shadow Royal Jack of Clubs',
    rarity: 'EPIC',
    priceCoins: 2200,
    badge: 'NIGHTFALL',
    lore: 'Master of stealth in Bluff Master tables, cloaked in emerald twilight.',
    glowColor: '#10B981',
    gradient: 'from-emerald-950/40 via-zinc-950 to-black',
  },
  {
    card: { id: 'c_ten_spades', suit: 'S', rank: '10' },
    name: 'Dragon 10 of Spades',
    rarity: 'RARE',
    priceCoins: 1600,
    badge: 'DRAGON SCALE',
    lore: 'Carved with ancient scales that ward off bad deals at the table.',
    glowColor: '#3B82F6',
    gradient: 'from-blue-950/40 via-zinc-950 to-black',
  },
  {
    card: { id: 'c_seven_hearts', suit: 'H', rank: '7' },
    name: 'Lucky Satta of Hearts',
    rarity: 'RARE',
    priceCoins: 1200,
    badge: 'LUCKY 7',
    lore: 'The revered Indian lucky number 7, known to win crucial showdowns.',
    glowColor: '#F43F5E',
    gradient: 'from-pink-950/40 via-zinc-950 to-black',
  },
  {
    card: { id: 'c_two_spades', suit: 'S', rank: '2' },
    name: 'Golden Dukki of Spades',
    rarity: 'RARE',
    priceCoins: 1500,
    badge: 'DUKKI SPECIAL',
    lore: 'The cornerstone card of Dukki Bazaar. Possessing this grants timeless table swagger.',
    glowColor: '#F59E0B',
    gradient: 'from-amber-950/40 via-zinc-950 to-black',
  },
  {
    card: { id: 'c_ace_diamonds', suit: 'D', rank: 'A' },
    name: 'Solar Flare Ace of Diamonds',
    rarity: 'LEGENDARY',
    priceCoins: 4200,
    badge: 'SOLAR FLARE',
    lore: 'Radiates the scorching intensity of Rajasthan deserts during peak bazaar trading.',
    glowColor: '#F97316',
    gradient: 'from-orange-950/40 via-zinc-950 to-black',
  },
  {
    card: { id: 'c_king_spades', suit: 'S', rank: 'K' },
    name: 'Emperor King of Spades',
    rarity: 'LEGENDARY',
    priceCoins: 4800,
    badge: 'IMPERIAL',
    lore: 'The highest spade in Bhabho, feared by opponents who get caught with it last.',
    glowColor: '#8B5CF6',
    gradient: 'from-violet-950/40 via-zinc-950 to-black',
  },
  {
    card: { id: 'c_queen_hearts', suit: 'H', rank: 'Q' },
    name: 'Velvet Queen of Hearts',
    rarity: 'EPIC',
    priceCoins: 2900,
    badge: 'VELVET',
    lore: 'Silky smooth crimson aesthetics that mesmerize everyone at the showdown.',
    glowColor: '#EC4899',
    gradient: 'from-rose-950/50 via-zinc-950 to-black',
  },
  {
    card: { id: 'c_eight_clubs', suit: 'C', rank: '8' },
    name: 'Doctor Athha of Clubs',
    rarity: 'RARE',
    priceCoins: 1100,
    badge: 'DOCTOR SHED',
    lore: 'Pairs cleanly with 8s to rapidly shed points in high-stakes Doctor matches.',
    glowColor: '#14B8A6',
    gradient: 'from-teal-950/40 via-zinc-950 to-black',
  },
  {
    card: { id: 'c_three_hearts', suit: 'H', rank: '3' },
    name: 'Tikki of Hearts',
    rarity: 'COMMON',
    priceCoins: 750,
    badge: 'TIKKI SPECIAL',
    lore: 'Low sum miracle worker for Doctor game players aiming for under 10 show limit.',
    glowColor: '#E11D48',
    gradient: 'from-red-950/40 via-zinc-950 to-black',
  },
];

// Deterministic seed based on date string (e.g. "2026-10-03")
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Generate the 7 daily cards for any given date:
// Card 0: Fixed Golden Joker Card (10,000 M Coins)
// Cards 1-6: 6 deterministically randomized cards for today
export function getDailyStoreCards(dateStr?: string): DailyStoreCard[] {
  const d = dateStr || new Date().toISOString().slice(0, 10);
  let seed = 0;
  for (let i = 0; i < d.length; i++) {
    seed = (seed << 5) - seed + d.charCodeAt(i);
    seed |= 0;
  }
  seed = Math.abs(seed);

  // Shuffle rotation pool deterministically
  const pool = [...ROTATION_CARD_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom(seed + i) * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Pick 6 cards from the shuffled pool
  const pickedSix = pool.slice(0, 6).map((item, idx) => ({
    ...item,
    id: `daily_${d}_card_${idx + 1}_${item.card.rank}_${item.card.suit}`,
  }));

  // Card 1 is ALWAYS the Fixed Golden Joker Card
  return [GOLDEN_JOKER_CARD, ...pickedSix];
}
