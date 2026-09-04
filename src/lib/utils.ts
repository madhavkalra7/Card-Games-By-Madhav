import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('cg_session_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('cg_session_id', id);
  }
  return id;
}

export function getSavedProfile(): { name: string; avatarColor: string } {
  if (typeof window === 'undefined') {
    return { name: '', avatarColor: '#3b82f6' };
  }
  const name = localStorage.getItem('cg_player_name') || '';
  const avatarColor = localStorage.getItem('cg_player_avatar') || '#3b82f6';
  return { name, avatarColor };
}

export function saveProfile(name: string, avatarColor: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cg_player_name', name);
  localStorage.setItem('cg_player_avatar', avatarColor);
}
