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
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
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
  // Enhanced for mobile devices so cards and rank fonts appear bold, thick, and readable
  const sizeClasses = {
    xxs: 'w-[36px] h-[50px] text-[9px]',
    xs: 'w-[44px] h-[62px] xs:w-[48px] xs:h-[67px] sm:w-[46px] sm:h-[65px] md:w-[50px] md:h-[70px] text-[10px] xs:text-[11px] sm:text-xs',
    sm: 'w-[54px] h-[76px] xs:w-[58px] xs:h-[82px] sm:w-[58px] sm:h-[81px] md:w-[66px] md:h-[92px] text-xs xs:text-[13px] sm:text-sm md:text-base',
    md: 'w-[64px] h-[90px] xs:w-[70px] xs:h-[98px] sm:w-[74px] sm:h-[104px] md:w-[82px] md:h-[115px] text-xs xs:text-sm sm:text-base md:text-lg',
    lg: 'w-[78px] h-[108px] sm:w-[92px] sm:h-[128px] md:w-[110px] md:h-[154px] text-sm sm:text-base md:text-xl',
    xl: 'w-[110px] h-[154px] sm:w-[150px] sm:h-[210px] text-base sm:text-2xl',
  }[size];

  if (faceDown || !card) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'relative rounded-[9px] sm:rounded-[12px] select-none transition-all duration-200 overflow-hidden cursor-default',
          'border-[1.5px] sm:border-2 border-amber-900/80 shadow-card',
          sizeClasses,
          interactive && 'hover:-translate-y-1.5 hover:shadow-card-hover cursor-pointer active:scale-95',
          glow && 'ring-2 sm:ring-3 ring-gold shadow-gold-glow',
          className
        )}
        style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)',
        }}
      >
        {/* Luxury Indian filigree card back pattern */}
        <div className="absolute inset-0.5 sm:inset-1 rounded-[7px] sm:rounded-[9px] border sm:border-2 border-amber-400/50 p-0.5 sm:p-1 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full rounded-[5px] sm:rounded-[6px] border border-amber-400/30 bg-red-950/90 flex items-center justify-center relative">
            {/* Geometric Mandala / Taash Back SVG */}
            <svg viewBox="0 0 100 140" className="w-full h-full text-amber-400/35 opacity-85">
              <defs>
                <pattern id="cardPattern" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M8 0L16 8L8 16L0 8Z" fill="none" stroke="currentColor" strokeWidth="0.9" />
                  <circle cx="8" cy="8" r="2.5" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100" height="140" fill="url(#cardPattern)" />
              <circle cx="50" cy="70" r="22" fill="#450a0a" stroke="#d4af37" strokeWidth="1.8" />
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
        'relative bg-[#fefefe] rounded-[9px] sm:rounded-[12px] border-2 border-zinc-400 select-none shadow-md',
        'flex flex-col justify-between p-1 sm:p-1.5 md:p-2 transition-all duration-200',
        sizeClasses,
        interactive && 'hover:-translate-y-2 hover:shadow-card-hover cursor-pointer active:scale-95',
        glow && 'ring-2 sm:ring-3 ring-gold shadow-gold-glow animate-pulse-gold',
        className
      )}
    >
      {/* Top Left Rank & Suit */}
      <div className="flex flex-col items-center leading-none w-3.5 xs:w-4 sm:w-4.5 md:w-5">
        <span className={cn('font-black text-[12px] xs:text-[13px] sm:text-sm md:text-base tracking-tight', textColor)}>{card.rank}</span>
        <SuitIcon suit={card.suit} className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 mt-0.5" />
      </div>

      {/* Center Art / Large Suit */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {['J', 'Q', 'K'].includes(card.rank) ? (
          <div className="flex flex-col items-center opacity-95">
            <span className={cn('font-serif font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl', textColor)}>
              {card.rank}
            </span>
            <SuitIcon suit={card.suit} className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 opacity-90" />
          </div>
        ) : card.rank === 'A' ? (
          <SuitIcon suit={card.suit} className="w-7 h-7 xs:w-9 xs:h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 opacity-95" />
        ) : (
          <div className="grid grid-cols-2 gap-0.5 xs:gap-1 sm:gap-1.5 items-center justify-items-center opacity-90">
            <SuitIcon suit={card.suit} className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
            <SuitIcon suit={card.suit} className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
          </div>
        )}
      </div>

      {/* Bottom Right Inverted Rank & Suit */}
      <div className="flex flex-col items-center leading-none w-3.5 xs:w-4 sm:w-4.5 md:w-5 self-end rotate-180">
        <span className={cn('font-black text-[12px] xs:text-[13px] sm:text-sm md:text-base tracking-tight', textColor)}>{card.rank}</span>
        <SuitIcon suit={card.suit} className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 mt-0.5" />
      </div>
    </div>
  );
};
