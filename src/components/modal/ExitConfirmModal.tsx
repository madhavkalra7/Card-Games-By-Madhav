'use client';

import React from 'react';
import { AlertTriangle, LogOut, X } from 'lucide-react';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPlaying?: boolean;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isPlaying = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border-2 border-red-800/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-400 shrink-0 shadow-lg">
            <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
              {isPlaying ? 'Exit Active Match?' : 'Leave Table?'}
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400">
              {isPlaying ? 'Game in progress' : 'Return to Home'}
            </p>
          </div>
        </div>

        {/* Explanatory Body */}
        <div className="bg-zinc-900/70 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-800 text-xs sm:text-sm text-zinc-300 space-y-2 mb-5 leading-relaxed">
          {isPlaying ? (
            <>
              <p className="font-semibold text-red-300">
                Are you sure you want to exit this match?
              </p>
              <p className="text-zinc-400 text-[11px] sm:text-xs">
                Your remaining cards will be <strong>distributed equally among the other players</strong> so the game can continue seamlessly. You will forfeit this match.
              </p>
            </>
          ) : (
            <p className="text-zinc-300">
              Are you sure you want to leave this table? You can create or join another room anytime.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs sm:text-sm font-bold transition-all active:scale-95 text-center"
          >
            Stay in Game
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 text-center border border-red-400/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Yes, Exit</span>
          </button>
        </div>

      </div>
    </div>
  );
};
