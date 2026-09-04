'use client';

import React, { useState } from 'react';
import { ToonHeroSection } from '@/components/landing/ToonHeroSection';
import { CreateRoomModal } from '@/components/modal/CreateRoomModal';
import { JoinRoomModal } from '@/components/modal/JoinRoomModal';

export default function LandingPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  return (
    <main className="relative w-full min-h-screen overflow-hidden bg-black selection:bg-white selection:text-black">
      {/* Full-Viewport Character Carousel Hero Section */}
      <ToonHeroSection
        onCreateRoom={() => setIsCreateOpen(true)}
        onJoinRoom={() => setIsJoinOpen(true)}
      />

      {/* Room Creation & Joining Modals */}
      <CreateRoomModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinRoomModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </main>
  );
}
