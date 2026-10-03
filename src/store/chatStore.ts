'use client';

import { create } from 'zustand';
import { FriendUser, useFriendsStore } from './friendsStore';
import { useAuthStore } from './authStore';
import { useGameStore } from './gameStore';
import { getSocket } from '@/socket/client';
import { sounds } from '@/lib/sound';

export interface DirectChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  text: string;
  createdAt: string;
  read?: boolean;
  isSelf?: boolean;
}

interface ChatStoreState {
  activeFriend: FriendUser | null;
  isChatWindowOpen: boolean;
  messagesByFriend: Record<string, DirectChatMessage[]>;
  unreadCounts: Record<string, number>;
  isLoadingHistory: boolean;

  // Actions
  openChatWithFriend: (friend: FriendUser) => void;
  closeChatWindow: () => void;
  sendMessage: (text: string) => Promise<boolean>;
  fetchMessagesForFriend: (friend: FriendUser) => Promise<void>;
  markAsRead: (friendKey: string) => void;
  initSocketListeners: () => void;
}

const LOCAL_STORAGE_KEY = 'cg_direct_chat_history_v1';

function loadCachedHistory(): Record<string, DirectChatMessage[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCachedHistory(data: Record<string, DirectChatMessage[]>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  activeFriend: null,
  isChatWindowOpen: false,
  messagesByFriend: loadCachedHistory(),
  unreadCounts: {},
  isLoadingHistory: false,

  openChatWithFriend: (friend: FriendUser) => {
    const key = (friend.id || friend.name || friend.email || '').toLowerCase();
    set({
      activeFriend: friend,
      isChatWindowOpen: true,
      unreadCounts: {
        ...get().unreadCounts,
        [key]: 0,
      },
    });

    get().fetchMessagesForFriend(friend);
  },

  closeChatWindow: () => {
    set({ isChatWindowOpen: false, activeFriend: null });
  },

  markAsRead: (friendKey: string) => {
    const key = friendKey.toLowerCase();
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [key]: 0,
      },
    }));
  },

  fetchMessagesForFriend: async (friend: FriendUser) => {
    try {
      set({ isLoadingHistory: true });
      const { user } = useAuthStore.getState();
      const myName = user?.name || useGameStore.getState().myName || 'Player';
      const myId = user?.id || myName;
      const friendId = friend.id || friend.name;
      const friendKey = (friend.id || friend.name || '').toLowerCase();

      const token = typeof window !== 'undefined' ? localStorage.getItem('cg_auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `/api/chat/direct?myId=${encodeURIComponent(myId)}&myName=${encodeURIComponent(myName)}&friendId=${encodeURIComponent(friendId)}&friendName=${encodeURIComponent(friend.name)}`,
        { headers }
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.messages)) {
        const myIdentifiers = [myId.toLowerCase(), myName.toLowerCase(), user?.email?.toLowerCase()].filter(Boolean);

        const mapped: DirectChatMessage[] = data.messages.map((m: any) => ({
          ...m,
          isSelf: myIdentifiers.includes((m.senderId || '').toLowerCase()) ||
                  myIdentifiers.includes((m.senderName || '').toLowerCase()),
        }));

        set((state) => {
          const updated = {
            ...state.messagesByFriend,
            [friendKey]: mapped,
          };
          saveCachedHistory(updated);
          return { messagesByFriend: updated };
        });
      }
    } catch (err) {
      console.warn('Failed to load direct chat history:', err);
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  sendMessage: async (text: string) => {
    const trimmed = text.trim();
    const { activeFriend } = get();
    if (!trimmed || !activeFriend) return false;

    // Verify recipient is an accepted friend
    const { friends } = useFriendsStore.getState();
    const isAcceptedFriend = friends.some(
      (f) =>
        (activeFriend.id && f.id === activeFriend.id) ||
        (activeFriend.name && f.name.toLowerCase() === activeFriend.name.toLowerCase()) ||
        (activeFriend.email && f.email?.toLowerCase() === activeFriend.email.toLowerCase())
    );

    if (!isAcceptedFriend) {
      useGameStore.getState().showToast('Friend request pending. Chat will be enabled once your request is accepted.', 'error');
      return false;
    }

    const { user } = useAuthStore.getState();
    const myName = user?.name || useGameStore.getState().myName || 'Player';
    const myId = user?.id || myName;
    const myAvatar = user?.avatarUrl || user?.avatarColor || useGameStore.getState().myAvatar;
    const friendKey = (activeFriend.id || activeFriend.name || '').toLowerCase();

    const tempMessage: DirectChatMessage = {
      id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: myId,
      senderName: myName,
      senderAvatar: myAvatar,
      recipientId: activeFriend.id || activeFriend.name,
      recipientName: activeFriend.name,
      text: trimmed,
      createdAt: new Date().toISOString(),
      isSelf: true,
      read: true,
    };

    // 1. Optimistic local update for instant feel
    set((state) => {
      const prevList = state.messagesByFriend[friendKey] || [];
      const updated = {
        ...state.messagesByFriend,
        [friendKey]: [...prevList, tempMessage],
      };
      saveCachedHistory(updated);
      return { messagesByFriend: updated };
    });

    sounds.playCardSlide();

    // 2. Broadcast via Socket.IO
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('send_direct_chat', {
        senderId: myId,
        senderName: myName,
        senderAvatar: myAvatar,
        recipientId: activeFriend.id || activeFriend.name,
        recipientName: activeFriend.name,
        text: trimmed,
      });
    }

    // 3. Persist to MongoDB API
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cg_auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch('/api/chat/direct', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          senderId: myId,
          senderName: myName,
          senderAvatar: myAvatar,
          recipientId: activeFriend.id || activeFriend.name,
          recipientName: activeFriend.name,
          text: trimmed,
        }),
      }).catch(() => {});
    } catch {}

    return true;
  },

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off('direct_chat_message');
    socket.on('direct_chat_message', (msg: DirectChatMessage) => {
      const { user } = useAuthStore.getState();
      const myName = user?.name || useGameStore.getState().myName || 'Player';
      const myIdentifiers = [user?.id?.toLowerCase(), myName.toLowerCase()].filter(Boolean);

      const isSelf = myIdentifiers.includes((msg.senderId || '').toLowerCase()) ||
                     myIdentifiers.includes((msg.senderName || '').toLowerCase());

      const otherKey = isSelf
        ? (msg.recipientId || msg.recipientName || '').toLowerCase()
        : (msg.senderId || msg.senderName || '').toLowerCase();

      const incomingMsg: DirectChatMessage = {
        ...msg,
        isSelf,
      };

      set((state) => {
        const prevList = state.messagesByFriend[otherKey] || [];
        // Deduplicate
        if (prevList.some((m) => m.id === msg.id || (m.text === msg.text && Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 2000))) {
          return state;
        }

        const isCurrentlyOpenWithThisFriend =
          state.isChatWindowOpen &&
          state.activeFriend &&
          (state.activeFriend.id?.toLowerCase() === otherKey || state.activeFriend.name?.toLowerCase() === otherKey);

        const newUnreadCount = isCurrentlyOpenWithThisFriend
          ? 0
          : (state.unreadCounts[otherKey] || 0) + 1;

        const updated = {
          ...state.messagesByFriend,
          [otherKey]: [...prevList, incomingMsg],
        };
        saveCachedHistory(updated);

        return {
          messagesByFriend: updated,
          unreadCounts: {
            ...state.unreadCounts,
            [otherKey]: newUnreadCount,
          },
        };
      });

      if (!isSelf) {
        sounds.playCardDraw();
      }
    });
  },
}));
