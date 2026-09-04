'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { sounds } from '@/lib/sound';
import { BookOpen, Check, Copy, LogOut, Volume2, VolumeX } from 'lucide-react';

interface HeaderProps {
  roomCode?: string;
}

export const Header: React.FC<HeaderProps> = ({ roomCode }) => {
  const { setRulesModalOpen, showToast } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  const handleCopy = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    showToast(`Room code ${roomCode} copied to clipboard!`, 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    showToast(muted ? 'Sound muted' : 'Sound enabled', 'info');
  };

  return (
    <header className="w-full bg-zinc-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3 flex items-center justify-between z-30 sticky top-0">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center font-serif text-black font-black text-lg shadow-md group-hover:scale-105 transition-transform">
          ♠
        </div>
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-black tracking-wide text-white group-hover:text-gold transition-colors">
            CARD GAMES
          </span>
          <span className="text-[10px] text-zinc-400 -mt-1 font-medium tracking-widest uppercase">
            By Madhav
          </span>
        </div>
      </Link>

      {/* Room Code Badge & Copy (if inside a room) */}
      {roomCode && (
        <div className="flex items-center gap-2 bg-black/60 border border-gold/40 px-3 py-1.5 rounded-full shadow-md">
          <span className="text-[10px] sm:text-xs text-zinc-400 font-bold uppercase tracking-wider">
            Room Code:
          </span>
          <span className="font-mono font-black text-sm sm:text-base text-gold tracking-widest">
            {roomCode}
          </span>
          <button
            onClick={handleCopy}
            title="Copy Room Code"
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Controls: Sound, Rules, Exit */}
      <div className="flex items-center gap-2">
        {/* Rules button */}
        <button
          onClick={() => setRulesModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-gold/50 text-xs font-bold text-zinc-200 hover:text-gold transition-all shadow"
        >
          <BookOpen className="w-4 h-4 text-gold" />
          <span className="hidden sm:inline">Rules</span>
        </button>

        {/* Mute/Unmute sound button */}
        <button
          onClick={handleToggleSound}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-all shadow"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Exit Room button */}
        {roomCode && (
          <Link
            href="/"
            title="Leave Room"
            className="p-2 rounded-xl bg-red-950/40 border border-red-900/60 hover:bg-red-900/60 text-red-400 hover:text-white transition-all shadow"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        )}
      </div>
    </header>
  );
};
