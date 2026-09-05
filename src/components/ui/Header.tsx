'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { sounds } from '@/lib/sound';
import { ExitConfirmModal } from '../modal/ExitConfirmModal';
import { InviteFriendsModal } from '../modal/InviteFriendsModal';
import { useFriendsStore } from '@/store/friendsStore';
import { BookOpen, Check, Copy, LogOut, Volume2, VolumeX, UserPlus } from 'lucide-react';

interface HeaderProps {
  roomCode?: string;
}

export const Header: React.FC<HeaderProps> = ({ roomCode }) => {
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
      <header className="w-full bg-zinc-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3 flex items-center justify-between z-30 sticky top-0">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center font-serif text-black font-black text-lg shadow-md group-hover:scale-105 transition-transform">
            ♠
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-black tracking-wide text-white group-hover:text-gold transition-colors">
              Card Games
            </span>
            <span className="text-[10px] text-zinc-400 tracking-wider uppercase font-medium">
              By Madhav
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Room Code Badge (if in room) */}
          {roomCode && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-gold/50 px-3 py-1.5 rounded-xl transition-all group"
              title="Click to copy room code"
            >
              <span className="text-xs text-zinc-400 font-medium">ROOM:</span>
              <span className="font-mono text-sm font-bold text-gold group-hover:text-gold-light">
                {roomCode}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
              )}
            </button>
          )}

          {/* Direct Invite Friends button */}
          {roomCode && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-gold/60 hover:border-gold text-gold hover:bg-gold/25 text-xs font-bold transition-all shadow active:scale-95 cursor-pointer"
              title="Direct Invite Friends to Room"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invite Friends</span>
            </button>
          )}

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
            <button
              onClick={() => setShowExitModal(true)}
              title="Leave Room"
              className="p-2 rounded-xl bg-red-950/40 border border-red-900/60 hover:bg-red-900/60 text-red-400 hover:text-white transition-all shadow active:scale-95"
            >
              <LogOut className="w-4 h-4" />
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
