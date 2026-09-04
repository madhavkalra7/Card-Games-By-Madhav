'use client';

import React from 'react';
import { Card } from '@/lib/types';
import { PlayingCard } from './PlayingCard';
import { cn } from '@/lib/utils';
import { ArrowUp, CornerDownRight } from 'lucide-react';

interface FloatingRevealedCardProps {
  card: Card | null;
  canPlayCenter: boolean;
  onPlayCenter: () => void;
  onPlayOwnRightDeck: () => void;
  timeRemaining: number;
}

export const FloatingRevealedCard: React.FC<FloatingRevealedCardProps> = ({
  card,
  canPlayCenter,
  onPlayCenter,
  onPlayOwnRightDeck,
  timeRemaining,
}) => {
  if (!card) return null;

  const isTimerLow = timeRemaining <= 10;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-300 pointer-events-auto">
      {/* Timer Bar */}
      <div className="mb-2 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-gold/40 shadow-lg">
        <span className="text-xs text-zinc-300 font-medium">Your Turn Timer:</span>
        <span
          className={cn(
            'text-xs font-black px-2 py-0.2 rounded-full font-mono',
            isTimerLow ? 'bg-red-600 text-white animate-pulse' : 'bg-gold text-black'
          )}
        >
          {timeRemaining}s
        </span>
      </div>

      {/* Floating Card with Action Buttons container */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-950/85 backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl border-2 border-gold/60 shadow-2xl">
        {/* Floating Card with pulse glow */}
        <div className="relative animate-float-card">
          <PlayingCard card={card} size="lg" glow={true} />
          <div className="absolute -top-2.5 -right-2.5 bg-gold text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow border border-yellow-200">
            Drawn Card
          </div>
        </div>

        {/* Action Decision Buttons */}
        <div className="flex flex-col gap-2 w-full sm:w-48">
          <span className="text-[11px] text-amber-200/80 font-bold uppercase tracking-wider text-center">
            Choose Placement
          </span>

          {/* Place on Center Button */}
          <button
            onClick={onPlayCenter}
            disabled={!canPlayCenter}
            className={cn(
              'flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all shadow-md',
              canPlayCenter
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300 hover:scale-[1.02] active:scale-95 shadow-gold-glow'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            )}
          >
            <ArrowUp className="w-4 h-4" />
            <span>Place on Center</span>
          </button>

          {/* Place on Own Right Deck Button */}
          <button
            onClick={onPlayOwnRightDeck}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-zinc-500 transition-all active:scale-95"
          >
            <CornerDownRight className="w-4 h-4 text-amber-400" />
            <span>Pass to Own Deck</span>
          </button>

          <span className="text-[10px] text-zinc-400 text-center leading-tight">
            (Or click any opponent's right deck to place rank + 1)
          </span>
        </div>
      </div>
    </div>
  );
};
