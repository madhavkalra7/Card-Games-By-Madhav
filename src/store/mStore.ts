import { create } from 'zustand';
import { CoinPack, DailyStoreCard, getDailyStoreCards, GOLDEN_JOKER_CARD } from '@/lib/mStoreTypes';
import { sounds } from '@/lib/sound';

interface MStoreState {
  isOpen: boolean;
  activeTab: 'coins' | 'cards';
  mCoins: number;
  ownedCardIds: string[];
  selectedPackForShowcase: CoinPack | null;
  inspectingCard: DailyStoreCard | null;
  dailyCards: DailyStoreCard[];
  
  // Actions
  setOpen: (open: boolean) => void;
  setActiveTab: (tab: 'coins' | 'cards') => void;
  setSelectedPackForShowcase: (pack: CoinPack | null) => void;
  setInspectingCard: (card: DailyStoreCard | null) => void;
  buyCard: (card: DailyStoreCard) => { success: boolean; message: string };
  isCardOwned: (cardId: string) => boolean;
  refreshDailyCards: () => void;
}

const DEFAULT_DEMO_COINS = 2500;

function getStoredCoins(): number {
  if (typeof window === 'undefined') return DEFAULT_DEMO_COINS;
  try {
    // Check auth user profile first
    const authProfile = localStorage.getItem('cg_user_profile');
    if (authProfile) {
      const parsed = JSON.parse(authProfile);
      if (typeof parsed.coins === 'number') return parsed.coins;
    }
    // Check separate M coins key
    const saved = localStorage.getItem('cg_m_coins');
    if (saved !== null) {
      const val = parseInt(saved, 10);
      if (!isNaN(val)) return val;
    }
  } catch {}
  return DEFAULT_DEMO_COINS;
}

function getStoredOwnedCards(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('cg_owned_cards');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export const useMStore = create<MStoreState>((set, get) => ({
  isOpen: false,
  activeTab: 'coins',
  mCoins: getStoredCoins(),
  ownedCardIds: getStoredOwnedCards(),
  selectedPackForShowcase: null,
  inspectingCard: null,
  dailyCards: getDailyStoreCards(),

  setOpen: (open: boolean) => {
    if (open) {
      sounds.playCardFlip();
      // Ensure daily cards are updated for current day
      set({ isOpen: true, dailyCards: getDailyStoreCards() });
    } else {
      set({ isOpen: false, selectedPackForShowcase: null, inspectingCard: null });
    }
  },

  setActiveTab: (tab: 'coins' | 'cards') => {
    if (tab === 'coins') {
      sounds.playCoinJingle();
    } else {
      sounds.playCardSlide();
    }
    set({ activeTab: tab });
  },

  setSelectedPackForShowcase: (pack: CoinPack | null) => {
    if (pack) {
      sounds.playCardFlip();
    }
    set({ selectedPackForShowcase: pack });
  },

  setInspectingCard: (card: DailyStoreCard | null) => {
    if (card) {
      sounds.playCardShimmer();
    }
    set({ inspectingCard: card });
  },

  isCardOwned: (cardId: string) => {
    return get().ownedCardIds.includes(cardId);
  },

  buyCard: (card: DailyStoreCard) => {
    const state = get();
    if (state.ownedCardIds.includes(card.id)) {
      return { success: false, message: 'You already own this exclusive card!' };
    }

    if (state.mCoins < card.priceCoins) {
      sounds.playWrongShowBuzzer();
      return {
        success: false,
        message: `Insufficient M Coins! You need ${card.priceCoins.toLocaleString()} M Coins. You currently have ${state.mCoins.toLocaleString()} M Coins.`,
      };
    }

    // Deduct coins and add to owned cards
    const newCoins = state.mCoins - card.priceCoins;
    const newOwned = [...state.ownedCardIds, card.id];

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cg_m_coins', newCoins.toString());
        localStorage.setItem('cg_owned_cards', JSON.stringify(newOwned));
        // Also update auth profile coins if present
        const authProfile = localStorage.getItem('cg_user_profile');
        if (authProfile) {
          const parsed = JSON.parse(authProfile);
          parsed.coins = newCoins;
          localStorage.setItem('cg_user_profile', JSON.stringify(parsed));
        }
      } catch {}
    }

    sounds.playRoseChime();
    set({ mCoins: newCoins, ownedCardIds: newOwned });

    return {
      success: true,
      message: `🎉 Successfully purchased ${card.name} for ${card.priceCoins.toLocaleString()} M Coins! Added to your collection.`,
    };
  },

  refreshDailyCards: () => {
    set({ dailyCards: getDailyStoreCards() });
  },
}));
