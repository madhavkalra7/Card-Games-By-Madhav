'use client';

import React, { useMemo } from 'react';
import { Card, Suit } from '@/lib/types';
import { PlayingCard } from '../card/PlayingCard';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Play, Sparkles, Check } from 'lucide-react';
import { useViewportOrientation } from '@/hooks/useViewportOrientation';

interface BhabhoFanHandProps {
  cards: Card[];
  selectedCardId: string | null;
  canPlayCardIds: string[];
  isMyTurn: boolean;
  leadSuit: Suit | null;
  isFirstTrickOfGame: boolean;
  onSelectCard: (cardId: string) => void;
  onPlaySelectedCard: () => void;
  onSortCards?: () => void;
  sortMode?: 'suit' | 'rank';
  onIllegalCardTap?: (card: Card) => void;
  isFinished?: boolean;
}

export const BhabhoFanHand: React.FC<BhabhoFanHandProps> = ({
  cards,
  selectedCardId,
  canPlayCardIds,
  isMyTurn,
  leadSuit,
  isFirstTrickOfGame,
  onSelectCard,
  onPlaySelectedCard,
  onSortCards,
  sortMode = 'suit',
  onIllegalCardTap,
  isFinished = false,
}) => {
  const { isMobile, isLandscape, viewportWidth, viewportHeight } = useViewportOrientation();
  const total = cards.length;
  const isLandscapeMobile = isLandscape && (viewportHeight <= 520 || isMobile);

  // Adaptive geometry for hand fan
  const { fanStyles, containerWidth } = useMemo(() => {
    if (total === 0) return { fanStyles: [], containerWidth: 280 };

    const mid = (total - 1) / 2;

    const maxSpan = isLandscapeMobile
      ? Math.min(36, Math.max(12, total * 1.5))
      : isMobile
      ? Math.min(46, Math.max(14, total * 2.0))
      : Math.min(56, Math.max(20, total * 2.4));
    const angleStep = total > 1 ? maxSpan / (total - 1) : 0;

    let cardSpacing = 24;
    if (isLandscapeMobile) {
      const availWidth = Math.max(260, (viewportWidth || 600) - 120);
      cardSpacing = total > 1 ? Math.max(7, Math.min(18, (availWidth - 60) / (total - 1))) : 0;
    } else if (isMobile) {
      const availWidth = Math.max(240, (viewportWidth || 360) - 32);
      cardSpacing = total > 1 ? Math.max(8, Math.min(22, (availWidth - 50) / (total - 1))) : 0;
    } else {
      const availWidth = Math.min(850, Math.max(480, (viewportWidth || 1200) * 0.65));
      cardSpacing = total > 1 ? Math.max(14, Math.min(34, (availWidth - 70) / (total - 1))) : 0;
    }

    const cardWidth = isLandscapeMobile
      ? (total > 14 ? 36 : 42)
      : isMobile
      ? (total > 12 ? 44 : 52)
      : 66;
    const computedWidth = Math.max(240, (total - 1) * cardSpacing + cardWidth + 24);

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
  }, [cards, total, isMobile, isLandscapeMobile, viewportWidth]);

  if (isFinished || total === 0) {
    return (
      <div className="w-full flex items-center justify-center py-2 sm:py-3 select-none pointer-events-none">
        <div className="px-4 py-1.5 sm:py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md shadow-lg">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>YOU HAVE ESCAPED! Relax and watch the other players struggle!</span>
        </div>
      </div>
    );
  }

  const selectedCard = cards.find(c => c.id === selectedCardId);

  return (
    <div className="relative w-full flex flex-col items-center select-none pointer-events-auto">
      {/* Hand Controls & Turn Banner */}
      <div className={cn(
        "flex items-center gap-1.5 xs:gap-2 z-20 flex-wrap justify-center",
        isLandscapeMobile ? "mb-0.5" : "mb-1.5"
      )}>
        {/* Card Count Pill */}
        <div className={cn(
          "flex items-center gap-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/15 font-bold text-zinc-300 shadow-md",
          isLandscapeMobile ? "px-2 py-0.5 text-[9px] xs:text-[10px]" : "px-2.5 py-0.5 text-[10px] xs:text-[11px]"
        )}>
          <span>Hand:</span>
          <span className="text-gold font-mono font-black text-xs">{total}</span>
          <span>cards</span>
        </div>

        {/* Sort Button */}
        {onSortCards && (
          <button
            type="button"
            onClick={onSortCards}
            className={cn(
              "flex items-center gap-1 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-white/15 font-bold text-zinc-300 transition-all hover:text-white active:scale-95 shadow-md cursor-pointer",
              isLandscapeMobile ? "px-2 py-0.5 text-[9px] xs:text-[10px]" : "px-2.5 py-0.5 text-[10px] xs:text-[11px]"
            )}
            title="Sort cards by suit or rank"
          >
            <ArrowUpDown className="w-3 h-3 text-zinc-400" />
            <span>Sort: {sortMode === 'suit' ? 'Suits' : 'Ranks'}</span>
          </button>
        )}

        {/* Turn Prompt or Play Action Button */}
        {isMyTurn && (
          <div className="flex items-center gap-1.5">
            {selectedCardId ? (
              <button
                type="button"
                onClick={onPlaySelectedCard}
                className={cn(
                  "flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 text-black font-black uppercase tracking-wider shadow-emerald-glow active:scale-95 transition-all animate-bounce cursor-pointer",
                  isLandscapeMobile ? "px-3 py-0.5 text-[11px]" : "px-3.5 py-1 text-xs sm:text-sm"
                )}
              >
                <Play className="w-3 h-3 xs:w-3.5 xs:h-3.5 fill-black" />
                <span>Play {selectedCard?.rank}{selectedCard?.suit}</span>
              </button>
            ) : (
              <div className={cn(
                "flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black animate-pulse",
                isLandscapeMobile ? "px-2 py-0.5 text-[9px] xs:text-[10px]" : "px-2.5 py-0.5 text-[10px] xs:text-[11px]"
              )}>
                <span>⚡ YOUR TURN: Tap a highlighted card</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fan Cards Container */}
      <div
        className={cn(
          "relative flex justify-center items-end transition-all",
          isLandscapeMobile ? "h-[62px] xs:h-[70px]" : "h-[85px] xs:h-[95px] sm:h-[110px] md:h-[125px]"
        )}
        style={{ width: `${containerWidth}px`, maxWidth: '100vw' }}
      >
        {fanStyles.map(({ card, angle, translateX, zIndex }) => {
          const isSelected = selectedCardId === card.id;
          const isLegal = isMyTurn ? canPlayCardIds.includes(card.id) : false;
          const isPlayable = isMyTurn && isLegal;

          return (
            <div
              key={card.id}
              onClick={() => {
                if (!isMyTurn) return;
                if (!isLegal) {
                  onIllegalCardTap?.(card);
                  return;
                }
                if (isSelected) {
                  // Double tap / second tap throws the card immediately
                  onPlaySelectedCard();
                } else {
                  onSelectCard(card.id);
                }
              }}
              className={cn(
                'absolute bottom-0 cursor-pointer transition-all duration-200 origin-bottom',
                isPlayable
                  ? 'hover:-translate-y-4 hover:scale-105 active:scale-95'
                  : isMyTurn
                  ? 'opacity-40 grayscale-[40%] cursor-not-allowed'
                  : 'hover:-translate-y-2'
              )}
              style={{
                transform: `translateX(${translateX}px) rotate(${angle}deg) translateY(${
                  isSelected ? (isLandscapeMobile ? -14 : isMobile ? -24 : -34) : 0
                }px) scale(${isSelected ? 1.08 : 1})`,
                zIndex: isSelected ? 99 : zIndex,
              }}
            >
              <div
                className={cn(
                  'rounded-lg transition-all',
                  isSelected && 'ring-2 sm:ring-3 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]',
                  isPlayable && !isSelected && 'ring-1 ring-emerald-400/50 hover:ring-2 hover:ring-emerald-300 shadow-md'
                )}
              >
                <PlayingCard
                  card={card}
                  size={
                    isLandscapeMobile
                      ? (total > 14 ? 'xxs' : 'xs')
                      : isMobile
                      ? (total > 15 ? 'xs' : 'sm')
                      : 'sm'
                  }
                  interactive={isPlayable}
                />
              </div>

              {/* Selection Check Indicator */}
              {isSelected && (
                <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg border border-white">
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
