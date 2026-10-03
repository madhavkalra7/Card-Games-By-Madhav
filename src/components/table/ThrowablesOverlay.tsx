'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { ThrownItemEvent, getThrowableConfig } from '@/lib/throwables';

interface ProjectileFlightProps {
  item: ThrownItemEvent;
  onComplete: () => void;
}

const ProjectileFlight: React.FC<ProjectileFlightProps> = ({ item, onComplete }) => {
  const [coords, setCoords] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  const completedRef = useRef(false);
  const handleDone = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [onComplete]);

  // Guaranteed fallback: complete flight after 900ms even if animation was interrupted
  useEffect(() => {
    const safetyTimer = setTimeout(handleDone, 900);
    return () => clearTimeout(safetyTimer);
  }, [handleDone]);

  const config = getThrowableConfig(item.itemType);
  const myPlayerId = useGameStore((s) => s.gameState?.myPlayerId);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const resolveCoords = (playerId: string, isSender: boolean) => {
      // 1. Try finding by seat ID
      const el = document.getElementById(`player-seat-${playerId}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        return {
          x: Math.max(35, Math.min(window.innerWidth - 35, rect.left + rect.width / 2)),
          y: Math.max(50, Math.min(window.innerHeight - 50, rect.top + rect.height / 2)),
        };
      }

      // 2. Fallback for local player (rendered at bottom via Fan Hand)
      const isSelf = playerId === myPlayerId;
      if (isSelf || (isSender && !playerId)) {
        return {
          x: window.innerWidth / 2,
          y: Math.max(60, window.innerHeight - 80),
        };
      }

      // 3. Fallback for opponents without explicit element
      return {
        x: window.innerWidth / 2,
        y: Math.max(60, window.innerHeight * 0.2),
      };
    };

    const from = resolveCoords(item.fromPlayerId, true);
    const to = resolveCoords(item.toPlayerId, false);

    setCoords({
      startX: from.x,
      startY: from.y,
      endX: to.x,
      endY: to.y,
    });
  }, [item.fromPlayerId, item.toPlayerId, myPlayerId]);

  if (!coords) return null;

  const { startX, startY, endX, endY } = coords;

  // Midpoint horizontal coordinate
  const midX = (startX + endX) / 2;

  // Parabolic flight arc: peak stays safely inside the screen
  const distY = Math.abs(startY - endY);
  const arcLift = Math.min(85, Math.max(40, distY * 0.3));
  const rawMidY = Math.min(startY, endY) - arcLift;
  const midY = Math.max(55, rawMidY); // Clamped so it NEVER flies above the viewport top rail!

  return (
    <motion.div
      initial={{
        x: startX,
        y: startY,
        scale: 0.5,
        rotate: 0,
        opacity: 0,
      }}
      animate={{
        x: [startX, midX, endX],
        y: [startY, midY, endY],
        scale: [0.6, 1.45, 1.1],
        rotate: [0, item.itemType === 'chappal' ? 720 : 360],
        opacity: [0.4, 1, 1],
      }}
      transition={{
        duration: 0.62,
        ease: 'easeInOut',
        times: [0, 0.45, 1],
      }}
      onAnimationComplete={handleDone}
      className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-[130] flex items-center justify-center"
      style={{
        filter: `drop-shadow(0 6px 16px ${config.glowColor})`,
      }}
    >
      {/* Visual Item Figurine with Glow */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full blur-md animate-pulse"
          style={{ backgroundColor: config.glowColor }}
        />
        <span className="text-3xl sm:text-4xl filter drop-shadow-xl select-none">
          {config.emoji}
        </span>
        <span className="absolute -bottom-1 -right-1 text-xs opacity-80 animate-ping">
          ✨
        </span>
      </div>
    </motion.div>
  );
};

export const ThrowablesOverlay: React.FC = () => {
  const { activeThrowables, removeThrowable, triggerImpact, gameState, activeImpacts } = useGameStore();
  const [announcement, setAnnouncement] = useState<{
    id: string;
    fromName: string;
    toName: string;
    config: ReturnType<typeof getThrowableConfig>;
  } | null>(null);

  const lastHandledIdRef = useRef<string | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const myPlayerId = gameState?.myPlayerId;
  const myImpact = myPlayerId ? activeImpacts[myPlayerId] : null;

  const handleFlightComplete = (item: ThrownItemEvent) => {
    triggerImpact(item.toPlayerId, item.itemType);
    removeThrowable(item.id);
  };

  useEffect(() => {
    if (activeThrowables.length === 0) return;
    const latest = activeThrowables[activeThrowables.length - 1];
    if (!latest || latest.id === lastHandledIdRef.current) return;

    lastHandledIdRef.current = latest.id;

    const fromP = gameState?.players.find((p) => p.id === latest.fromPlayerId);
    const toP = gameState?.players.find((p) => p.id === latest.toPlayerId);
    const config = getThrowableConfig(latest.itemType);

    setAnnouncement({
      id: latest.id,
      fromName: fromP?.name || (latest.fromPlayerId === myPlayerId ? 'You' : 'Someone'),
      toName: toP?.name || (latest.toPlayerId === myPlayerId ? 'You' : 'Someone'),
      config,
    });

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    // Auto-dismiss the announcement banner after 2.5 seconds
    dismissTimerRef.current = setTimeout(() => {
      setAnnouncement(null);
      dismissTimerRef.current = null;
    }, 2500);
  }, [activeThrowables, gameState?.players, myPlayerId]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[125] overflow-hidden">
      {/* 1. Global Responsive Throw Action Announcement Banner */}
      <AnimatePresence>
        {announcement && (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 380 }}
            className="fixed top-12 xs:top-13 sm:top-15 left-1/2 -translate-x-1/2 z-[140] pointer-events-none px-2 max-w-[94vw] w-auto flex justify-center"
          >
            <div className="flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-1.5 rounded-full bg-black/92 backdrop-blur-xl border border-amber-400/90 shadow-[0_8px_30px_rgba(0,0,0,0.85)] text-white text-[11px] xs:text-xs sm:text-sm font-black whitespace-nowrap">
              <span className="text-base sm:text-lg shrink-0 animate-bounce">{announcement.config.emoji}</span>
              <div className="flex items-center gap-1 font-bold">
                <span className="text-amber-300 font-black max-w-[85px] xs:max-w-[120px] sm:max-w-[160px] truncate">{announcement.fromName}</span>
                <span className="text-zinc-300 font-normal">threw</span>
                <span className="text-yellow-400 font-black">{announcement.config.hindiName}</span>
                <span className="text-zinc-300 font-normal">at</span>
                <span className="text-amber-300 font-black max-w-[85px] xs:max-w-[120px] sm:max-w-[160px] truncate">{announcement.toName}</span>!
              </div>
              <span className="text-xs sm:text-sm shrink-0">💥</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Direct-Hit Self Impact Visual Effect (When someone throws an item at the local user) */}
      <AnimatePresence>
        {myImpact && (
          <motion.div
            key={myImpact.id}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: [0.3, 1.25, 1] }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="fixed inset-0 z-[150] pointer-events-none flex flex-col items-center justify-center px-4"
          >
            {/* Screen edge flash */}
            <motion.div
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-red-600/15"
            />

            {/* Direct hit visual badge */}
            <div className="relative flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-black/90 backdrop-blur-md border-2 border-amber-400 shadow-[0_0_50px_rgba(239,68,68,0.6)] animate-bounce">
              <span className="text-5xl sm:text-7xl filter drop-shadow-2xl">
                {myImpact.itemType === 'chappal' && '🩴'}
                {myImpact.itemType === 'chai' && '☕'}
                {myImpact.itemType === 'tomato' && '🍅'}
                {myImpact.itemType === 'cash' && '💸'}
                {myImpact.itemType === 'rose' && '🌹'}
              </span>
              <div className="mt-2 px-3 py-1 rounded-full bg-red-600/90 text-white font-black text-[11px] xs:text-xs sm:text-sm uppercase tracking-wider shadow-lg border border-yellow-300 text-center">
                {myImpact.itemType === 'chappal' && 'PHATAK! You got hit by a Chappal! 🩴💥'}
                {myImpact.itemType === 'chai' && 'GARAM CHAI! Hot tea splashed on you! ☕♨️'}
                {myImpact.itemType === 'tomato' && 'SPLATTER! Rotten tomato on your face! 🍅💦'}
                {myImpact.itemType === 'cash' && 'PAISA HI PAISA! Cash shower on you! 💸✨'}
                {myImpact.itemType === 'rose' && 'PYAAR SE! Someone sent you a Rose! 🌹💖'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. In-Flight Projectiles */}
      <AnimatePresence>
        {activeThrowables.map((item) => (
          <ProjectileFlight
            key={item.id}
            item={item}
            onComplete={() => handleFlightComplete(item)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
