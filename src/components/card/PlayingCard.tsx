'use client';

import React from 'react';
import { Card, Suit, Rank } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card?: Card | null;
  faceDown?: boolean;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
}

export const SuitIcon: React.FC<{ suit: Suit; className?: string }> = ({ suit, className = 'w-4 h-4' }) => {
  switch (suit) {
    case 'H': // Hearts
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cn("text-red-600", className)}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case 'D': // Diamonds
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cn("text-red-600", className)}>
          <path d="M12 2L3.5 12 12 22l8.5-10L12 2z" />
        </svg>
      );
    case 'C': // Clubs
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cn("text-zinc-900", className)}>
          <path d="M19.5 9.5a3.5 3.5 0 00-4.9-3.2A4.5 4.5 0 006 8a4.5 4.5 0 00.4 1.9 3.5 3.5 0 00-1.9 3.1 3.5 3.5 0 003.5 3.5h2.5v2.5H9v2h6v-2h-1.5v-2.5h2.5a3.5 3.5 0 003.5-3.5 3.5 3.5 0 00-1.5-2.9 3.5 3.5 0 001.5-.1z" />
        </svg>
      );
    case 'S': // Spades
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cn("text-zinc-900", className)}>
          <path d="M12 2.5C9.5 6.5 5 10.5 5 14a5 5 0 008.5 3.5v2H11v2h4v-2h-2.5v-2A5 5 0 0019 14c0-3.5-4.5-7.5-7-11.5z" />
        </svg>
      );
  }
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  faceDown = false,
  className,
  onClick,
  interactive = false,
  size = 'md',
  glow = false,
}) => {
  // Dimension scale based on authentic poker card ratio (~2.5 x 3.5 inches -> 1:1.4)
  const sizeClasses = {
    sm: 'w-14 h-20 text-xs',
    md: 'w-20 h-28 text-sm',
    lg: 'w-28 h-40 text-lg',
    xl: 'w-36 h-52 text-2xl',
  }[size];

  if (faceDown || !card) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'relative rounded-[12px] select-none transition-all duration-200 overflow-hidden cursor-default',
          'border border-amber-900/60 shadow-card',
          sizeClasses,
          interactive && 'hover:-translate-y-1.5 hover:shadow-card-hover cursor-pointer active:scale-95',
          glow && 'ring-2 ring-gold shadow-gold-glow',
          className
        )}
        style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)',
        }}
      >
        {/* Luxury Indian filigree card back pattern */}
        <div className="absolute inset-1 rounded-[9px] border-2 border-amber-400/40 p-1 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full rounded-[6px] border border-amber-400/20 bg-red-950/80 flex items-center justify-center relative">
            {/* Geometric Mandala / Taash Back SVG */}
            <svg viewBox="0 0 100 140" className="w-full h-full text-amber-400/30 opacity-70">
              <defs>
                <pattern id="cardPattern" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M8 0L16 8L8 16L0 8Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <circle cx="8" cy="8" r="2.5" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100" height="140" fill="url(#cardPattern)" />
              <circle cx="50" cy="70" r="22" fill="#450a0a" stroke="#d4af37" strokeWidth="1.5" />
              <polygon points="50,54 55,65 66,70 55,75 50,86 45,75 34,70 45,65" fill="#d4af37" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'H' || card.suit === 'D';
  const textColor = isRed ? 'text-red-600' : 'text-zinc-950';

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-[#fdfdfc] rounded-[12px] border border-zinc-300 select-none shadow-card',
        'flex flex-col justify-between p-1.5 sm:p-2 transition-all duration-200',
        sizeClasses,
        interactive && 'hover:-translate-y-2 hover:shadow-card-hover cursor-pointer active:scale-95',
        glow && 'ring-2 ring-gold shadow-gold-glow animate-pulse-gold',
        className
      )}
    >
      {/* Top Left Rank & Suit */}
      <div className="flex flex-col items-center leading-none w-5">
        <span className={cn('font-black tracking-tighter', textColor)}>{card.rank}</span>
        <SuitIcon suit={card.suit} className="w-3.5 h-3.5 mt-0.5" />
      </div>

      {/* Center Art / Large Suit */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {['J', 'Q', 'K'].includes(card.rank) ? (
          <div className="flex flex-col items-center opacity-85">
            <span className={cn('font-serif font-black text-2xl sm:text-4xl opacity-90', textColor)}>
              {card.rank}
            </span>
            <SuitIcon suit={card.suit} className="w-5 h-5 sm:w-7 sm:h-7 opacity-75" />
          </div>
        ) : card.rank === 'A' ? (
          <SuitIcon suit={card.suit} className="w-8 h-8 sm:w-12 sm:h-12 opacity-85" />
        ) : (
          <div className="grid grid-cols-2 gap-1 items-center justify-items-center opacity-80">
            <SuitIcon suit={card.suit} className="w-4 h-4 sm:w-5 sm:h-5" />
            <SuitIcon suit={card.suit} className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      {/* Bottom Right Inverted Rank & Suit */}
      <div className="flex flex-col items-center leading-none w-5 self-end rotate-180">
        <span className={cn('font-black tracking-tighter', textColor)}>{card.rank}</span>
        <SuitIcon suit={card.suit} className="w-3.5 h-3.5 mt-0.5" />
      </div>
    </div>
  );
};
