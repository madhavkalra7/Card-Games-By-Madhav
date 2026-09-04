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
  size?: 'xs' | 'sm' | 'md' | 'lg';
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
          isHighlighted && 'ring-2 ring-gold rounded-[14px] p-0.5 animate-pulse-gold'
        )}
      >
        {/* Empty state placeholder slot */}
        {!hasCards ? (
          <div
            className={cn(
              'border-2 border-dashed border-amber-400/25 rounded-[12px] bg-black/20 flex flex-col items-center justify-center p-1 sm:p-2',
              size === 'xs'
                ? 'w-10 h-14'
                : size === 'sm'
                ? 'w-12 h-16 sm:w-14 sm:h-20'
                : size === 'md'
                ? 'w-14 h-20 sm:w-20 sm:h-28'
                : 'w-20 h-28 sm:w-28 sm:h-40'
            )}
          >
            <span className="text-[9px] sm:text-xs text-amber-200/40 text-center font-medium uppercase tracking-wider">
              {type === 'hidden' ? 'Empty' : 'Right Deck'}
            </span>
          </div>
        ) : (
          <div className="relative">
            {/* Visual depth layers for cards underneath */}
            {count > 2 && (
              <div
                className={cn(
                  'absolute -bottom-1.5 -right-1.5 rounded-[12px] bg-red-950 border border-amber-900/40 opacity-70 pointer-events-none',
                  size === 'sm' ? 'w-14 h-20' : size === 'md' ? 'w-20 h-28' : 'w-28 h-40'
                )}
              />
            )}
            {count > 1 && (
              <div
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 rounded-[12px] bg-red-950 border border-amber-900/40 opacity-90 pointer-events-none',
                  size === 'sm' ? 'w-14 h-20' : size === 'md' ? 'w-20 h-28' : 'w-28 h-40'
                )}
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
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-600 to-amber-700 text-amber-50 text-[11px] font-black px-1.5 py-0.5 rounded-full border border-amber-300/60 shadow-md min-w-[20px] text-center">
              {count}
            </div>

            {/* Click to Draw Tooltip if clickable */}
            {isClickable && type === 'hidden' && (
              <div className="absolute inset-0 bg-gold/15 rounded-[12px] flex items-center justify-center pointer-events-none">
                <span className="bg-black/80 text-gold-light text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-gold/40 animate-bounce">
                  DRAW
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stack Label */}
      {label && (
        <span className="mt-1 text-[11px] font-semibold tracking-wider uppercase text-amber-200/60">
          {label}
        </span>
      )}
    </div>
  );
};
