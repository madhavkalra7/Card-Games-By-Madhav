export type ThrowableType = 'chappal' | 'chai' | 'tomato' | 'cash' | 'rose';

export interface ThrownItemEvent {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  itemType: ThrowableType;
  timestamp: number;
}

export interface ThrowableConfig {
  id: ThrowableType;
  name: string;
  hindiName: string;
  emoji: string;
  tagline: string;
  color: string;
  glowColor: string;
  impactEmoji: string[];
}

export const THROWABLES: ThrowableConfig[] = [
  {
    id: 'chappal',
    name: 'Flying Chappal',
    hindiName: 'देसी चप्पल',
    emoji: '🩴',
    tagline: 'Loud Phatak Slap!',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    impactEmoji: ['⭐', '💫', '💥', '🩴'],
  },
  {
    id: 'chai',
    name: 'Cutting Chai',
    hindiName: 'गरम चाय',
    emoji: '☕',
    tagline: 'Hot Sizzle Splash!',
    color: '#d97706',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    impactEmoji: ['♨️', '☕', '💦', '✨'],
  },
  {
    id: 'tomato',
    name: 'Sada Tomato',
    hindiName: 'सड़ा टमाटर',
    emoji: '🍅',
    tagline: 'Saucy Wet Splat!',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    impactEmoji: ['🍅', '💦', '🔴', '💥'],
  },
  {
    id: 'cash',
    name: 'Paisa Hi Paisa',
    hindiName: 'पैसा ही पैसा',
    emoji: '💸',
    tagline: 'Golden Cash Shower!',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    impactEmoji: ['💵', '💰', '✨', '🪙'],
  },
  {
    id: 'rose',
    name: 'Pyaar Ka Gulab',
    hindiName: 'प्यार का गुलाब',
    emoji: '🌹',
    tagline: 'Sweet Love Sparkle!',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    impactEmoji: ['🌹', '💖', '✨', '🌸'],
  },
];

export function getThrowableConfig(type: ThrowableType): ThrowableConfig {
  return THROWABLES.find((t) => t.id === type) || THROWABLES[0];
}
