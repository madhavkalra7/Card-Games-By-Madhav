import { GameType } from './types';

const ACTIVE_MATCH_KEY = 'madhav_active_match_session';
const MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes validity

export interface ActiveMatchRecord {
  roomCode: string;
  gameType: GameType;
  timestamp: number;
}

export function saveActiveRoom(roomCode: string, gameType: GameType = 'DUKKI_BAZAAR'): void {
  if (typeof window === 'undefined') return;
  try {
    const record: ActiveMatchRecord = {
      roomCode: roomCode.trim().toUpperCase(),
      gameType,
      timestamp: Date.now(),
    };
    localStorage.setItem(ACTIVE_MATCH_KEY, JSON.stringify(record));
  } catch (err) {
    console.warn('Failed to save active match to localStorage:', err);
  }
}

export function getActiveRoom(): ActiveMatchRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_MATCH_KEY);
    if (!raw) return null;
    const parsed: ActiveMatchRecord = JSON.parse(raw);
    if (!parsed || !parsed.roomCode) return null;
    // Check if stale (> 15 minutes)
    if (Date.now() - parsed.timestamp > MAX_AGE_MS) {
      clearActiveRoom();
      return null;
    }
    return parsed;
  } catch (err) {
    return null;
  }
}

export function clearActiveRoom(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACTIVE_MATCH_KEY);
  } catch (err) {
    console.warn('Failed to clear active match from localStorage:', err);
  }
}
