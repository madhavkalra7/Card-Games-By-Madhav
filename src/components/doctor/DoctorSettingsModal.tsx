'use client';

import React, { useState, useEffect } from 'react';
import { DoctorConfig } from '@/lib/types';
import { sounds } from '@/lib/sound';
import { cn } from '@/lib/utils';
import { Settings, X, Layers, Flame, Trophy, Check, Sparkles } from 'lucide-react';
import { useViewportOrientation } from '@/hooks/useViewportOrientation';

interface DoctorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DoctorConfig;
  onSave: (config: DoctorConfig) => void;
  isHost: boolean;
}

export const DoctorSettingsModal: React.FC<DoctorSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  isHost,
}) => {
  const [cardsPerPlayer, setCardsPerPlayer] = useState<8 | 10 | 12>(config.cardsPerPlayer || 8);
  const [showLimit, setShowLimit] = useState<number>(config.showLimit || 10);
  const [totalRounds, setTotalRounds] = useState<number>(config.totalRounds || 3);
  const { isLandscape, isMobile, viewportHeight } = useViewportOrientation();
  const isLandscapeMobile = isLandscape && (viewportHeight <= 520 || isMobile);

  useEffect(() => {
    if (config) {
      setCardsPerPlayer(config.cardsPerPlayer || 8);
      setShowLimit(config.showLimit || 10);
      setTotalRounds(config.totalRounds || 3);
    }
  }, [config]);

  if (!isOpen) return null;

  const handleApply = () => {
    sounds.playCardDraw();
    onSave({
      cardsPerPlayer,
      showLimit,
      totalRounds,
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in duration-200 select-none overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-lg bg-gradient-to-b from-zinc-950 via-[#18110b] to-[#0a0705] border-2 border-amber-500/60 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(217,119,6,0.3)] overflow-hidden flex flex-col",
          isLandscapeMobile ? "max-h-[96dvh] my-1" : "max-h-[92dvh]"
        )}
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-amber-500/20 blur-2xl pointer-events-none rounded-full" />

        {/* Top Header */}
        <div className={cn("relative flex items-center justify-between border-b border-white/10 shrink-0", isLandscapeMobile ? "p-2.5 px-4" : "p-4 sm:p-5")}>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className={cn(
              "rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-gold-glow flex items-center justify-center shrink-0",
              isLandscapeMobile ? "w-8 h-8" : "w-10 h-10"
            )}>
              <div className="w-full h-full rounded-2xl bg-black/80 flex items-center justify-center">
                <Settings className={cn("text-amber-400 animate-spin-slow", isLandscapeMobile ? "w-4 h-4" : "w-5 h-5")} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className={cn("font-black text-white uppercase tracking-wider", isLandscapeMobile ? "text-sm sm:text-base" : "text-base sm:text-lg")}>
                  Doctor Game Settings
                </h2>
                <span className="px-2 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Custom
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">
                {isHost ? 'Configure hand sizes, show limit & match rounds' : 'Room match configuration (Host controls)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className={cn("overflow-y-auto flex-1 space-y-3 sm:space-y-4", isLandscapeMobile ? "p-3" : "p-4 sm:p-6")}>
          {/* 1. Cards Per Player */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span>1. Cards Dealt Per Player</span>
              </label>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-white bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                {cardsPerPlayer} Cards
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400">
              Starting hand size dealt to each participant at the start of every round.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-0.5">
              {([8, 10, 12] as const).map((num) => (
                <button
                  key={`cards-${num}`}
                  type="button"
                  disabled={!isHost}
                  onClick={() => {
                    setCardsPerPlayer(num);
                    sounds.playCardFlip();
                  }}
                  className={cn(
                    'rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 border',
                    isLandscapeMobile ? 'py-1.5 px-2' : 'py-2.5 px-3',
                    cardsPerPlayer === num
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-amber-300 shadow-gold-glow scale-[1.02]'
                      : 'bg-zinc-900/80 hover:bg-zinc-900 text-zinc-300 border-white/5 hover:border-white/15',
                    !isHost && 'cursor-not-allowed opacity-75'
                  )}
                >
                  <span className="text-xs sm:text-sm font-mono">{num} Cards</span>
                  <span className={cn('text-[8px] sm:text-[9px] font-normal', cardsPerPlayer === num ? 'text-black/80' : 'text-zinc-500')}>
                    {num === 8 ? 'Classic Fast' : num === 10 ? 'Strategic' : 'Deep Hand'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Show Limit */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                <span>2. Show Threshold Limit</span>
              </label>
              <span className="text-[10px] sm:text-xs font-mono font-extrabold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/50 shadow-sm">
                Sum ≤ {showLimit}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400">
              Declare <strong>SHOW</strong> only when hand sum is ≤ this limit (Min 10, Max 15).
            </p>

            <div className="flex items-center gap-1 sm:gap-1.5 pt-0.5">
              {[10, 11, 12, 13, 14, 15].map((val) => (
                <button
                  key={`limit-${val}`}
                  type="button"
                  disabled={!isHost}
                  onClick={() => {
                    setShowLimit(val);
                    sounds.playCardFlip();
                  }}
                  className={cn(
                    'flex-1 rounded-xl font-mono font-black text-xs transition-all border text-center',
                    isLandscapeMobile ? 'py-1.5' : 'py-2',
                    showLimit === val
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-amber-300 shadow-gold-glow scale-105'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-white/5',
                    !isHost && 'cursor-not-allowed opacity-75'
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Total Rounds */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                <span>3. Total Rounds in Game</span>
              </label>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-white bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                {totalRounds} {totalRounds === 1 ? 'Round' : 'Rounds'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400">
              Scoreboard tracks cumulative points after each round. Lowest total score wins the tournament!
            </p>

            <div className="grid grid-cols-6 gap-1 sm:gap-1.5 pt-0.5">
              {[1, 2, 3, 5, 7, 10].map((rounds) => (
                <button
                  key={`rounds-${rounds}`}
                  type="button"
                  disabled={!isHost}
                  onClick={() => {
                    setTotalRounds(rounds);
                    sounds.playCardFlip();
                  }}
                  className={cn(
                    'rounded-xl font-mono font-bold text-xs transition-all border text-center',
                    isLandscapeMobile ? 'py-1.5' : 'py-2',
                    totalRounds === rounds
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-amber-300 shadow-gold-glow scale-105'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-white/5',
                    !isHost && 'cursor-not-allowed opacity-75'
                  )}
                >
                  {rounds}R
                </button>
              ))}
            </div>
          </div>

          {/* Quick Doctor Rules Summary Card */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1 text-[10px] sm:text-[11px] text-amber-200/90">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>Doctor Special Rules Active:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[9.5px] sm:text-[10.5px] text-zinc-300">
              <li><strong className="text-red-400">Joker = 50 Points</strong> (discard as single or matching pair).</li>
              <li>Discard identical rank pairs/triples/quads together to drop your sum quickly.</li>
              <li>Picking from discard pile picks ALL cards thrown by the previous player.</li>
              <li>Wrong Show Penalty: <strong className="text-amber-300">+50 PTS</strong> for each player with lower or equal sum!</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={cn("border-t border-white/10 flex items-center justify-end gap-2 bg-black/40 shrink-0", isLandscapeMobile ? "p-2.5 px-4" : "p-4 sm:p-5")}>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
          >
            {isHost ? 'Cancel' : 'Close'}
          </button>

          {isHost && (
            <button
              type="button"
              onClick={handleApply}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-gold-glow flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply Settings</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

