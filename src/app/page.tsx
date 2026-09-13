'use client';

import React, { useState } from 'react';
import { ToonHeroSection } from '@/components/landing/ToonHeroSection';
import { CreateRoomModal } from '@/components/modal/CreateRoomModal';
import { JoinRoomModal } from '@/components/modal/JoinRoomModal';
import { AuthModal } from '@/components/modal/AuthModal';
import { ProfileModal } from '@/components/modal/ProfileModal';
import { ResumeMatchModal } from '@/components/modal/ResumeMatchModal';
import { GameType } from '@/lib/types';

export default function LandingPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [createGameType, setCreateGameType] = useState<GameType>('DUKKI_BAZAAR');

  const handleOpenCreate = (gt?: GameType) => {
    setCreateGameType(gt || 'DUKKI_BAZAAR');
    setIsCreateOpen(true);
  };

  return (
    <main className="relative w-full min-h-screen overflow-hidden bg-black selection:bg-white selection:text-black">
      {/* Full-Viewport Character Carousel Hero Section */}
      <ToonHeroSection
        onCreateRoom={handleOpenCreate}
        onJoinRoom={() => setIsJoinOpen(true)}
      />

      {/* Room Creation & Joining Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        initialGameType={createGameType}
      />
      <JoinRoomModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />

      {/* Resume Match Prompt Modal if player has an active session */}
      <ResumeMatchModal />

      {/* Authentication & Profile Modals */}
      <AuthModal />
      <ProfileModal />
    </main>
  );
}
