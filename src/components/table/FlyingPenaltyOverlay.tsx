'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayingCard } from '../card/PlayingCard';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface FlyingPenaltyOverlayProps {
  animationData: {
    fromPlayerIds: string[];
    toPlayerId: string;
    cardsCount: number;
    penalizedName: string;
    isFalseAccusation: boolean;
    reason?: string;
  } | null;
}

export const FlyingPenaltyOverlay: React.FC<FlyingPenaltyOverlayProps> = ({ animationData }) => {
  if (!animationData) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center">
      {/* Banner announcement */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-zinc-950/95 border-2 border-red-500/90 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 backdrop-blur-md max-w-lg mx-4"
      >
        <AlertTriangle className="w-9 h-9 text-red-500 animate-bounce shrink-0" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60">
              Auto Penalty Triggered
            </span>
            {animationData.reason && (
              <span className="text-[11px] text-zinc-300 font-medium truncate max-w-[220px]">
                {animationData.reason}
              </span>
            )}
          </div>
          <span className="text-base sm:text-lg font-black text-white mt-0.5">
            {animationData.penalizedName}{' '}
            {animationData.cardsCount > 0 ? (
              <span className="text-red-400">
                receives +{animationData.cardsCount} card{animationData.cardsCount > 1 ? 's' : ''} from Bazaar-open players!
              </span>
            ) : (
              <span className="text-amber-300">
                wrong card sent to Right Deck! (No open Bazaar donors yet)
              </span>
            )}
          </span>
        </div>
      </motion.div>

      {/* Multi-card flight animation into recipient */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        <AnimatePresence>
          {Array.from({ length: Math.min(animationData.cardsCount, 4) }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                x: (i % 2 === 0 ? -1 : 1) * 220,
                y: (i < 2 ? -1 : 1) * 160,
                rotate: (i - 2) * 30,
                scale: 0.6,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: 0,
                y: 0,
                rotate: 0,
                scale: [0.6, 1.1, 0.9],
              }}
              transition={{
                duration: 1.6,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
              className="absolute"
            >
              <PlayingCard faceDown={true} size="md" glow={true} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
