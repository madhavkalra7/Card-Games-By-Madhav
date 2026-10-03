import { create } from 'zustand';
import { getSocket } from '@/socket/client';
import { sounds } from '@/lib/sound';

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
  coins?: number;
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
  coins?: number;
  isOnline?: boolean;
}

export interface OnlinePlayer {
  userId?: string;
  name: string;
  avatarUrl?: string;
  avatarColor?: string;
  inRoom?: boolean;
  currentRoomCode?: string | null;
  roomStatus?: 'LOBBY' | 'PLAYING' | 'GAME_OVER' | null;
  gameType?: string | null;
  playerCount?: number;
}

export interface FriendRequestItem {
  id: string;
  _id?: string;
  fromUserId: string;
  fromName: string;
  fromEmail?: string;
  fromAvatarUrl?: string;
  fromAvatarColor?: string;
  fromAvatarId?: string;
  toUserId: string;
  toName: string;
  toEmail?: string;
  toAvatarUrl?: string;
  toAvatarColor?: string;
  toAvatarId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
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
  activeTab: 'leaderboard' | 'friends' | 'requests';
  leaderboard: LeaderboardPlayer[];
  friends: FriendUser[];
  pendingReceived: FriendRequestItem[];
  pendingSent: FriendRequestItem[];
  onlinePlayers: OnlinePlayer[];
  incomingInvite: RoomInvite | null;
  isLoading: boolean;
  searchQuery: string;

  // Actions
  setFriendsModalOpen: (open: boolean, tab?: 'leaderboard' | 'friends' | 'requests') => void;
  setInviteModalOpen: (open: boolean) => void;
  setActiveTab: (tab: 'leaderboard' | 'friends' | 'requests') => void;
  setSearchQuery: (query: string) => void;
  setIncomingInvite: (invite: RoomInvite | null) => void;

  fetchLeaderboard: () => Promise<void>;
  fetchFriends: () => Promise<void>;
  fetchOnlinePlayers: () => void;
  searchUsers: (query: string) => Promise<FriendUser[]>;
  sendFriendRequest: (nameOrEmail: string) => Promise<{ success: boolean; pending?: boolean; accepted?: boolean; message?: string; error?: string }>;
  respondToRequest: (requestId: string, action: 'ACCEPT' | 'REJECT') => Promise<{ success: boolean; error?: string; message?: string }>;
  addFriend: (nameOrEmail: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  sendRoomInvite: (targetNameOrId: string, roomCode: string, hostName: string, hostAvatar?: string, hostAvatarColor?: string) => Promise<{ success: boolean; online?: boolean; message?: string }>;
  initSocketListeners: () => void;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  isFriendsModalOpen: false,
  isInviteModalOpen: false,
  activeTab: 'leaderboard',
  leaderboard: [],
  friends: [],
  pendingReceived: [],
  pendingSent: [],
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
      if (data.success) {
        set({
          friends: Array.isArray(data.friends) ? data.friends : [],
          pendingReceived: Array.isArray(data.pendingReceived) ? data.pendingReceived : [],
          pendingSent: Array.isArray(data.pendingSent) ? data.pendingSent : [],
        });
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

  searchUsers: async (query: string) => {
    try {
      if (!query || !query.trim()) return [];
      const token = typeof window !== 'undefined' ? localStorage.getItem('cg_auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/friends?search=${encodeURIComponent(query.trim())}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        return data.users;
      }
      return [];
    } catch (err) {
      console.warn('Failed to search users:', err);
      return [];
    }
  },

  sendFriendRequest: async (nameOrEmail) => {
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
        sounds.playCardFlip();
        await get().fetchFriends();
        return {
          success: true,
          pending: data.pending,
          accepted: data.accepted,
          message: data.message || 'Friend request sent!',
        };
      }
      return { success: false, error: data.error || 'Could not send friend request' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  respondToRequest: async (requestId, action) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cg_auth_token') : null;
      if (!token) return { success: false, error: 'Please sign in first.' };

      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'ACCEPT') {
          sounds.playBazaarOpen();
        } else {
          sounds.playCardSlide();
        }
        await get().fetchFriends();
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Could not update friend request' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  addFriend: async (nameOrEmail) => {
    return await get().sendFriendRequest(nameOrEmail);
  },

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off('friend_request_received');
    socket.on('friend_request_received', (req: FriendRequestItem) => {
      sounds.playCardSlide();
      set((prev) => ({
        pendingReceived: [req, ...prev.pendingReceived.filter((r) => r.id !== req.id)],
      }));
    });

    socket.off('friend_request_updated');
    socket.on('friend_request_updated', () => {
      get().fetchFriends();
    });
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
