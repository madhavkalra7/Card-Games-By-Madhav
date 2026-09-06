export type CollectibleFamily = 'spades' | 'hearts' | 'diamonds' | 'clubs' | 'mythic';
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface CollectibleCard {
  id: string;
  suit: 'S' | 'H' | 'D' | 'C' | 'VAULT';
  family: CollectibleFamily;
  rank: string;
  name: string;
  hindiName: string;
  title: string;
  rarity: CardRarity;
  collectorNumber: number; // 1 to 57
  power: number; // 50 to 999
  flavorText: string;
  specialEffect?: 'gold_particles' | 'diamond_shine' | 'silver_chrome' | 'holo_shimmer';
  accentColor: string;
  glowColor: string;
}

export interface FamilyMetadata {
  id: CollectibleFamily;
  name: string;
  hindiName: string;
  symbol: string;
  motto: string;
  bannerColor: string;
  accentColor: string;
  bgGradient: string;
}

export const FAMILIES: Record<CollectibleFamily, FamilyMetadata> = {
  spades: {
    id: 'spades',
    name: 'House of Spades',
    hindiName: 'हुकुम का खानदान (Hukum)',
    symbol: '♠',
    motto: 'Supreme Power & Unyielding Strategy',
    bannerColor: '#1e1b4b',
    accentColor: '#818cf8',
    bgGradient: 'from-slate-950 via-indigo-950 to-black',
  },
  hearts: {
    id: 'hearts',
    name: 'House of Hearts',
    hindiName: 'पान का घराना (Paan)',
    symbol: '♥',
    motto: 'Noble Devotion & Fiery Passion',
    bannerColor: '#4c0519',
    accentColor: '#fb7185',
    bgGradient: 'from-zinc-950 via-rose-950 to-black',
  },
  diamonds: {
    id: 'diamonds',
    name: 'House of Diamonds',
    hindiName: 'ईंट की सल्तनत (Eent)',
    symbol: '♦',
    motto: 'Boundless Wealth & Golden Radiance',
    bannerColor: '#451a03',
    accentColor: '#fbbf24',
    bgGradient: 'from-neutral-950 via-amber-950 to-black',
  },
  clubs: {
    id: 'clubs',
    name: 'House of Clubs',
    hindiName: 'चिड़ी का कबीला (Chidi)',
    symbol: '♣',
    motto: 'Wild Nature & Mystic Cunning',
    bannerColor: '#022c22',
    accentColor: '#34d399',
    bgGradient: 'from-stone-950 via-emerald-950 to-black',
  },
  mythic: {
    id: 'mythic',
    name: 'Imperial Mythic Vault',
    hindiName: 'शाही खजाना (Shahi Khazana)',
    symbol: '👑',
    motto: 'The Apex of Immortality & Pure Splendor',
    bannerColor: '#2e1065',
    accentColor: '#e0e7ff',
    bgGradient: 'from-black via-purple-950 to-black',
  },
};

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function getRankTitle(rank: string, family: CollectibleFamily): { title: string; hindiName: string; rarity: CardRarity; power: number } {
  const suitHindi = family === 'spades' ? 'हुकुम' : family === 'hearts' ? 'पान' : family === 'diamonds' ? 'ईंट' : 'चिड़ी';

  switch (rank) {
    case 'A':
      return { title: 'The Sovereign Apex', hindiName: `${suitHindi} का इक्का`, rarity: 'legendary', power: 100 };
    case 'K':
      return { title: 'The Grand Monarch', hindiName: `${suitHindi} का बादशाह`, rarity: 'epic', power: 90 };
    case 'Q':
      return { title: 'The Regal Empress', hindiName: `${suitHindi} की बेगम`, rarity: 'epic', power: 85 };
    case 'J':
      return { title: 'The Vanguard General', hindiName: `${suitHindi} का गुलाम`, rarity: 'rare', power: 75 };
    case '10':
      return { title: 'The Fortress Dehla', hindiName: `${suitHindi} की दहला`, rarity: 'rare', power: 65 };
    case '7':
      return { title: 'The Mystic Satta', hindiName: `${suitHindi} की सत्ती`, rarity: 'rare', power: 55 };
    default:
      return { title: `Guard of the ${rank}`, hindiName: `${suitHindi} की ${rank}`, rarity: 'common', power: 40 + parseInt(rank) * 2 };
  }
}

