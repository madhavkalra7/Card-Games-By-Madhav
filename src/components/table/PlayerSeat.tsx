'use client';

import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { PlayerClientView, Card } from '@/lib/types';
import { CardStack } from '../card/CardStack';
import { cn } from '@/lib/utils';
import { Crown, Sparkles, WifiOff, Grab } from 'lucide-react';

interface PlayerSeatProps {
  player: PlayerClientView;
  isCurrentTurn: boolean;
  isSelf: boolean;
  canDrawCard?: boolean;
  onDrawCard?: () => void;
  canPlaceOnRightDeck?: boolean;
  onPlaceRightDeck?: () => void;
  canDragRightDeck?: boolean;
  onDropCenterFromRightDeck?: (targetDeckId?: number) => void;
  onDropRightDeckFromRightDeck?: (targetPlayerId: string) => void;
  className?: string;
  positionClass?: string;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isCurrentTurn,
  isSelf,
  canDrawCard = false,
  onDrawCard,
  canPlaceOnRightDeck = false,
  onPlaceRightDeck,
  canDragRightDeck = false,
  onDropCenterFromRightDeck,
  onDropRightDeckFromRightDeck,
  className,
  positionClass,
}) => {
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const handleRightDeckDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDraggingRight(false);
    const elements = document.elementsFromPoint(info.point.x, info.point.y);
    if (!elements) return;

    for (const el of elements) {
      // 1. Check if dropped over Center Bazaar
      const centerTarget = el.closest('[data-drop-target="center"]');
      if (centerTarget) {
        const deckIdStr = centerTarget.getAttribute('data-deck-id') || el.closest('[data-deck-id]')?.getAttribute('data-deck-id');
        const deckId = deckIdStr !== null && deckIdStr !== undefined && !isNaN(Number(deckIdStr)) ? parseInt(deckIdStr, 10) : undefined;
        onDropCenterFromRightDeck?.(deckId);
        return;
      }

      // 2. Check if dropped over another player's Right Deck
      const rightDeckTarget = el.closest('[data-drop-target="right-deck"]');
      if (rightDeckTarget) {
        const targetPlayerId = rightDeckTarget.getAttribute('data-player-id');
        if (targetPlayerId && targetPlayerId !== player.id) {
          onDropRightDeckFromRightDeck?.(targetPlayerId);
          return;
        }
      }
    }
  };
  return (
    <div
      className={cn(
        'flex flex-col items-center select-none transition-all duration-300 z-20',
        positionClass,
        className
      )}
    >
      {/* Player Header Capsule */}
      <div
        className={cn(
          'relative flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md transition-all duration-300',
          'bg-black/60 border border-white/10 shadow-lg',
          isCurrentTurn && 'ring-2 ring-gold shadow-gold-glow bg-black/80 scale-105',
          !player.isConnected && 'opacity-60 border-red-500/50'
        )}
      >
        {/* Avatar Circle */}
        <div
          className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md border border-white/30"
          style={{ backgroundColor: player.avatarColor || '#3b82f6' }}
        >
          {player.name.charAt(0).toUpperCase()}
          {player.isHost && (
            <span className="absolute -top-2.5 -right-1 text-gold filter drop-shadow">
              <Crown className="w-4 h-4 fill-gold text-amber-900" />
            </span>
          )}
        </div>

        {/* Player Name & Tag */}
        <div className="flex flex-col items-start leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs sm:text-sm text-zinc-100 max-w-[90px] sm:max-w-[110px] truncate">
              {player.name}
            </span>
            {isSelf && (
              <span className="text-[9px] bg-white/20 text-zinc-200 px-1 py-0.2 rounded font-mono">
                YOU
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400">
            {player.hiddenCount} cards left
          </span>
        </div>

        {/* Disconnected Indicator */}
        {!player.isConnected && (
          <div title="Player disconnected (60s reconnect grace)">
            <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          </div>
        )}

        {/* Turn indicator glow pill */}
        {isCurrentTurn && (
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gold text-black text-[9px] font-black px-2 py-0.2 rounded-full uppercase tracking-wider shadow">
            Turn
          </div>
        )}
      </div>

      {/* Golden Glowing Bazaar Open Badge */}
      {player.isBazaarOpen && (
        <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black shadow-gold-glow animate-pulse border border-yellow-200">
          <Sparkles className="w-3 h-3 fill-black" />
          <span>BAZAAR OPEN</span>
        </div>
      )}

      {/* Cards: Left Deck (Hidden Stack) & Right Deck (Face up top card) */}
      <div className="mt-1 sm:mt-2 flex items-center gap-1.5 sm:gap-3">
        {/* Left Deck (Hidden Stack) */}
        <div className="flex flex-col items-center">
          <CardStack
            type="hidden"
            count={player.hiddenCount}
            isClickable={isSelf && canDrawCard}
            onClick={isSelf && canDrawCard ? onDrawCard : undefined}
            isHighlighted={isSelf && canDrawCard}
            size={isSelf ? 'sm' : 'xs'}
            label="Left Deck"
          />
        </div>

        {/* Right Deck (Top visible card) */}
        <div className="flex flex-col items-center">
          <div
            data-drop-target="right-deck"
            data-player-id={player.id}
            onClick={canPlaceOnRightDeck ? onPlaceRightDeck : undefined}
            className={cn(
              'relative transition-transform p-0.5 sm:p-1 rounded-xl',
              canPlaceOnRightDeck && 'cursor-pointer hover:scale-105 active:scale-95 ring-2 ring-gold/60 bg-gold/10'
            )}
          >
            {canDragRightDeck && player.rightDeckTop ? (
              <motion.div
                drag
                dragSnapToOrigin={true}
                dragElastic={0.08}
                whileHover={{ scale: 1.06, cursor: 'grab' }}
                whileDrag={{ scale: 1.15, zIndex: 100, cursor: 'grabbing', rotate: 0 }}
                onDragStart={() => setIsDraggingRight(true)}
                onDragEnd={handleRightDeckDragEnd}
                className="touch-none relative"
              >
                <CardStack
                  type="right"
                  count={player.rightDeckCount}
                  topCard={player.rightDeckTop}
                  size={isSelf ? 'sm' : 'xs'}
                  isHighlighted={true}
                  label="Right Deck"
                />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full shadow border border-yellow-200 flex items-center gap-0.5 pointer-events-none whitespace-nowrap animate-pulse">
                  <Grab className="w-2.5 h-2.5" />
                  <span>DRAG</span>
                </div>
              </motion.div>
            ) : (
              <CardStack
                type="right"
                count={player.rightDeckCount}
                topCard={player.rightDeckTop}
                size={isSelf ? 'sm' : 'xs'}
                isHighlighted={false}
                label="Right Deck"
              />
            )}
            {canPlaceOnRightDeck && isSelf && (
              <div className="absolute inset-0 bg-gold/15 rounded-[12px] flex items-center justify-center pointer-events-none">
                <span className="bg-gold text-black text-[8px] sm:text-[9px] font-black px-1 sm:px-1.5 py-0.2 rounded shadow">
                  DISCARD
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
