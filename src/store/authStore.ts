import { create } from 'zustand';
import { getAvatarById } from '@/lib/avatars';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  avatarColor: string;
  avatarId: string;
  totalScore: number;
  totalGamesWon: number;
  totalGamesPlayed: number;
  createdAt?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authMode: 'login' | 'signup';
  isProfileModalOpen: boolean;

  // Actions
  setAuthModalOpen: (open: boolean, mode?: 'login' | 'signup') => void;
  setProfileModalOpen: (open: boolean) => void;
  checkAuth: () => Promise<void>;
  signup: (data: { name: string; email: string; password: string; confirmPassword: string }) => Promise<{ success: boolean; error?: string }>;
  login: (data: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (data?: { email?: string; name?: string; avatarUrl?: string; googleId?: string; credential?: string }) => Promise<{ success: boolean; error?: string }>;
  updateAvatar: (avatarId: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: { name?: string; avatarId?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('cg_auth_token') : null,
  isLoading: false,
  isAuthModalOpen: false,
  authMode: 'login',
  isProfileModalOpen: false,

  setAuthModalOpen: (open, mode = 'login') => {
    set({ isAuthModalOpen: open, authMode: mode });
  },

  setProfileModalOpen: (open) => {
    set({ isProfileModalOpen: open });
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('cg_auth_token');
    if (!token) {
      set({ user: null, token: null });
      return;
    }

    try {
      set({ isLoading: true });
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        set({ user: data.user, token });
        // Sync with game profile
        localStorage.setItem('cg_player_name', data.user.name);
        localStorage.setItem('cg_player_avatar', data.user.avatarColor);
      } else {
        localStorage.removeItem('cg_auth_token');
        set({ user: null, token: null });
      }
    } catch {
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (formData) => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success && data.user && data.token) {
        localStorage.setItem('cg_auth_token', data.token);
        localStorage.setItem('cg_player_name', data.user.name);
        localStorage.setItem('cg_player_avatar', data.user.avatarColor);
        set({ user: data.user, token: data.token, isAuthModalOpen: false });
        return { success: true };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (formData) => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success && data.user && data.token) {
        localStorage.setItem('cg_auth_token', data.token);
        localStorage.setItem('cg_player_name', data.user.name);
        localStorage.setItem('cg_player_avatar', data.user.avatarColor);
        set({ user: data.user, token: data.token, isAuthModalOpen: false });
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async (googleData) => {
    try {
      set({ isLoading: true });

      // Fallback demo Google user if called without external payload
      const payload = googleData || {
        name: localStorage.getItem('cg_player_name') || 'Google Player',
        email: `${(localStorage.getItem('cg_player_name') || 'player').toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        googleId: 'g_' + Math.random().toString(36).substring(2, 12),
        avatarUrl: getAvatarById('toon-orange').image,
      };

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.user && data.token) {
        localStorage.setItem('cg_auth_token', data.token);
        localStorage.setItem('cg_player_name', data.user.name);
        localStorage.setItem('cg_player_avatar', data.user.avatarColor);
        set({ user: data.user, token: data.token, isAuthModalOpen: false });
        return { success: true };
      }
      return { success: false, error: data.error || 'Google login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    } finally {
      set({ isLoading: false });
    }
  },

  updateAvatar: async (avatarId: string) => {
    const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('cg_auth_token') : null);
    const avatarInfo = getAvatarById(avatarId);

    // Optimistic local update
    if (get().user) {
      set({
        user: {
          ...get().user!,
          avatarId: avatarInfo.id,
          avatarUrl: avatarInfo.image,
          avatarColor: avatarInfo.color,
        },
      });
      localStorage.setItem('cg_player_avatar', avatarInfo.color);
    }

    if (!token) return { success: true };

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarId }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        set({ user: data.user });
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  updateProfile: async (profileData) => {
    const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('cg_auth_token') : null);
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      set({ isLoading: true });
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();

      if (data.success && data.user) {
        set({ user: data.user });
        if (data.user.name) localStorage.setItem('cg_player_name', data.user.name);
        if (data.user.avatarColor) localStorage.setItem('cg_player_avatar', data.user.avatarColor);
        return { success: true };
      }
      return { success: false, error: data.error || 'Update failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cg_auth_token');
      document.cookie = 'cg_auth_token=; Max-Age=0; path=/;';
    }
    set({ user: null, token: null, isProfileModalOpen: false });
  },
}));
