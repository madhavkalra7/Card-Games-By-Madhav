'use client';

import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Card } from '@/lib/types';
import { PlayingCard } from './PlayingCard';
import { cn } from '@/lib/utils';
import { Grab, Move } from 'lucide-react';

interface DraggableTurnCardProps {
  card: Card | null;
  onDropCenter: (targetSuit?: any) => void;
  onDropRightDeck: (targetPlayerId: string) => void;
  timeRemaining: number;
  isLandscape?: boolean;
}

export const DraggableTurnCard: React.FC<DraggableTurnCardProps> = ({
  card,
  onDropCenter,
  onDropRightDeck,
  timeRemaining,
  isLandscape = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  if (!card) return null;

  const isTimerLow = timeRemaining <= 10;

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    // Identify which drop zone the card was released over
    const elements = document.elementsFromPoint(info.point.x, info.point.y);
    if (!elements) return;

    for (const el of elements) {
      // 1. Check if dropped over Center Bazaar (or specific center deck)
      const centerTarget = el.closest('[data-drop-target="center"]');
      if (centerTarget) {
        const deckIdStr = centerTarget.getAttribute('data-deck-id') || el.closest('[data-deck-id]')?.getAttribute('data-deck-id');
        const deckId = deckIdStr !== null && deckIdStr !== undefined && !isNaN(Number(deckIdStr)) ? parseInt(deckIdStr, 10) : undefined;
        onDropCenter(deckId);
        return;
      }

      // 2. Check if dropped over a Right Deck
      const rightDeckTarget = el.closest('[data-drop-target="right-deck"]');
      if (rightDeckTarget) {
        const targetPlayerId = rightDeckTarget.getAttribute('data-player-id');
        if (targetPlayerId) {
          onDropRightDeck(targetPlayerId);
          return;
        }
      }
    }
  };

  return (
    <div
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-auto select-none transition-all duration-300',
        isLandscape
          ? 'bottom-[68px] sm:bottom-[76px] md:bottom-[84px]'
          : 'bottom-20 sm:bottom-28 md:bottom-32'
      )}
    >
      {/* 30s Turn Timer Pill */}
      <div className="mb-1 flex items-center gap-1 sm:gap-1.5 bg-black/85 backdrop-blur-md px-2 sm:px-3 py-0.5 rounded-full border border-gold/50 shadow-xl">
        <span className="text-[9px] sm:text-[10px] text-zinc-300 font-semibold">Your Turn:</span>
        <span
          className={cn(
            'text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono',
            isTimerLow ? 'bg-red-600 text-white animate-pulse' : 'bg-gold text-black'
          )}
        >
          {timeRemaining}s
        </span>
      </div>

      {/* Draggable Card Motion Container */}
      <div className="relative flex flex-col items-center">
        <motion.div
          drag
          dragSnapToOrigin={true}
          dragElastic={0.08}
          whileHover={{ scale: 1.05, cursor: 'grab' }}
          whileDrag={{ scale: 1.12, zIndex: 100, cursor: 'grabbing', rotate: 0 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          className="touch-none"
        >
          <div className="relative shadow-2xl rounded-[8px] sm:rounded-[12px] ring-2 sm:ring-3 ring-gold/90 animate-pulse-gold">
            <PlayingCard card={card} size="sm" glow={true} className="origin-bottom" />
            
            {/* Drag Handle Floating Badge */}
            <div className="absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 bg-gold text-black text-[7px] sm:text-[8px] font-black px-1.5 sm:px-2 py-0.2 rounded-full shadow-lg border border-yellow-200 flex items-center gap-0.5 whitespace-nowrap">
              <Grab className="w-2 h-2" />
              <span>DRAG</span>
            </div>
          </div>
        </motion.div>

        {/* Helper Drag Cue (hidden on short landscape viewports) */}
        <div className="hidden sm:block mt-0.5 text-center">
          <p className="text-[9px] text-amber-200/90 font-bold tracking-wide drop-shadow">
            Drag to <span className="text-gold">Center</span> or <span className="text-gold">Right Deck</span>
          </p>
        </div>
      </div>

    </div>
  );
};
