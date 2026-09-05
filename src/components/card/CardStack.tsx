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
              'border-2 border-dashed border-amber-400/25 rounded-[8px] sm:rounded-[12px] bg-black/20 flex flex-col items-center justify-center p-0.5 sm:p-1',
              size === 'xxs'
                ? 'w-8 h-11'
                : size === 'xs'
                ? 'w-9 h-13 sm:w-10 sm:h-14'
                : size === 'sm'
                ? 'w-10 h-14 sm:w-12 sm:h-16 md:w-14 md:h-20'
                : size === 'md'
                ? 'w-12 h-16 sm:w-16 sm:h-22 md:w-20 md:h-28'
                : 'w-16 h-22 sm:w-22 sm:h-32 md:w-28 md:h-40'
            )}
          >
            <span className="text-[7px] sm:text-[9px] text-amber-200/40 text-center font-medium uppercase tracking-wider">
              {type === 'hidden' ? 'Empty' : 'Right'}
            </span>
          </div>
        ) : (
          <div className="relative">
            {/* Visual 3D depth layers for stacked cards matching exact card size */}
            {count > 2 && (
              <div
                className="absolute inset-0 translate-x-1 translate-y-1 rounded-[6px] sm:rounded-[10px] bg-black/60 border border-amber-950/60 pointer-events-none"
              />
            )}
            {count > 1 && (
              <div
                className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-[6px] sm:rounded-[10px] bg-black/40 border border-amber-950/40 pointer-events-none"
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

            {/* Count Badge */}
            <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-gradient-to-r from-amber-600 to-amber-700 text-amber-50 text-[8px] sm:text-[10px] md:text-[11px] font-black px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-full border border-amber-300/60 shadow-md min-w-[16px] sm:min-w-[20px] text-center">
              {count}
            </div>

            {/* Click to Draw Tooltip if clickable */}
            {isClickable && type === 'hidden' && (
              <div className="absolute inset-0 bg-gold/15 rounded-[8px] sm:rounded-[12px] flex items-center justify-center pointer-events-none">
                <span className="bg-black/85 text-gold-light text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-gold/40 animate-bounce">
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
