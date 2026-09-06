'use client';

import { create } from 'zustand';
import { ALL_COLLECTIBLE_CARDS, CollectibleCard } from '@/lib/collectibles';

// Initial starter unlocked cards: 0 cards (User must earn them through match victories!)
const DEFAULT_UNLOCKED: string[] = [];

interface AlbumState {
  unlockedIds: string[];
  currentPage: number; // 0: Overview, 1: Spades, 2: Hearts, 3: Diamonds, 4: Clubs, 5: Mythic Vault
  selectedCard: CollectibleCard | null;
  isInspecting: boolean;

  // Actions
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  openInspect: (card: CollectibleCard) => void;
  closeInspect: () => void;
  unlockCard: (id: string) => void;
  isUnlocked: (id: string) => boolean;
  getUnlockedCount: () => number;
  getTotalCount: () => number;
  resetAllToZero: () => void;
}

const STORAGE_KEY = 'cg_album_unlocked_cards_v4';

function loadInitialUnlocked(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    // Purge any old test keys from earlier iterations to guarantee 0 cards for all users
    localStorage.removeItem('cg_album_unlocked_cards_v1');
    localStorage.removeItem('cg_album_unlocked_cards_v2');
    localStorage.removeItem('cg_album_unlocked_cards_v3');
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveUnlocked(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export const useAlbumStore = create<AlbumState>((set, get) => ({
  unlockedIds: loadInitialUnlocked(),
  currentPage: 1, // Start on Spades (Page 1)
  selectedCard: null,
  isInspecting: false,

  setPage: (page) => {
    const clamped = Math.max(0, Math.min(5, page));
    set({ currentPage: clamped });
  },

  nextPage: () => {
    const { currentPage } = get();
    if (currentPage < 5) {
      set({ currentPage: currentPage + 1 });
    }
  },

  prevPage: () => {
    const { currentPage } = get();
    if (currentPage > 0) {
      set({ currentPage: currentPage - 1 });
    }
  },

  openInspect: (card) => {
    set({ selectedCard: card, isInspecting: true });
  },

  closeInspect: () => {
    set({ isInspecting: false, selectedCard: null });
  },

  unlockCard: (id) => {
    const { unlockedIds } = get();
    if (!unlockedIds.includes(id)) {
      const updated = [...unlockedIds, id];
      saveUnlocked(updated);
      set({ unlockedIds: updated });
    }
  },

  resetAllToZero: () => {
    saveUnlocked([]);
    set({ unlockedIds: [] });
  },

  isUnlocked: (id) => {
    return get().unlockedIds.includes(id);
  },

  getUnlockedCount: () => {
    return get().unlockedIds.length;
  },

  getTotalCount: () => {
    return ALL_COLLECTIBLE_CARDS.length;
  },
}));
