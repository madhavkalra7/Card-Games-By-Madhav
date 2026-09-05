'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, RotateCcw, LogOut, Medal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/sound';

export interface LeaderboardRank {
  playerId: string;
  name: string;
  avatarColor: string;
  rank: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  rankings: LeaderboardRank[];
  myPlayerId: string;
  isHost: boolean;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  rankings,
  myPlayerId,
  isHost,
  onPlayAgain,
  onExit,
}) => {
  useEffect(() => {
    if (isOpen) {
      sounds.playVictory();
      // Confetti burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#d4af37', '#e11d48', '#10b981', '#3b82f6'],
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.5 },
        });
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Sort rankings by rank ascending (1, 2, 3...)
  const sorted = [...rankings].sort((a, b) => a.rank - b.rank);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 via-[#18110b] to-[#0d0a06] border-2 border-gold/60 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.35)] p-4 sm:p-6 flex flex-col items-center select-none overflow-hidden">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-gold/25 blur-2xl pointer-events-none rounded-full" />

        {/* Trophy & Title */}
        <div className="relative flex flex-col items-center mb-3 sm:mb-5">
          <div className="relative mb-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-gold-glow flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
                <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 animate-pulse" />
              </div>
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-center text-gold-gradient font-anton">
            Match Leaderboard
          </h2>
          <p className="text-zinc-400 text-xs text-center mt-0.5">
            Dukki Bazaar Tournament Results
          </p>
        </div>

        {/* Rankings List */}
        <div className="w-full flex flex-col gap-2 my-1 sm:my-2 max-h-[48vh] overflow-y-auto pr-1">
          {sorted.map((item) => {
            const isSelf = item.playerId === myPlayerId;
            const isFirst = item.rank === 1;
            const isSecond = item.rank === 2;
            const isThird = item.rank === 3;

            return (
              <div
                key={item.playerId}
                className={cn(
                  'relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all duration-200',
                  isFirst && 'bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-transparent border-amber-400/70 shadow-gold-glow',
                  isSecond && 'bg-gradient-to-r from-slate-400/20 to-transparent border-slate-300/60',
                  isThird && 'bg-gradient-to-r from-amber-800/20 to-transparent border-amber-700/60',
                  item.rank > 3 && 'bg-black/40 border-white/10',
                  isSelf && 'ring-2 ring-gold/80'
                )}
              >
                {/* Left: Rank Medal & Avatar & Name */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {/* Rank Badge */}
                  <div
                    className={cn(
                      'w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-md',
                      isFirst && 'bg-gradient-to-br from-yellow-300 to-amber-500 text-black ring-2 ring-yellow-200 shadow-gold-glow',
                      isSecond && 'bg-gradient-to-br from-slate-200 to-slate-400 text-black ring-1 ring-white',
                      isThird && 'bg-gradient-to-br from-amber-600 to-amber-800 text-white ring-1 ring-amber-300',
                      item.rank > 3 && 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    )}
                  >
                    {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `#${item.rank}`}
                  </div>

                  {/* Player Avatar */}
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 border border-white/30 shadow"
                    style={{ backgroundColor: item.avatarColor || '#3b82f6' }}
                  >
                    {item.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Player Name */}
                  <div className="flex flex-col min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-zinc-100 truncate max-w-[130px] sm:max-w-[160px]">
                        {item.name}
                      </span>
                      {isSelf && (
                        <span className="text-[8px] sm:text-[9px] bg-gold/20 text-gold font-mono px-1 py-0.2 rounded font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400">
                      {isFirst ? 'Match Champion' : `${item.rank === 2 ? 'Runner Up' : `${item.rank}th Place`}`}
                    </span>
                  </div>
                </div>

                {/* Right: Place Text Tag */}
                <div className="shrink-0">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-wider',
                      isFirst && 'bg-amber-400 text-black',
                      isSecond && 'bg-slate-300 text-slate-950',
                      isThird && 'bg-amber-700 text-white',
                      item.rank > 3 && 'bg-zinc-800 text-zinc-400'
                    )}
                  >
                    {isFirst ? '1st Place' : isSecond ? '2nd Place' : isThird ? '3rd Place' : `${item.rank}th`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions Footer */}
        <div className="w-full flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-white/10">
          {isHost ? (
            <button
              onClick={onPlayAgain}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-gold-glow transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>
          ) : (
            <div className="flex-1 text-center text-xs text-zinc-400 py-2">
              Waiting for host to start new game...
            </div>
          )}

          <button
            onClick={onExit}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-200 font-bold text-xs uppercase tracking-wider shadow transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Match</span>
          </button>
        </div>

      </div>
    </div>
  );
};
