'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerClientView } from '@/lib/types';
import { Crown, RotateCcw, Trophy, LogOut, Medal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/sound';

interface GameOverModalProps {
  status: 'LOBBY' | 'PLAYING' | 'GAME_OVER';
  winner: { id: string; name: string; avatarColor: string } | null;
  rankings?: Array<{ playerId: string; name: string; avatarColor: string; rank: number }>;
  players: PlayerClientView[];
  myPlayerId?: string;
  isHost: boolean;
  onPlayAgain: () => void;
  onExit?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  winner,
  rankings = [],
  players,
  myPlayerId,
  isHost,
  onPlayAgain,
  onExit,
}) => {
  useEffect(() => {
    if (status === 'GAME_OVER') {
      sounds.playVictory();
      // Fire victory confetti burst
      const count = 180;
      const defaults = { origin: { y: 0.6 } };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
          colors: ['#f59e0b', '#d4af37', '#e11d48', '#10b981', '#3b82f6'],
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [status]);

  // CRITICAL: Only render when game is officially GAME_OVER!
  // When 1 player finishes, status remains PLAYING and game continues without popup interruption!
  if (status !== 'GAME_OVER') return null;

  // Compile final standings:
  // If server provided rankings list, use it!
  // Fallback: sort by rank or cards remaining
  let standings: Array<{
    id: string;
    name: string;
    avatarColor: string;
    rank: number;
    cardsLeft?: number;
  }> = [];

  if (rankings && rankings.length > 0) {
    standings = [...rankings].map(r => ({
      id: r.playerId,
      name: r.name,
      avatarColor: r.avatarColor,
      rank: r.rank,
    }));
  } else {
    // Fallback based on players
    const sorted = [...players].sort((a, b) => (a.hiddenCount + a.rightDeckCount) - (b.hiddenCount + b.rightDeckCount));
    standings = sorted.map((p, idx) => ({
      id: p.id,
      name: p.name,
      avatarColor: p.avatarColor,
      rank: p.rank || (idx + 1),
      cardsLeft: p.hiddenCount + p.rightDeckCount,
    }));
  }

  // Sort by rank ascending (1, 2, 3...)
  standings.sort((a, b) => a.rank - b.rank);
  const firstWinner = standings.find(s => s.rank === 1) || standings[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in duration-300 overflow-y-auto select-none">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-gradient-to-b from-zinc-950 via-[#18110b] to-[#0d0a06] border-2 border-gold rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-[0_0_50px_rgba(212,175,55,0.35)] flex flex-col items-center text-center">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-gold/25 blur-2xl pointer-events-none rounded-full" />

        {/* Trophy Icon */}
        <div className="relative mb-2 sm:mb-3">
          <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-gold-glow flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
              <Trophy className="w-7 h-7 sm:w-9 sm:h-9 text-amber-400 animate-pulse" />
            </div>
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-wider font-serif">
          Match Leaderboard
        </h2>
        <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
          Tournament Complete • All Ranks Decided
        </p>

        {/* Winner Highlight Capsule */}
        {firstWinner && (
          <div className="mt-2.5 sm:mt-3 flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gold/15 border border-gold/40 shadow-sm">
            <div
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow"
              style={{ backgroundColor: firstWinner.avatarColor || '#3b82f6' }}
            >
              {firstWinner.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-extrabold text-gold text-sm sm:text-base">
              🏆 {firstWinner.name}
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-300 font-medium">
              1st Winner!
            </span>
          </div>
        )}

        {/* Standings List */}
        <div className="w-full mt-3 sm:mt-5 bg-zinc-900/70 rounded-xl sm:rounded-2xl border border-zinc-800/80 p-2.5 sm:p-4">
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 text-left mb-2 sm:mb-2.5">
            Final Standings
          </h3>
          <div className="space-y-1.5 sm:space-y-2">
            {standings.map((p) => {
              const isFirst = p.rank === 1;
              const isSecond = p.rank === 2;
              const isThird = p.rank === 3;
              const isSelf = p.id === myPlayerId;

              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center justify-between p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all',
                    isFirst
                      ? 'bg-amber-500/15 border border-gold/60 text-gold-light font-bold shadow-gold-glow'
                      : isSecond
                      ? 'bg-slate-300/10 border border-slate-400/40 text-slate-200'
                      : isThird
                      ? 'bg-amber-900/15 border border-amber-700/40 text-amber-200'
                      : 'bg-zinc-800/40 border border-white/5 text-zinc-300',
                    isSelf && 'ring-1.5 ring-gold'
                  )}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Medal/Rank */}
                    <span className="w-5 text-center text-xs sm:text-sm font-black shrink-0">
                      {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `#${p.rank}`}
                    </span>

                    {/* Avatar */}
                    <div
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shrink-0 shadow"
                      style={{ backgroundColor: p.avatarColor || '#3b82f6' }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate max-w-[110px] sm:max-w-[150px]">{p.name}</span>
                      {isSelf && (
                        <span className="text-[8px] sm:text-[9px] bg-white/20 text-white px-1 py-0.2 rounded font-mono">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rank Tag */}
                  <div className="shrink-0">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-wider',
                        isFirst && 'bg-amber-400 text-black',
                        isSecond && 'bg-slate-300 text-black',
                        isThird && 'bg-amber-700 text-white',
                        p.rank > 3 && 'bg-zinc-800 text-zinc-400'
                      )}
                    >
                      {isFirst ? '1st Place' : isSecond ? '2nd Place' : isThird ? '3rd Place' : `${p.rank}th Place`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-4 sm:mt-6 w-full flex flex-col sm:flex-row gap-2">
          {isHost ? (
            <button
              onClick={onPlayAgain}
              className="flex-1 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300 shadow-gold-glow active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Deal Again & Rematch</span>
            </button>
          ) : (
            <div className="flex-1 py-2.5 text-center text-[11px] sm:text-xs text-zinc-400">
              Waiting for host to restart match...
            </div>
          )}

          {onExit && (
            <button
              onClick={onExit}
              className="py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-200 shadow active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
