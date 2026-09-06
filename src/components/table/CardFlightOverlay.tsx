'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { CardFlightEvent } from '@/lib/types';
import { PlayingCard } from '../card/PlayingCard';
import { sounds } from '@/lib/sound';

interface CardFlightItemProps {
  flight: CardFlightEvent;
  onComplete: () => void;
}

const CardFlightItem: React.FC<CardFlightItemProps> = ({ flight, onComplete }) => {
  const [coords, setCoords] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Resolve Sender Coordinates
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight - 150;

    const fromRightDeckEl = document.getElementById(`player-right-deck-${flight.fromPlayerId}`);
    const fromSeatEl = document.getElementById(`player-seat-${flight.fromPlayerId}`);
    const fromEl = (flight.fromSource === 'RIGHT_DECK' ? fromRightDeckEl : null) || fromRightDeckEl || fromSeatEl;

    if (fromEl) {
      const rect = fromEl.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }

    // 2. Resolve Destination Coordinates
    let endX = window.innerWidth / 2;
    let endY = window.innerHeight / 2;

    if (flight.targetType === 'CENTER') {
      const centerDeckEl = flight.targetDeckId !== undefined ? document.getElementById(`center-deck-${flight.targetDeckId}`) : null;
      const centerBazaarEl = centerDeckEl || document.querySelector('[data-drop-target="center"]');
      if (centerBazaarEl) {
        const rect = centerBazaarEl.getBoundingClientRect();
        endX = rect.left + rect.width / 2;
        endY = rect.top + rect.height / 2;
      }
    } else {
      // RIGHT_DECK
      const toRightDeckEl = flight.targetPlayerId ? document.getElementById(`player-right-deck-${flight.targetPlayerId}`) : null;
      const toSeatEl = flight.targetPlayerId ? document.getElementById(`player-seat-${flight.targetPlayerId}`) : null;
      const toEl = toRightDeckEl || toSeatEl;
      if (toEl) {
        const rect = toEl.getBoundingClientRect();
        endX = rect.left + rect.width / 2;
        endY = rect.top + rect.height / 2;
      }
    }

    setCoords({ startX, startY, endX, endY });
  }, [flight]);

  if (!coords) return null;

  const { startX, startY, endX, endY } = coords;
  // Parabolic flight peak
  const midX = (startX + endX) / 2;
  const distance = Math.hypot(endX - startX, endY - startY);
  const arcLift = Math.min(Math.max(distance * 0.18, 35), 90);
  const midY = Math.min(startY, endY) - arcLift;
  const flightAngle = (endX - startX) * 0.04;

  const destinationLabel = flight.targetType === 'CENTER'
    ? '✦ To Center ✦'
    : flight.isOwnRightDeck
    ? '✦ Discard ✦'
    : `✦ To ${flight.targetPlayerName || 'Opponent'} ✦`;

  const handleAnimationEnd = () => {
    sounds.playCardFlip();
    onComplete();
  };

  return (
    <motion.div
      initial={{
        x: startX,
        y: startY,
        scale: 0.85,
        rotate: 0,
        opacity: 0.95,
      }}
      animate={{
        x: [startX, midX, endX],
        y: [startY, midY, endY],
        scale: [0.85, 1.18, 1.0],
        rotate: [0, flightAngle, 0],
        opacity: [0.95, 1, 1],
      }}
      transition={{
        duration: 0.52,
        ease: [0.25, 1, 0.5, 1],
        times: [0, 0.5, 1],
      }}
      onAnimationComplete={handleAnimationEnd}
      className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-[115] flex flex-col items-center justify-center"
      style={{
        filter: 'drop-shadow(0 12px 28px rgba(212,175,55,0.75))',
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Destination Floating Indicator Pill */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black text-[8px] sm:text-[9.5px] font-black px-2.5 py-0.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.6)] border border-yellow-100 flex items-center gap-1 whitespace-nowrap animate-pulse z-30">
          <span>{destinationLabel}</span>
        </div>

        {/* The Animated Face-Up Card */}
        <div className="relative rounded-[9px] sm:rounded-[12px] ring-2 sm:ring-3 ring-gold shadow-[0_0_25px_rgba(212,175,55,0.9)] animate-pulse-gold">
          <PlayingCard card={flight.card} size="sm" glow={true} />
        </div>

        {/* Flying Sparkles Trail */}
        <span className="absolute -bottom-1 -right-1 text-sm animate-ping">
          ✨
        </span>
        <span className="absolute -top-1 -left-1 text-xs animate-pulse text-amber-300">
          💫
        </span>
      </div>
    </motion.div>
  );
};

export const CardFlightOverlay: React.FC = () => {
  const { activeCardFlights, removeCardFlight } = useGameStore();

  return (
    <div className="fixed inset-0 pointer-events-none z-[115] overflow-hidden">
      <AnimatePresence>
        {activeCardFlights.map((flight) => (
          <CardFlightItem
            key={flight.id}
            flight={flight}
            onComplete={() => removeCardFlight(flight.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
