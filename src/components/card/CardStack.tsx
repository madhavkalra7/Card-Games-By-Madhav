'use client';

import React from 'react';
import { Card } from '@/lib/types';
import { PlayingCard } from './PlayingCard';
import { cn } from '@/lib/utils';

interface CardStackProps {
  type: 'hidden' | 'right';
  count: number;
  topCard?: Card | null;
  label?: string;
  isClickable?: boolean;
  onClick?: () => void;
  isHighlighted?: boolean;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
}

export const CardStack: React.FC<CardStackProps> = ({
  type,
  count,
  topCard,
  label,
  isClickable = false,
  onClick,
  isHighlighted = false,
  size = 'md',
}) => {
  const hasCards = count > 0;

  return (
    <div className="flex flex-col items-center select-none group">
      {/* 3D Stack Container */}
      <div
        onClick={isClickable ? onClick : undefined}
        className={cn(
          'relative transition-transform duration-200',
          isClickable && 'cursor-pointer hover:scale-105 active:scale-95',
          isHighlighted && 'ring-2 ring-gold rounded-[10px] sm:rounded-[14px] p-0.5 animate-pulse-gold'
        )}
      >
        {/* Empty state placeholder slot */}
        {!hasCards ? (
          <div
            className={cn(
              'border-2 border-dashed rounded-[9px] sm:rounded-[12px] flex flex-col items-center justify-center p-0.5 sm:p-1 transition-all',
              isClickable && type === 'hidden'
                ? 'border-amber-400 bg-amber-500/25 shadow-gold-glow animate-pulse'
                : 'border-amber-400/35 bg-black/30',
              size === 'xxs'
                ? 'w-[36px] h-[50px]'
                : size === 'xs'
                ? 'w-[44px] h-[62px] xs:w-[48px] xs:h-[67px] sm:w-[46px] sm:h-[65px] md:w-[50px] md:h-[70px]'
                : size === 'sm'
                ? 'w-[54px] h-[76px] xs:w-[58px] xs:h-[82px] sm:w-[58px] sm:h-[81px] md:w-[66px] md:h-[92px]'
                : size === 'md'
                ? 'w-[64px] h-[90px] xs:w-[70px] xs:h-[98px] sm:w-[74px] sm:h-[104px] md:w-[82px] md:h-[115px]'
                : 'w-[78px] h-[108px] sm:w-[92px] sm:h-[128px] md:w-[110px] md:h-[154px]'
            )}
          >
            <span className={cn(
              "text-[8px] xs:text-[9px] sm:text-[10px] text-center font-black uppercase tracking-wider leading-tight",
              isClickable && type === 'hidden' ? "text-amber-300 animate-bounce" : "text-amber-200/50"
            )}>
              {type === 'hidden' ? (isClickable ? 'FLIP ↻' : 'Empty') : 'Right'}
            </span>
          </div>
        ) : (
          <div className="relative">
            {/* Visual 3D depth layers for stacked cards matching exact card size */}
            {count > 2 && (
              <div
                className="absolute inset-0 translate-x-1 translate-y-1 rounded-[7px] sm:rounded-[10px] bg-black/70 border border-amber-950/70 pointer-events-none"
              />
            )}
            {count > 1 && (
              <div
                className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-[7px] sm:rounded-[10px] bg-black/50 border border-amber-950/50 pointer-events-none"
              />
            )}

            {/* Top Card */}
            {type === 'hidden' ? (
              <PlayingCard
                faceDown={true}
                size={size}
                interactive={isClickable}
                glow={isHighlighted}
              />
            ) : (
              <PlayingCard
                card={topCard}
                faceDown={false}
                size={size}
                interactive={isClickable}
                glow={isHighlighted}
              />
            )}

            {/* Count Badge - Enhanced for High Contrast on Mobile */}
            <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-gradient-to-r from-amber-500 to-amber-700 text-white text-[9px] xs:text-[10px] sm:text-[11px] font-black px-1.5 py-0.2 sm:py-0.5 rounded-full border border-amber-300 shadow-lg min-w-[18px] sm:min-w-[22px] text-center z-20">
              {count}
            </div>

            {/* Click to Draw Tooltip if clickable */}
            {isClickable && type === 'hidden' && (
              <div className="absolute inset-0 bg-gold/15 rounded-[9px] sm:rounded-[12px] flex items-center justify-center pointer-events-none">
                <span className="bg-black/90 text-gold font-black text-[9px] xs:text-[10px] sm:text-xs px-2 py-0.5 rounded shadow-lg border border-gold/50 animate-bounce tracking-wide">
                  DRAW
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stack Label - Hidden on mobile screens to save vertical space */}
      {label && (
        <span className="hidden sm:block mt-0.5 sm:mt-1 text-[8px] sm:text-[10px] font-bold tracking-wider uppercase text-amber-200/60">
          {label}
        </span>
      )}
    </div>
  );
};
