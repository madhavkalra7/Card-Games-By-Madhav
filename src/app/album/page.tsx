'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlbumBook } from '@/components/album/AlbumBook';
import { CardInspectModal } from '@/components/album/CardInspectModal';
import { ArrowLeft, Volume2, VolumeX, Sparkles, RotateCcw, CheckSquare, Crown } from 'lucide-react';
import { sounds } from '@/lib/sound';
import { useAlbumStore } from '@/store/albumStore';

export default function AlbumPage() {
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const unlockAll = useAlbumStore((s) => s.unlockAll);
  const lockAll = useAlbumStore((s) => s.lockAll);
  const unlockedCount = useAlbumStore((s) => s.getUnlockedCount());
  const totalCount = useAlbumStore((s) => s.getTotalCount());

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <main className="relative w-full min-h-[100dvh] bg-black text-white selection:bg-amber-400 selection:text-black flex flex-col justify-between overflow-x-hidden">
      {/* Background Ambience: Subtle Radial Glows & Royal Gilded Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-amber-600/15 via-purple-900/10 to-transparent blur-3xl opacity-80" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-indigo-950/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-rose-950/20 blur-3xl" />
      </div>

      {/* Top Header Navigation */}
      <header className="relative z-50 w-full px-2.5 xs:px-3 sm:px-6 py-2 xs:py-2.5 sm:py-3.5 flex items-center justify-between border-b border-white/10 bg-black/70 backdrop-blur-xl">
        {/* Left: Back Button & Title */}
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center justify-center w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 shadow-md shrink-0"
            title="Return to Main Game Lobby"
          >
            <ArrowLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1 xs:gap-1.5">
              <Crown className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-amber-400 shrink-0" />
              <h1 className="text-[11px] xs:text-xs sm:text-sm font-black uppercase text-white tracking-wider sm:tracking-widest font-serif leading-none truncate">
                ROYAL CARD ALBUM
              </h1>
            </div>
            <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] text-amber-400/90 font-bold uppercase tracking-wider block mt-0.5 truncate max-w-[140px] xs:max-w-[220px] sm:max-w-none">
              52 Trump Cards + 5 Mythics
            </span>
          </div>
        </div>

        {/* Right Action Tools: Sound Toggle + Test Unlock Toggle */}
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2.5 shrink-0">
          {/* Collection Status Pill */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] sm:text-xs font-mono font-bold text-amber-300">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{unlockedCount}/{totalCount}</span>
          </div>

          {/* Demo Preview: Unlock All Toggle */}
          <button
            onClick={unlockedCount === totalCount ? lockAll : unlockAll}
            className="flex items-center justify-center gap-1 px-2 py-1 xs:px-2.5 xs:py-1 sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/30 hover:from-amber-500/40 hover:to-yellow-500/40 border border-amber-400/40 text-[9px] sm:text-[11px] font-bold text-amber-200 transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
            title="Preview all cards unlocked or reset to starter collection"
          >
            {unlockedCount === totalCount ? (
              <>
                <RotateCcw className="w-3 h-3" />
                <span className="hidden xs:inline">Reset</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3 h-3" />
                <span className="hidden xs:inline">Unlock All</span>
              </>
            )}
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={handleToggleSound}
            className="flex items-center justify-center w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 cursor-pointer shrink-0"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-300" />}
          </button>
        </div>
      </header>

      {/* Center Section: The Master 3D Book */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-1 xs:px-2 py-1 sm:py-3 w-full">
        <AlbumBook />
      </section>

      {/* 3D Holographic Card Inspection Modal */}
      <CardInspectModal />
    </main>
  );
}
