'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { THROWABLES, ThrowableType } from '@/lib/throwables';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  position = 'top',
  align = 'center',
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Invisible backdrop for touch dismissal anywhere on screen */}
      <div
        className="fixed inset-0 z-[65] bg-transparent"
        onClick={onClose}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute z-[70] select-none",
          position === 'top' ? "bottom-full mb-1.5 sm:mb-2" : "top-full mt-1.5 sm:mt-2",
          align === 'left'
            ? "left-0"
            : align === 'right'
            ? "right-0"
            : "left-1/2 -translate-x-1/2"
        )}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: position === 'top' ? 8 : -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: position === 'top' ? 8 : -8 }}
          transition={{ type: 'spring', damping: 22, stiffness: 350 }}
          className="bg-black/95 backdrop-blur-xl border-2 border-gold/70 rounded-2xl p-2 sm:p-2.5 shadow-[0_0_30px_rgba(212,175,55,0.4)] flex flex-col items-center min-w-[185px] xs:min-w-[210px] sm:min-w-[240px]"
        >
          {/* Header Bar */}
          <div className="w-full flex items-center justify-between pb-1 mb-1 border-b border-white/10 text-white">
            <div className="flex items-center gap-1">
              <span className="text-[9px] xs:text-[10px] sm:text-xs font-black uppercase text-amber-300 tracking-wider truncate max-w-[130px] xs:max-w-[160px]">
                Throw at {targetPlayerName}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-0.5 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* 5 Quick-Throw Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {THROWABLES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelect(t.id);
                  onClose();
                }}
                title={`${t.name} (${t.hindiName}) - ${t.tagline}`}
                className="group relative flex flex-col items-center justify-center w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-amber-400/80 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-md"
                style={{
                  boxShadow: `0 0 8px ${t.glowColor}`,
                }}
              >
                <span className="text-lg xs:text-xl sm:text-2xl transform group-hover:scale-125 transition-transform">
                  {t.emoji}
                </span>

                {/* Micro tooltip on hover */}
                <span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded border border-white/20 pointer-events-none whitespace-nowrap shadow-lg z-20">
                  {t.name}
                </span>
              </button>
            ))}
          </div>

          <span className="text-[7.5px] xs:text-[8px] text-zinc-400 font-mono mt-1">
            Tap item to fling across table!
          </span>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