// Generate the 52 Standard Cards across 4 Families
function generateStandardCards(): CollectibleCard[] {
  const cards: CollectibleCard[] = [];
  const suitMap: Array<{ suit: 'S' | 'H' | 'D' | 'C'; family: CollectibleFamily; color: string; glow: string }> = [
    { suit: 'S', family: 'spades', color: '#6366f1', glow: 'rgba(99,102,241,0.5)' },
    { suit: 'H', family: 'hearts', color: '#f43f5e', glow: 'rgba(244,63,94,0.5)' },
    { suit: 'D', family: 'diamonds', color: '#f59e0b', glow: 'rgba(245,158,11,0.5)' },
    { suit: 'C', family: 'clubs', color: '#10b981', glow: 'rgba(16,185,129,0.5)' },
  ];

  let collectorNum = 1;

  for (const { suit, family, color, glow } of suitMap) {
    for (const rank of RANKS) {
      const { title, hindiName, rarity, power } = getRankTitle(rank, family);
      const suitSymbol = suit === 'S' ? '♠' : suit === 'H' ? '♥' : suit === 'D' ? '♦' : '♣';

      cards.push({
        id: `${suit}-${rank}`,
        suit,
        family,
        rank,
        name: `${rank} of ${family.charAt(0).toUpperCase() + family.slice(1)}`,
        hindiName,
        title,
        rarity,
        collectorNumber: collectorNum++,
        power,
        flavorText: `Forged in the timeless arenas of traditional Indian 52-card games. Bearing the mark of the ${suitSymbol} lineage.`,
        specialEffect: rarity === 'legendary' ? 'holo_shimmer' : undefined,
        accentColor: color,
        glowColor: glow,
      });
    }
  }

  return cards;
}

// The 5 Special Imperial Mythic Cards (Vault Finale Page)
export const MYTHIC_VAULT_CARDS: CollectibleCard[] = [
  {
    id: 'VAULT-GOLDEN-JOKER',
    suit: 'VAULT',
    family: 'mythic',
    rank: '🃏',
    name: 'The Golden Joker',
    hindiName: 'सुनहरा जोकर (Golden Joker)',
    title: 'The Omnipresent Trickster',
    rarity: 'mythic',
    collectorNumber: 53,
    power: 999,
    flavorText: 'An entity born from raw royal gold. Can mimic the supreme destiny of any card in the realm and overturn the heaviest defeat.',
    specialEffect: 'gold_particles',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.85)',
  },
  {
    id: 'VAULT-DIAMOND-ACE',
    suit: 'VAULT',
    family: 'mythic',
    rank: 'A♠',
    name: 'Diamond Ace of Spades',
    hindiName: 'हीरे का हुकुम इक्का (Diamond Hukum)',
    title: 'The Crown Jewel of Destiny',
    rarity: 'mythic',
    collectorNumber: 54,
    power: 1000,
    flavorText: 'The rarest, most coveted artifact in the entire universe. Chiseled from a single celestial diamond that glimmers with ethereal prismatic fire.',
    specialEffect: 'diamond_shine',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.95)',
  },
  {
    id: 'VAULT-SILVER-J',
    suit: 'VAULT',
    family: 'mythic',
    rank: 'J',
    name: 'Silver Ghulam (Jack)',
    hindiName: 'चांदी का गुलाम (Silver Jack)',
    title: 'The Platinum Blade Vanguard',
    rarity: 'legendary',
    collectorNumber: 55,
    power: 550,
    flavorText: 'Forged from liquid quicksilver and refined moon-iron. His armor gleams with absolute brilliance, piercing all deceptive tricks.',
    specialEffect: 'silver_chrome',
    accentColor: '#e2e8f0',
    glowColor: 'rgba(226, 232, 240, 0.75)',
  },
  {
    id: 'VAULT-SILVER-Q',
    suit: 'VAULT',
    family: 'mythic',
    rank: 'Q',
    name: 'Silver Begum (Queen)',
    hindiName: 'चांदी की बेगम (Silver Queen)',
    title: 'Empress of the Frost Palace',
    rarity: 'legendary',
    collectorNumber: 56,
    power: 600,
    flavorText: 'Crowned in crystalline silver lace. Her presence brings crystalline stillness to the table, dominating both rail and arena.',
    specialEffect: 'silver_chrome',
    accentColor: '#f1f5f9',
    glowColor: 'rgba(241, 245, 249, 0.8)',
  },
  {
    id: 'VAULT-SILVER-K',
    suit: 'VAULT',
    family: 'mythic',
    rank: 'K',
    name: 'Silver Badshah (King)',
    hindiName: 'चांदी का बादशाह (Silver King)',
    title: 'Sovereign of Platinum Dominion',
    rarity: 'legendary',
    collectorNumber: 57,
    power: 650,
    flavorText: 'Holding the silver scepter of supreme majesty. A living fortress of platinum honor whom every player venerates.',
    specialEffect: 'silver_chrome',
    accentColor: '#f8fafc',
    glowColor: 'rgba(248, 250, 252, 0.85)',
  },
];

