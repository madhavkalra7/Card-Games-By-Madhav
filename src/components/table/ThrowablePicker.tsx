'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { THROWABLES, ThrowableType } from '@/lib/throwables';
import { X } from 'lucide-react';

interface ThrowablePickerProps {
  targetPlayerId: string;
  targetPlayerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (itemType: ThrowableType) => void;
  position?: 'top' | 'bottom';
  align?: 'center' | 'left' | 'right';
}

export const ThrowablePicker: React.FC<ThrowablePickerProps> = ({
  targetPlayerId,
  targetPlayerName,
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop for dismissal anywhere on screen */}
      <div
        className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Floating Centered Action Bar (Always 100% visible on all mobile screens and desktop!) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[130] w-[94vw] max-w-sm pointer-events-auto select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 25 }}
          transition={{ type: 'spring', damping: 24, stiffness: 380 }}
          className="bg-zinc-950/95 backdrop-blur-2xl border-2 border-gold/70 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_0_40px_rgba(212,175,55,0.45)] flex flex-col items-center"
        >
          {/* Header Bar */}
          <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-white">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm">🎯</span>
              <span className="text-xs sm:text-sm font-black uppercase text-amber-300 tracking-wider truncate max-w-[200px] sm:max-w-xs">
                Throw at {targetPlayerName}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5 Quick-Throw Buttons - Spacious & Touch Friendly */}
          <div className="w-full grid grid-cols-5 gap-1.5 sm:gap-2">
            {THROWABLES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelect(t.id);
                  onClose();
                }}
                className="group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-amber-400 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                style={{
                  boxShadow: `0 0 10px ${t.glowColor}`,
                }}
              >
                <span className="text-2xl sm:text-3xl transform group-hover:scale-125 transition-transform">
                  {t.emoji}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-zinc-200 group-hover:text-amber-300 mt-1 truncate max-w-full">
                  {t.hindiName}
                </span>
              </button>
            ))}
          </div>

          <span className="text-[8px] sm:text-[9px] text-zinc-400 font-mono mt-2">
            Tap item to fling across the table!
          </span>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
