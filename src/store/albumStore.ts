'use client';

import { create } from 'zustand';
import { ALL_COLLECTIBLE_CARDS, CollectibleCard } from '@/lib/collectibles';

// Initial starter unlocked cards for aesthetic preview
const DEFAULT_UNLOCKED = ['S-A', 'S-K', 'H-A', 'H-Q', 'D-10', 'D-A', 'C-7', 'C-A'];

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
  toggleCard: (id: string) => void;
  unlockAll: () => void;
  lockAll: () => void;
  isUnlocked: (id: string) => boolean;
  getUnlockedCount: () => number;
  getTotalCount: () => number;
}

const STORAGE_KEY = 'cg_album_unlocked_cards_v1';

function loadInitialUnlocked(): string[] {
  if (typeof window === 'undefined') return DEFAULT_UNLOCKED;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_UNLOCKED;
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

  toggleCard: (id) => {
    const { unlockedIds } = get();
    const exists = unlockedIds.includes(id);
    const updated = exists ? unlockedIds.filter((x) => x !== id) : [...unlockedIds, id];
    saveUnlocked(updated);
    set({ unlockedIds: updated });
  },

  unlockAll: () => {
    const allIds = ALL_COLLECTIBLE_CARDS.map((c) => c.id);
    saveUnlocked(allIds);
    set({ unlockedIds: allIds });
  },

  lockAll: () => {
    saveUnlocked(DEFAULT_UNLOCKED);
    set({ unlockedIds: DEFAULT_UNLOCKED });
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
