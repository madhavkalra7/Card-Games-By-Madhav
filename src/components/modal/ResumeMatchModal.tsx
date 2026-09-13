'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/socket/client';
import { getOrCreateSessionId } from '@/lib/utils';
import { getActiveRoom, clearActiveRoom, ActiveMatchRecord } from '@/lib/activeMatch';
import { GameType } from '@/lib/types';
import { sounds } from '@/lib/sound';
import { Play, LogOut, Flame, ShieldAlert, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveMatchInfo {
  roomCode: string;
  gameType: GameType;
  roomStatus?: string;
  playerCount?: number;
  isSpectator?: boolean;
  playerName?: string;
  autoAbortRemaining?: number | null;
}

export const ResumeMatchModal: React.FC = () => {
  const router = useRouter();
  const [matchInfo, setMatchInfo] = useState<ActiveMatchInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    // 1. Initial check from localStorage
    const local = getActiveRoom();
    if (local && local.roomCode) {
      setMatchInfo({
        roomCode: local.roomCode,
        gameType: local.gameType,
        roomStatus: 'PLAYING',
      });
      setIsOpen(true);
    }

    // 2. Query server for authoritative active match
    const socket = getSocket();
    const sessionId = getOrCreateSessionId();

    const doCheck = () => {
      socket.emit('check_active_match', { sessionId }, (res: any) => {
        if (res && res.hasActiveMatch && res.roomCode) {
          setMatchInfo({
            roomCode: res.roomCode,
            gameType: res.gameType || 'DUKKI_BAZAAR',
            roomStatus: res.roomStatus || 'PLAYING',
            playerCount: res.playerCount || 1,
            isSpectator: res.isSpectator || false,
            playerName: res.playerName || '',
            autoAbortRemaining: res.autoAbortRemaining ?? null,
          });
          if (res.autoAbortRemaining && res.autoAbortRemaining > 0) {
            setCountdown(res.autoAbortRemaining);
          }
          setIsOpen(true);
        } else {
          // If server confirms no active room, clear obsolete localStorage
          if (!res?.hasActiveMatch) {
            clearActiveRoom();
            setIsOpen(false);
            setMatchInfo(null);
          }
        }
      });
    };

    if (socket.connected) {
      doCheck();
    } else {
      socket.once('connect', doCheck);
    }

    // Also listen for match aborted or player kicked so prompt dismisses automatically
    socket.on('match_aborted', () => {
      clearActiveRoom();
      setIsOpen(false);
      setMatchInfo(null);
    });

    return () => {
      socket.off('match_aborted');
    };
  }, []);

  // Timer countdown hook for 2-minute disconnect window
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          clearActiveRoom();
          setIsOpen(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleResume = () => {
    if (!matchInfo) return;
    sounds.playCardSlide();
    setIsOpen(false);
    router.push(`/room/${matchInfo.roomCode}`);
  };

  const handleCancel = () => {
    if (matchInfo) {
      const socket = getSocket();
      const sessionId = getOrCreateSessionId();
      socket.emit('leaveRoom', { roomCode: matchInfo.roomCode, sessionId });
    }
    clearActiveRoom();
    setIsOpen(false);
    setMatchInfo(null);
  };

  if (!isOpen || !matchInfo) return null;

  const isPlaying = matchInfo.roomStatus === 'PLAYING';
  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2.5 xs:p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto my-auto bg-zinc-950 border-2 border-gold/80 rounded-2xl sm:rounded-3xl p-4 xs:p-5 sm:p-7 shadow-2xl flex flex-col text-white touch-manipulation"
      >
        {/* Subtle Ambient Gold Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close / Dismiss Button */}
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-3.5 sm:top-4 right-3.5 sm:right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          title="Cancel and start new game"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Header with Gaming Controller / Flame Icon */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-gold shrink-0 shadow-gold-glow animate-pulse">
            <Flame className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              Active Match Detected
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white font-serif tracking-wide">
              Resume Your Match?
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400">
              Khel wapas shuru karein ya cancel karein?
            </p>
          </div>
        </div>

        {/* Active Room Badge */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 mb-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Room Code</span>
            <span className="text-base sm:text-lg font-mono font-black text-gold">#{matchInfo.roomCode}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-400 font-semibold">
              {matchInfo.gameType === 'BLUFF_MASTER' ? 'Bluff Master' : 'Dukki Bazaar'}
            </span>
            <span className={cn(
              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border mt-0.5",
              isPlaying
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            )}>
              {isPlaying ? 'Match Live' : 'In Lobby'}
            </span>
          </div>
        </div>

        {/* Explanatory Notice */}
        <div className="bg-zinc-900/50 p-3 sm:p-3.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1.5 mb-5 leading-relaxed">
          <p className="font-semibold text-white">
            Aap is room me khel rahe the!
          </p>
          <p className="text-[11px] sm:text-xs text-zinc-400">
            Rejoin karte hi aapke sabhi cards aur game progress continue ho jayegi.
          </p>

          {countdown !== null && countdown > 0 && (
            <div className="mt-2 p-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Auto-abort timer: Rejoin within <strong>{formatTime(countdown)}</strong>!</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs sm:text-sm font-bold transition-all active:scale-95 text-center order-2 sm:order-1"
          >
            Cancel (Naya Room)
          </button>
          <button
            type="button"
            onClick={handleResume}
            className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black text-xs sm:text-sm font-black uppercase tracking-wider shadow-gold-glow transition-all active:scale-95 flex items-center justify-center gap-2 order-1 sm:order-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Yes, Resume Match</span>
          </button>
        </div>

      </div>
    </div>
  );
};
