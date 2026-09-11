'use client';

import React, { useMemo } from 'react';
import { Card, Rank } from '@/lib/types';
import { PlayingCard } from '../card/PlayingCard';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Check } from 'lucide-react';

interface FanHandProps {
  cards: Card[];
  selectedCardIds: Set<string>;
  onToggleCard: (cardId: string) => void;
  onClearSelection?: () => void;
  onSortCards?: () => void;
  isMyTurn?: boolean;
  disabled?: boolean;
}

export const FanHand: React.FC<FanHandProps> = ({
  cards,
  selectedCardIds,
  onToggleCard,
  onClearSelection,
  onSortCards,
  isMyTurn = false,
  disabled = false,
}) => {
  const total = cards.length;

  // Calculate arc geometry for realistic fan shape
  // Max width spread and rotation angle adapted to total cards
  const fanStyles = useMemo(() => {
    if (total === 0) return [];

    const mid = (total - 1) / 2;
    // Total angle span clamped between 30 and 70 degrees
    const maxSpan = Math.min(70, Math.max(28, total * 3.2));
    const angleStep = total > 1 ? maxSpan / (total - 1) : 0;

    // Overlap step: larger on small hands, tighter on big hands (20+ cards)
    const cardSpacing = total > 18 ? 22 : total > 12 ? 28 : total > 7 ? 36 : 48;
    const curveIntensity = total > 12 ? 0.8 : 1.1;

    return cards.map((card, i) => {
      const offset = i - mid;
      const angle = offset * angleStep;
      // Parabolic y displacement (edges curve downwards)
      const translateY = Math.pow(Math.abs(offset), 1.7) * curveIntensity;
      const translateX = offset * cardSpacing;

      return {
        card,
        angle,
        translateX,
        translateY,
        zIndex: i + 1,
      };
    });
  }, [cards, total]);

  if (total === 0) {
    return (
      <div className="w-full flex items-center justify-center py-6 text-zinc-500 text-xs font-bold uppercase tracking-wider">
        No cards left in hand!
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col items-center select-none pointer-events-auto">
      {/* Hand Controls / Status Toolbar */}
      <div className="flex items-center gap-2 mb-1.5 z-20">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[11px] font-bold text-zinc-300 shadow-md">
          <span>Hand:</span>
          <span className="text-gold font-mono font-black text-xs">{total}</span>
          <span>cards</span>
        </div>

        {selectedCardIds.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-gold/50 text-gold text-[11px] font-bold shadow-md animate-in fade-in zoom-in-95 duration-150">
            <Check className="w-3 h-3" />
            <span>{selectedCardIds.size} Selected</span>
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="ml-1 text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {onSortCards && (
          <button
            type="button"
            onClick={onSortCards}
            title="Sort cards by rank"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[10px] font-bold shadow transition-all active:scale-95 cursor-pointer"
          >
            <ArrowUpDown className="w-2.5 h-2.5 text-gold" />
            <span className="hidden xs:inline">Sort</span>
          </button>
        )}
      </div>

      {/* Fan Cards Container */}
      <div className="relative w-full max-w-full overflow-x-auto overflow-y-visible scrollbar-none flex items-end justify-center pt-8 pb-4 px-4 min-h-[120px] sm:min-h-[145px] md:min-h-[160px]">
        <div
          className="relative flex items-end justify-center"
          style={{
            // Container width dynamically scales with card count
            width: `${Math.max(280, Math.min(950, total * (total > 15 ? 26 : 40) + 90))}px`,
            height: '115px',
          }}
        >
          {fanStyles.map(({ card, angle, translateX, translateY, zIndex }) => {
            const isSelected = selectedCardIds.has(card.id);

            return (
              <div
                key={card.id}
                onClick={() => {
                  if (!disabled) {
                    onToggleCard(card.id);
                  }
                }}
                className={cn(
                  'absolute bottom-0 cursor-pointer transition-transform duration-200 ease-out origin-bottom group',
                  disabled && 'opacity-70 cursor-not-allowed'
                )}
                style={{
                  transform: `translateX(${translateX}px) translateY(${isSelected ? translateY - 32 : translateY}px) rotate(${angle}deg)`,
                  zIndex: isSelected ? 80 + zIndex : zIndex,
                }}
              >
                <div
                  className={cn(
                    'relative transition-all duration-200',
                    'group-hover:-translate-y-4 group-hover:scale-105',
                    isSelected && 'scale-105'
                  )}
                >
                  <PlayingCard
                    card={card}
                    size="sm"
                    className={cn(
                      'shadow-2xl transition-all',
                      isSelected && 'ring-3 ring-amber-400 ring-offset-2 ring-offset-black shadow-gold-glow',
                      isMyTurn && !isSelected && 'hover:ring-2 hover:ring-amber-300/80'
                    )}
                  />

                  {/* Selection Indicator Badge */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-400 text-black font-black text-[10px] flex items-center justify-center shadow-lg border border-white">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
