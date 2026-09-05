import { create } from 'zustand';
import { getSocket } from '@/socket/client';

export interface LeaderboardPlayer {
  rank: number;
  id: string;
  name: string;
  email?: string;
  avatarUrl: string;
  avatarColor: string;
  avatarId: string;
  totalScore: number;
  totalGamesWon: number;
  totalGamesPlayed: number;
  winRate: number;
}

export interface FriendUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl: string;
  avatarColor: string;
  avatarId: string;
  totalScore: number;
  totalGamesWon: number;
  totalGamesPlayed: number;
  winRate: number;
  isOnline?: boolean;
}

export interface OnlinePlayer {
  userId?: string;
  name: string;
  avatarUrl?: string;
  avatarColor?: string;
  inRoom?: boolean;
}

export interface RoomInvite {
  roomCode: string;
  hostName: string;
  hostAvatar?: string;
  hostAvatarColor?: string;
  gameType?: string;
}

interface FriendsState {
  isFriendsModalOpen: boolean;
  isInviteModalOpen: boolean;
  activeTab: 'leaderboard' | 'friends';
  leaderboard: LeaderboardPlayer[];
  friends: FriendUser[];
  onlinePlayers: OnlinePlayer[];
  incomingInvite: RoomInvite | null;
  isLoading: boolean;
  searchQuery: string;

  // Actions
  setFriendsModalOpen: (open: boolean, tab?: 'leaderboard' | 'friends') => void;
  setInviteModalOpen: (open: boolean) => void;
  setActiveTab: (tab: 'leaderboard' | 'friends') => void;
  setSearchQuery: (query: string) => void;
  setIncomingInvite: (invite: RoomInvite | null) => void;

  fetchLeaderboard: () => Promise<void>;
  fetchFriends: () => Promise<void>;
  fetchOnlinePlayers: () => void;
  addFriend: (nameOrEmail: string) => Promise<{ success: boolean; error?: string }>;
  sendRoomInvite: (targetNameOrId: string, roomCode: string, hostName: string, hostAvatar?: string, hostAvatarColor?: string) => Promise<{ success: boolean; online?: boolean; message?: string }>;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  isFriendsModalOpen: false,
  isInviteModalOpen: false,
  activeTab: 'leaderboard',
  leaderboard: [],
  friends: [],
  onlinePlayers: [],
  incomingInvite: null,
  isLoading: false,
  searchQuery: '',

  setFriendsModalOpen: (open, tab = 'leaderboard') => {
    set({ isFriendsModalOpen: open, activeTab: tab });
    if (open) {
      get().fetchLeaderboard();
      get().fetchFriends();
      get().fetchOnlinePlayers();
    }
  },

  setInviteModalOpen: (open) => {
    set({ isInviteModalOpen: open });
    if (open) {
      get().fetchFriends();
      get().fetchOnlinePlayers();
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIncomingInvite: (invite) => set({ incomingInvite: invite }),

  fetchLeaderboard: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.success && Array.isArray(data.leaderboard)) {
        set({ leaderboard: data.leaderboard });
      }
    } catch (err) {
      console.warn('Failed to load leaderboard:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFriends: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cg_auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/friends', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.friends)) {
        set({ friends: data.friends });
      }
    } catch (err) {
      console.warn('Failed to load friends:', err);
    }
  },

  fetchOnlinePlayers: () => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('get_online_players', (players: OnlinePlayer[]) => {
        if (Array.isArray(players)) {
          set({ onlinePlayers: players });
        }
      });
    }
  },

  addFriend: async (nameOrEmail) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cg_auth_token') : null;
      if (!token) return { success: false, error: 'Please sign in first to add friends.' };

      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendEmailOrName: nameOrEmail }),
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchFriends();
        return { success: true };
      }
      return { success: false, error: data.error || 'Could not add friend' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  sendRoomInvite: async (targetNameOrId, roomCode, hostName, hostAvatar, hostAvatarColor) => {
    return new Promise((resolve) => {
      const socket = getSocket();
      if (!socket || !socket.connected) {
        resolve({ success: false, message: 'Not connected to server' });
        return;
      }

      socket.emit(
        'send_room_invite',
        {
          targetUserIdOrName: targetNameOrId,
          roomCode,
          hostName,
          hostAvatar,
          hostAvatarColor,
        },
        (response: { success: boolean; online?: boolean; message?: string }) => {
          resolve(response || { success: true });
        }
      );
    });
  },
}));
