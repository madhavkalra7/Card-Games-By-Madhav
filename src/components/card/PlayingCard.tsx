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
  showIndexBadge?: boolean;
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

export function getCardSvgPath(rank: Rank | string, suit: Suit | string): string {
  if (rank === '🃏' || rank === 'JOKER') return '/cards/red_joker.svg';

  const suitMap: Record<string, string> = {
    H: 'hearts',
    D: 'diamonds',
    C: 'clubs',
    S: 'spades',
    HEARTS: 'hearts',
    DIAMONDS: 'diamonds',
    CLUBS: 'clubs',
    SPADES: 'spades',
    VAULT: 'spades',
  };

  const rankMap: Record<string, string> = {
    A: 'ace',
    ACE: 'ace',
    'A♠': 'ace',
    J: 'jack',
    JACK: 'jack',
    Q: 'queen',
    QUEEN: 'queen',
    K: 'king',
    KING: 'king',
  };

  const cleanSuit = suitMap[suit.toUpperCase()] || 'spades';
  const cleanRank = rankMap[rank.toUpperCase()] || rank.toLowerCase();

  return `/cards/${cleanRank}_of_${cleanSuit}.svg`;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  faceDown = false,
  className,
  onClick,
  interactive = false,
  size = 'md',
  glow = false,
  showIndexBadge = false,
}) => {
  // Dimension scale based on authentic poker card ratio (~2.5 x 3.5 inches -> 1:1.4)
  // Zoomed & enhanced for mobile devices so cards and rank fonts are comfortably readable without eye strain
  const sizeClasses = {
    xxs: 'w-[44px] h-[62px] xs:w-[48px] xs:h-[67px]',
    xs: 'w-[54px] h-[76px] xs:w-[60px] xs:h-[84px] sm:w-[58px] sm:h-[81px] md:w-[62px] md:h-[87px]',
    sm: 'w-[66px] h-[92px] xs:w-[72px] xs:h-[101px] sm:w-[72px] sm:h-[101px] md:w-[78px] md:h-[109px]',
    md: 'w-[76px] h-[106px] xs:w-[84px] xs:h-[118px] sm:w-[86px] sm:h-[120px] md:w-[92px] md:h-[129px]',
    lg: 'w-[90px] h-[126px] sm:w-[104px] sm:h-[146px] md:w-[120px] md:h-[168px]',
    xl: 'w-[118px] h-[165px] sm:w-[155px] sm:h-[217px]',
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

  const svgPath = getCardSvgPath(card.rank, card.suit);
  const isRed = card.suit === 'H' || card.suit === 'D';
  const suitSymbol = card.suit === 'H' ? '♥' : card.suit === 'D' ? '♦' : card.suit === 'C' ? '♣' : '♠';

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-[#fdfdfd] rounded-[7px] xs:rounded-[9px] sm:rounded-[11px] md:rounded-[13px] select-none shadow-md overflow-hidden',
        'transition-all duration-200 flex items-center justify-center p-0.5',
        'border-[1.5px] border-zinc-300 sm:border-zinc-400',
        sizeClasses,
        interactive && 'hover:-translate-y-2 hover:shadow-card-hover cursor-pointer active:scale-95 touch-manipulation',
        glow && 'ring-2 sm:ring-3 ring-gold shadow-gold-glow animate-pulse-gold',
        className
      )}
    >
      <img
        src={svgPath}
        alt={`${card.rank} of ${card.suit}`}
        className="w-full h-full object-contain pointer-events-none select-none rounded-[5px] xs:rounded-[7px] sm:rounded-[9px]"
        loading="eager"
        decoding="async"
      />

      {/* High-visibility corner rank & suit indicator overlay to eliminate eye strain */}
      {showIndexBadge && (
        <div
          className={cn(
            "absolute top-0.5 left-0.5 flex flex-col items-center justify-center leading-none z-10 pointer-events-none rounded px-0.5 py-0.5 shadow-sm",
            "bg-white/95 backdrop-blur-[2px] border border-black/15"
          )}
        >
          <span
            className={cn(
              "font-black font-mono leading-none tracking-tight",
              isRed ? "text-red-600" : "text-zinc-950",
              size === 'xxs' ? "text-[10px]" : size === 'xs' ? "text-[11px] xs:text-xs" : "text-xs xs:text-sm"
            )}
          >
            {card.rank}
          </span>
          <span
            className={cn(
              "leading-none mt-0.5",
              isRed ? "text-red-600" : "text-zinc-950",
              size === 'xxs' ? "text-[8px]" : size === 'xs' ? "text-[9px]" : "text-[10px] xs:text-xs"
            )}
          >
            {suitSymbol}
          </span>
        </div>
      )}
    </div>
  );
};
