'use client';

import React, { useEffect, useState } from 'react';
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

  const config = getThrowableConfig(item.itemType);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Resolve sender coordinates
    const fromEl = document.getElementById(`player-seat-${item.fromPlayerId}`);
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight - 100;

    if (fromEl) {
      const rect = fromEl.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }

    // 2. Resolve target coordinates
    const toEl = document.getElementById(`player-seat-${item.toPlayerId}`);
    let endX = window.innerWidth / 2;
    let endY = 120;

    if (toEl) {
      const rect = toEl.getBoundingClientRect();
      endX = rect.left + rect.width / 2;
      endY = rect.top + rect.height / 2;
    }

    setCoords({ startX, startY, endX, endY });
  }, [item.fromPlayerId, item.toPlayerId]);

  if (!coords) return null;

  const { startX, startY, endX, endY } = coords;
  // Parabolic peak reaches higher than both points
  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - (item.itemType === 'chappal' ? 140 : 100);

  return (
    <motion.div
      initial={{
        x: startX,
        y: startY,
        scale: 0.5,
        rotate: 0,
        opacity: 0.9,
      }}
      animate={{
        x: [startX, midX, endX],
        y: [startY, midY, endY],
        scale: [0.6, 1.5, 1.1],
        rotate: [0, item.itemType === 'chappal' ? 1080 : 360],
        opacity: 1,
      }}
      transition={{
        duration: 0.65,
        ease: 'easeInOut',
        times: [0, 0.5, 1],
      }}
      onAnimationComplete={onComplete}
      className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-[110] flex items-center justify-center"
      style={{
        filter: `drop-shadow(0 8px 20px ${config.glowColor})`,
      }}
    >
      {/* Visual Item Figurine / Emoji with Glowing Trail */}
      <div className="relative flex items-center justify-center">
        {/* Glow Ring in Flight */}
        <div
          className="absolute inset-0 rounded-full blur-md animate-pulse"
          style={{ backgroundColor: config.glowColor }}
        />

        {/* The Item Emoji */}
        <span className="text-4xl sm:text-5xl filter drop-shadow-2xl transform active:scale-125">
          {config.emoji}
        </span>

        {/* Flying motion sparkles */}
        <span className="absolute -bottom-1 -right-1 text-xs opacity-75 animate-ping">
          ✨
        </span>
      </div>
    </motion.div>
  );
};

export const ThrowablesOverlay: React.FC = () => {
  const { activeThrowables, removeThrowable, triggerImpact, gameState } = useGameStore();
  const [announcement, setAnnouncement] = useState<{
    id: string;
    fromName: string;
    toName: string;
    config: ReturnType<typeof getThrowableConfig>;
  } | null>(null);

  const handleFlightComplete = (item: ThrownItemEvent) => {
    triggerImpact(item.toPlayerId, item.itemType);
    removeThrowable(item.id);
  };

  useEffect(() => {
    if (activeThrowables.length === 0) return;
    const latest = activeThrowables[activeThrowables.length - 1];
    const fromP = gameState?.players.find((p) => p.id === latest.fromPlayerId);
    const toP = gameState?.players.find((p) => p.id === latest.toPlayerId);
    const config = getThrowableConfig(latest.itemType);

    setAnnouncement({
      id: latest.id,
      fromName: fromP?.name || 'Someone',
      toName: toP?.name || 'Someone',
      config,
    });

    const timer = setTimeout(() => {
      setAnnouncement((curr) => (curr?.id === latest.id ? null : curr));
    }, 2800);

    return () => clearTimeout(timer);
  }, [activeThrowables, gameState?.players]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[110] overflow-hidden">
      {/* Global Responsive Throw Action Announcement Banner */}
      <AnimatePresence>
        {announcement && (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: -20, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.9 }}
            transition={{ type: 'spring', damping: 22, stiffness: 350 }}
            className="fixed top-12 xs:top-14 sm:top-16 left-1/2 -translate-x-1/2 z-[120] pointer-events-none px-2 max-w-[92vw] sm:max-w-md w-full flex justify-center"
          >
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/90 backdrop-blur-xl border-1.5 sm:border-2 border-amber-400/80 shadow-[0_8px_30px_rgba(0,0,0,0.85)] text-white text-xs xs:text-sm sm:text-base font-black">
              <span className="text-base sm:text-xl shrink-0 animate-bounce">{announcement.config.emoji}</span>
              <div className="truncate text-center">
                <span className="text-amber-300 font-extrabold">{announcement.fromName}</span>
                <span className="text-zinc-300 font-medium"> threw </span>
                <span className="text-yellow-400 font-extrabold">{announcement.config.name}</span>
                <span className="text-zinc-300 font-medium"> at </span>
                <span className="text-amber-300 font-extrabold">{announcement.toName}</span>!
              </div>
              <span className="text-xs sm:text-sm shrink-0">💥</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

