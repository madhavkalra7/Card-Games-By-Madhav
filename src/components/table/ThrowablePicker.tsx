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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[140] bg-black/65 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Floating Centered Action Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[150] w-[92vw] max-w-sm pointer-events-auto select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 10 }}
          transition={{ type: 'spring', damping: 24, stiffness: 380 }}
          className="bg-zinc-950/95 backdrop-blur-2xl border-2 border-amber-400/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-[0_0_50px_rgba(212,175,55,0.45)] flex flex-col items-center max-h-[90dvh] overflow-y-auto touch-manipulation"
        >
          {/* Header Bar */}
          <div className="w-full flex items-center justify-between pb-2 mb-3 border-b border-white/15 text-white">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xl">🎯</span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Desi Throwables</span>
                <span className="text-xs sm:text-sm font-black text-amber-300 truncate max-w-[200px] sm:max-w-xs">
                  Throw at {targetPlayerName}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 5 Throwables Grid: 3 on top row, 2 on bottom row (spacious & ultra-readable on all phones) */}
          <div className="w-full flex flex-col gap-2">
            {/* Top Row: 3 items */}
            <div className="grid grid-cols-3 gap-2">
              {THROWABLES.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelect(t.id);
                    onClose();
                  }}
                  className="group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md touch-manipulation"
                  style={{
                    boxShadow: `0 0 14px ${t.glowColor}`,
                  }}
                >
                  <span className="text-3xl sm:text-4xl transform group-hover:scale-120 transition-transform">
                    {t.emoji}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-amber-200 mt-1 truncate max-w-full">
                    {t.hindiName}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-medium truncate max-w-full">
                    {t.tagline}
                  </span>
                </button>
              ))}
            </div>

            {/* Bottom Row: 2 items centered */}
            <div className="grid grid-cols-2 gap-2">
              {THROWABLES.slice(3, 5).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelect(t.id);
                    onClose();
                  }}
                  className="group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md touch-manipulation"
                  style={{
                    boxShadow: `0 0 14px ${t.glowColor}`,
                  }}
                >
                  <span className="text-3xl sm:text-4xl transform group-hover:scale-120 transition-transform">
                    {t.emoji}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-amber-200 mt-1 truncate max-w-full">
                    {t.hindiName}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-medium truncate max-w-full">
                    {t.tagline}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <span className="text-[10px] text-zinc-400 font-semibold mt-3 text-center">
            Tap any item to fling across the table with sound effects!
          </span>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
