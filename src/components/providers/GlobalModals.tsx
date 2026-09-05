'use client';

import React, { useEffect } from 'react';
import { RoomInviteToast } from '@/components/ui/RoomInviteToast';
import { FriendsModal } from '@/components/modal/FriendsModal';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { getSocket } from '@/socket/client';

export const GlobalModals: React.FC = () => {
  const { user, checkAuth } = useAuthStore();
  const { myName, myAvatar } = useGameStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Keep socket updated with current user registration
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const register = () => {
      const activeName = user?.name || myName;
      if (!activeName) return;

      socket.emit('register_user', {
        userId: user?.id,
        name: activeName,
        avatarUrl: user?.avatarUrl,
        avatarColor: user?.avatarColor || myAvatar,
      });
    };

    if (socket.connected) {
      register();
    }
    socket.on('connect', register);

    return () => {
      socket.off('connect', register);
    };
  }, [user, myName, myAvatar]);

  return (
    <>
      <RoomInviteToast />
      <FriendsModal />
    </>
  );
};