// All 57 Collectible Cards Combined
export const ALL_COLLECTIBLE_CARDS: CollectibleCard[] = [
  ...generateStandardCards(),
  ...MYTHIC_VAULT_CARDS,
];

// Helper to retrieve cards by family
export function getCardsByFamily(family: CollectibleFamily): CollectibleCard[] {
  return ALL_COLLECTIBLE_CARDS.filter((c) => c.family === family);
}

export interface CollectibleRewardInfo {
  id: string;
  name: string;
  hindiName: string;
  rank: string;
  suit: string;
  family: CollectibleFamily;
  rarity: CardRarity;
  power: number;
  collectorNumber: number;
  specialEffect?: 'gold_particles' | 'diamond_shine' | 'silver_chrome' | 'holo_shimmer';
  accentColor: string;
  glowColor: string;
}

/**
 * Probability Drop Engine for Post-Match Rewards (1st and 2nd place players).
 * Premium cards have the lowest probability by far.
 * - Diamond Ace of Spades (💎): 0.8% (1st) / 0.2% (2nd) - The Holy Grail
 * - Golden Joker (🃏): 1.2% (1st) / 0.5% (2nd) - Supreme Golden Mythic
 * - Silver Monarchs (J, Q, K): 4.0% (1st) / 2.3% (2nd)
 * - Legendary Aces: 8.0% (1st) / 5.0% (2nd)
 * - Epic Cards: 18.0% (1st) / 14.0% (2nd)
 * - Rare Cards: 28.0% (1st & 2nd)
 * - Common Cards: 40.0% (1st) / 50.0% (2nd)
 */
export function drawRandomRewardCard(playerRank: number): CollectibleRewardInfo {
  const roll = Math.random() * 100; // 0.0 to 100.0
  const isWinner = playerRank === 1;

  const diamondThreshold = isWinner ? 0.8 : 0.2;
  const goldThreshold = diamondThreshold + (isWinner ? 1.2 : 0.5);
  const silverThreshold = goldThreshold + (isWinner ? 4.0 : 2.3);
  const acesThreshold = silverThreshold + (isWinner ? 8.0 : 5.0);
  const epicThreshold = acesThreshold + (isWinner ? 18.0 : 14.0);
  const rareThreshold = epicThreshold + 28.0;

  let chosenCard: CollectibleCard;

  if (roll < diamondThreshold) {
    // 💎 DIAMOND ACE OF SPADES (Ultra Rarest Mythic)
    chosenCard = MYTHIC_VAULT_CARDS.find((c) => c.id === 'VAULT-DIAMOND-ACE')!;
  } else if (roll < goldThreshold) {
    // 🃏 GOLDEN JOKER (Supreme Gold Mythic)
    chosenCard = MYTHIC_VAULT_CARDS.find((c) => c.id === 'VAULT-GOLDEN-JOKER')!;
  } else if (roll < silverThreshold) {
    // 🥈 SILVER MONARCHS (J, Q, K)
    const silverCards = MYTHIC_VAULT_CARDS.filter((c) => c.specialEffect === 'silver_chrome');
    chosenCard = silverCards[Math.floor(Math.random() * silverCards.length)];
  } else if (roll < acesThreshold) {
    // ★ LEGENDARY SUIT ACES
    const aces = ALL_COLLECTIBLE_CARDS.filter((c) => c.rank === 'A' && c.family !== 'mythic');
    chosenCard = aces[Math.floor(Math.random() * aces.length)];
  } else if (roll < epicThreshold) {
    // ★ EPIC (Kings & Queens)
    const epics = ALL_COLLECTIBLE_CARDS.filter((c) => c.rarity === 'epic');
    chosenCard = epics[Math.floor(Math.random() * epics.length)];
  } else if (roll < rareThreshold) {
    // ★ RARE (Jacks, 10s, 7s)
    const rares = ALL_COLLECTIBLE_CARDS.filter((c) => c.rarity === 'rare');
    chosenCard = rares[Math.floor(Math.random() * rares.length)];
  } else {
    // ★ COMMON (Ranks 2-6, 8, 9)
    const commons = ALL_COLLECTIBLE_CARDS.filter((c) => c.rarity === 'common');
    chosenCard = commons[Math.floor(Math.random() * commons.length)];
  }

  return {
    id: chosenCard.id,
    name: chosenCard.name,
    hindiName: chosenCard.hindiName,
    rank: chosenCard.rank,
    suit: chosenCard.suit,
    family: chosenCard.family,
    rarity: chosenCard.rarity,
    power: chosenCard.power,
    collectorNumber: chosenCard.collectorNumber,
    specialEffect: chosenCard.specialEffect,
    accentColor: chosenCard.accentColor,
    glowColor: chosenCard.glowColor,
  };
}
