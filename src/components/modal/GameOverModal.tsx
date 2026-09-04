'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerClientView } from '@/lib/types';
import { Crown, RotateCcw, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameOverModalProps {
  winner: { id: string; name: string; avatarColor: string } | null;
  players: PlayerClientView[];
  isHost: boolean;
  onPlayAgain: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  players,
  isHost,
  onPlayAgain,
}) => {
  useEffect(() => {
    if (winner) {
      // Fire victory confetti burst
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [winner]);

  if (!winner) return null;

  // Sort players by remaining cards (ascending: winner with 0 cards at top)
  const scoreboard = [...players].sort((a, b) => a.hiddenCount - b.hiddenCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in duration-300">
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-gold rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        
        {/* Crown Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-gold-glow mb-4">
          <Trophy className="w-10 h-10 text-black fill-black" />
        </div>

        {/* Winner Announcement */}
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
          Victory!
        </h2>
        <div className="mt-2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 border border-gold/40">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
            style={{ backgroundColor: winner.avatarColor }}
          >
            {winner.name.charAt(0)}
          </div>
          <span className="font-extrabold text-gold text-lg">{winner.name}</span>
          <span className="text-xs text-zinc-400">cleared all hidden cards!</span>
        </div>

        {/* Scoreboard */}
        <div className="w-full mt-6 bg-zinc-900/60 rounded-2xl border border-zinc-800 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 text-left mb-3">
            Final Standings
          </h3>
          <div className="space-y-2">
            {scoreboard.map((p, idx) => (
              <div
                key={p.id}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-xl text-sm',
                  idx === 0
                    ? 'bg-amber-500/10 border border-gold/50 text-gold-light font-bold'
                    : 'bg-zinc-800/40 text-zinc-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-xs font-black text-zinc-500">#{idx + 1}</span>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span className="truncate max-w-[140px]">{p.name}</span>
                  {idx === 0 && <Crown className="w-4 h-4 text-gold fill-gold" />}
                </div>
                <div className="text-xs">
                  <span className="font-bold">{p.hiddenCount}</span> cards left
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 w-full flex flex-col gap-2">
          {isHost ? (
            <button
              onClick={onPlayAgain}
              className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300 shadow-gold-glow active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Deal Again & Rematch</span>
            </button>
          ) : (
            <span className="text-xs text-zinc-400">Waiting for host to restart match...</span>
          )}
        </div>
      </div>
    </div>
  );
};
