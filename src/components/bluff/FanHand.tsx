'use client';

import React, { useMemo } from 'react';
import { Card } from '@/lib/types';
import { PlayingCard } from '../card/PlayingCard';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Check } from 'lucide-react';
import { useViewportOrientation } from '@/hooks/useViewportOrientation';

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
  const { isMobile, viewportWidth } = useViewportOrientation();
  const total = cards.length;

  // Adaptive geometry for realistic hand fan
  const { fanStyles, containerWidth } = useMemo(() => {
    if (total === 0) return { fanStyles: [], containerWidth: 280 };

    const mid = (total - 1) / 2;

    // Fan angle spread:
    // Gentle tilt across the hand, never exceeding 58 deg total span
    const maxSpan = isMobile
      ? Math.min(48, Math.max(16, total * 2.2))
      : Math.min(58, Math.max(22, total * 2.5));
    const angleStep = total > 1 ? maxSpan / (total - 1) : 0;

    // Card spacing calculation:
    // Fits hands with up to 30+ cards cleanly within screen width without getting cut off
    let cardSpacing = 26;
    if (isMobile) {
      const availWidth = Math.max(260, (viewportWidth || 360) - 36);
      cardSpacing = total > 1 ? Math.max(10, Math.min(22, (availWidth - 54) / (total - 1))) : 0;
    } else {
      // Desktop: available width ~650px - 850px
      const availWidth = Math.min(850, Math.max(480, (viewportWidth || 1200) * 0.65));
      cardSpacing = total > 1 ? Math.max(16, Math.min(34, (availWidth - 72) / (total - 1))) : 0;
    }

    const cardWidth = isMobile ? 48 : 66;
    const computedWidth = Math.max(260, (total - 1) * cardSpacing + cardWidth + 30);

    const styles = cards.map((card, i) => {
      const offset = i - mid;
      const angle = offset * angleStep;
      const translateX = offset * cardSpacing;

      return {
        card,
        angle,
        translateX,
        zIndex: i + 1,
      };
    });

    return { fanStyles: styles, containerWidth: computedWidth };
  }, [cards, total, isMobile, viewportWidth]);

  if (total === 0) {
    return (
      <div className="w-full flex items-center justify-center py-3 text-zinc-500 text-xs font-bold uppercase tracking-wider">
        No cards left in hand!
      </div>
    );
  }

  const cardSize = isMobile ? (total > 15 ? 'xs' : 'sm') : 'sm';
  const selectLift = isMobile ? 24 : 32;

  return (
    <div className="relative w-full flex flex-col items-center select-none pointer-events-auto">
      {/* Hand Controls / Status Toolbar */}
      <div className="flex items-center gap-1.5 xs:gap-2 mb-1 z-20">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/85 backdrop-blur-md border border-white/15 text-[10px] xs:text-[11px] font-bold text-zinc-300 shadow-md">
          <span>Hand:</span>
          <span className="text-gold font-mono font-black text-xs">{total}</span>
          <span>cards</span>
        </div>

        {selectedCardIds.size > 0 && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full backdrop-blur-md border text-[10px] xs:text-[11px] font-bold shadow-md animate-in fade-in zoom-in-95 duration-150',
              selectedCardIds.size === 4
                ? 'bg-amber-500/35 border-amber-400 text-amber-300 font-black ring-1 ring-amber-400/40'
                : 'bg-amber-500/25 border-gold/60 text-gold'
            )}
          >
            <Check className="w-3 h-3" />
            <span>{selectedCardIds.size}/4 Selected</span>
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="ml-1 text-[9px] xs:text-[10px] text-zinc-300 hover:text-white underline cursor-pointer"
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
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[9px] xs:text-[10px] font-bold shadow transition-all active:scale-95 cursor-pointer"
          >
            <ArrowUpDown className="w-2.5 h-2.5 text-gold" />
            <span>Sort</span>
          </button>
        )}
      </div>

      {/* Fan Cards Container: Anchored baseline so cards are 100% visible and NEVER cut off */}
      <div className="relative w-full max-w-full overflow-x-auto overflow-y-hidden no-scrollbar scrollbar-none flex items-end justify-start sm:justify-center px-4 pt-7 pb-1 min-h-[95px] xs:min-h-[110px] sm:min-h-[135px]">
        <div
          className="relative flex items-end justify-center mx-auto shrink-0"
          style={{
            width: `${containerWidth}px`,
            height: isMobile ? '86px' : '110px',
          }}
        >
          {fanStyles.map(({ card, angle, translateX, zIndex }) => {
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
                  'absolute bottom-1 cursor-pointer transition-transform duration-200 ease-out origin-bottom group touch-manipulation',
                  disabled && 'opacity-70 cursor-not-allowed'
                )}
                style={{
                  transform: `translateX(${translateX}px) translateY(${isSelected ? -selectLift : 0}px) rotate(${angle}deg)`,
                  transformOrigin: '50% 115%',
                  zIndex: isSelected ? 80 + zIndex : zIndex,
                }}
              >
                <div
                  className={cn(
                    'relative transition-all duration-200',
                    'group-hover:-translate-y-3 group-hover:scale-105',
                    isSelected && 'scale-105'
                  )}
                >
                  <PlayingCard
                    card={card}
                    size={cardSize}
                    className={cn(
                      'shadow-2xl transition-all',
                      isSelected && 'ring-2.5 sm:ring-3 ring-amber-400 ring-offset-1 sm:ring-offset-2 ring-offset-black shadow-gold-glow',
                      isMyTurn && !isSelected && 'hover:ring-2 hover:ring-amber-300/80'
                    )}
                  />

                  {/* Selection Indicator Badge */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-1.5 w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 rounded-full bg-amber-400 text-black font-black text-[9px] xs:text-[10px] flex items-center justify-center shadow-lg border border-white">
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
