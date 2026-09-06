'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlbumBook } from '@/components/album/AlbumBook';
import { CardInspectModal } from '@/components/album/CardInspectModal';
import { ArrowLeft, Volume2, VolumeX, Sparkles, BookOpen } from 'lucide-react';
import { sounds } from '@/lib/sound';
import { useAlbumStore } from '@/store/albumStore';

export default function AlbumPage() {
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const unlockedCount = useAlbumStore((s) => s.getUnlockedCount());
  const totalCount = useAlbumStore((s) => s.getTotalCount());

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <main className="relative w-full min-h-[100dvh] bg-gradient-to-b from-[#fbf9f4] via-[#f4efe4] to-[#ebe3d3] text-stone-800 selection:bg-red-600 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Background Ambience: Subtle Warm Studio Lighting & Soft Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft Warm Vignette */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-amber-500/10 via-red-900/5 to-transparent blur-3xl opacity-70" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[350px] bg-stone-400/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[350px] bg-amber-600/10 blur-3xl" />
      </div>

      {/* Top Header Navigation: Clean White Theme */}
      <header className="relative z-50 w-full px-2.5 xs:px-3 sm:px-6 py-2 xs:py-2.5 sm:py-3.5 flex items-center justify-between border-b border-stone-200/80 bg-white/85 backdrop-blur-md shadow-xs">
        {/* Left: Back Button & Title */}
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center justify-center w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 transition-all active:scale-95 shadow-xs shrink-0"
            title="Return to Main Game Lobby"
          >
            <ArrowLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-stone-700" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1 xs:gap-1.5">
              <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] shadow-xs">
                📖
              </div>
              <h1 className="text-[12px] xs:text-xs sm:text-sm font-black uppercase text-red-950 tracking-wider sm:tracking-widest font-serif leading-none truncate">
                ROYAL CARD ALBUM
              </h1>
            </div>
            <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] text-red-700 font-bold uppercase tracking-wider block mt-0.5 truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none">
              Shahi Trump Card Grimoire • 57 Collectibles
            </span>
          </div>
        </div>

        {/* Right Action Tools: Collection Counter & Sound Toggle */}
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 shrink-0">
          {/* Collection Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 text-[10px] sm:text-xs font-mono font-bold text-red-900 shadow-xs">
            <Sparkles className="w-3 h-3 text-red-600" />
            <span>{unlockedCount} / {totalCount} Collected</span>
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={handleToggleSound}
            className="flex items-center justify-center w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 transition-all active:scale-95 cursor-pointer shrink-0"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-stone-400" /> : <Volume2 className="w-3.5 h-3.5 text-red-700" />}
          </button>
        </div>
      </header>

      {/* Center Section: The Master 3D Red Book (Kitaab) */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-1 xs:px-2 py-1 sm:py-3 w-full">
        <AlbumBook />
      </section>

      {/* 3D Card Inspection Modal */}
      <CardInspectModal />
    </main>
  );
}
