'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { sounds } from '@/lib/sound';
import { ExitConfirmModal } from '../modal/ExitConfirmModal';
import { InviteFriendsModal } from '../modal/InviteFriendsModal';
import { useFriendsStore } from '@/store/friendsStore';
import { useAuthStore } from '@/store/authStore';
import { BookOpen, Check, Copy, LogOut, Volume2, VolumeX, UserPlus } from 'lucide-react';

interface HeaderProps {
  roomCode?: string;
}

export const Header: React.FC<HeaderProps> = ({ roomCode }) => {
  const { user } = useAuthStore();
  const { setRulesModalOpen, showToast, leaveRoom, gameState } = useGameStore();
  const { setInviteModalOpen } = useFriendsStore();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [showExitModal, setShowExitModal] = useState(false);

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

  const handleConfirmExit = () => {
    setShowExitModal(false);
    leaveRoom();
    router.push('/');
  };

  return (
    <>
      <header className="w-full bg-zinc-950/80 backdrop-blur-md border-b border-white/10 px-[max(0.6rem,env(safe-area-inset-left))] pr-[max(0.6rem,env(safe-area-inset-right))] sm:px-8 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:py-3 flex items-center justify-between z-30 sticky top-0">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-gold/60 shadow-gold-glow group-hover:scale-105 transition-transform shrink-0">
            <img src="/logo.png" alt="Card Games Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-base font-black tracking-wide text-white group-hover:text-gold transition-colors whitespace-nowrap">
              Card Games
            </span>
            <span className="hidden sm:block text-[10px] text-zinc-400 tracking-wider uppercase font-medium">
              By Madhav
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Casino Currency Coins Pill */}
          {user && (
            <div
              className="flex items-center gap-1.5 bg-zinc-900/90 border border-red-500/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all shadow-sm"
              title={`Casino Coins: ${(user.coins ?? 1000).toLocaleString()} Chips`}
            >
              <img
                src="/icons/casino-chip.png"
                alt="Casino Coins"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain filter drop-shadow animate-pulse"
              />
              <span className="font-mono text-xs sm:text-sm font-bold text-red-200">
                {(user.coins ?? 1000).toLocaleString()}
              </span>
            </div>
          )}

          {/* Room Code Badge (if in room) */}
          {roomCode && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 hover:border-gold/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all group shrink-0"
              title="Click to copy room code"
            >
              <span className="hidden xs:inline text-[10px] sm:text-xs text-zinc-400 font-medium">ROOM:</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-gold group-hover:text-gold-light">
                {roomCode}
              </span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-zinc-400 group-hover:text-white" />
              )}
            </button>
          )}

          {/* Direct Invite Friends button */}
          {roomCode && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-1 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-gold/60 hover:border-gold text-gold hover:bg-gold/25 text-xs font-bold transition-all shadow active:scale-95 cursor-pointer shrink-0"
              title="Direct Invite Friends to Room"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Invite Friends</span>
            </button>
          )}

          {/* Rules button */}
          <button
            onClick={() => setRulesModalOpen(true)}
            className="flex items-center gap-1 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-gold/50 text-xs font-bold text-zinc-200 hover:text-gold transition-all shadow shrink-0"
            title="View Rules"
          >
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            <span className="hidden md:inline">Rules</span>
          </button>

          {/* Mute/Unmute sound button */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-all shadow shrink-0"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Exit Room button */}
          {roomCode && (
            <button
              onClick={() => setShowExitModal(true)}
              title="Leave Room"
              className="p-1.5 sm:p-2 rounded-xl bg-red-950/40 border border-red-900/60 hover:bg-red-900/60 text-red-400 hover:text-white transition-all shadow active:scale-95 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Exit Confirmation Modal */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={handleConfirmExit}
        isPlaying={gameState?.status === 'PLAYING'}
      />

      {/* Invite Friends Modal */}
      {roomCode && <InviteFriendsModal roomCode={roomCode} />}
    </>
  );
};
