'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BhabhoTrickCard, BhabhoLastTrickResult, Suit } from '@/lib/types';
import { PlayingCard, SuitIcon } from '../card/PlayingCard';
import { Crown, Flame, Trash2, CheckCircle2, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BhabhoCenterTrickProps {
  currentTrick: BhabhoTrickCard[];
  leadSuit: Suit | null;
  highestLeadCard: { card: any; playerId: string; playerName: string } | null;
  lastTrickResult: BhabhoLastTrickResult | null;
  wastePileCount: number;
  isFirstTrickOfGame: boolean;
  roundNumber: number;
  starterName?: string;
  isResolvingTrick?: boolean;
  isLandscape?: boolean;
}

const SUIT_NAMES: Record<Suit, { en: string; hi: string; color: string; badgeBg: string }> = {
  'S': { en: 'Spades', hi: 'हुकुम (Hukkum)', color: 'text-zinc-200', badgeBg: 'bg-zinc-800/90 border-zinc-600' },
  'H': { en: 'Hearts', hi: 'पान (Paan)', color: 'text-red-400', badgeBg: 'bg-red-950/80 border-red-500/50' },
  'C': { en: 'Clubs', hi: 'चिड़ी (Chidi)', color: 'text-zinc-200', badgeBg: 'bg-zinc-800/90 border-zinc-600' },
  'D': { en: 'Diamonds', hi: 'ईंट (Eent)', color: 'text-red-400', badgeBg: 'bg-amber-950/80 border-amber-500/50' },
};

export const BhabhoCenterTrick: React.FC<BhabhoCenterTrickProps> = ({
  currentTrick,
  leadSuit,
  highestLeadCard,
  lastTrickResult,
  wastePileCount,
  isFirstTrickOfGame,
  roundNumber,
  starterName,
  isResolvingTrick = false,
  isLandscape = false,
}) => {
  const suitInfo = leadSuit ? SUIT_NAMES[leadSuit] : null;

  return (
    <div className={cn(
      "relative flex flex-col items-center justify-center select-none pointer-events-none transition-all",
      isLandscape ? "p-0.5 sm:p-1" : "p-2 sm:p-4"
    )}>
      {/* Lead Suit Header Badge */}
      <div className={cn(
        "flex items-center gap-1.5 xs:gap-2 z-10",
        isLandscape ? "mb-1" : "mb-2"
      )}>
        {suitInfo ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              'flex items-center gap-1.5 rounded-full border shadow-xl backdrop-blur-md',
              isLandscape ? 'px-2 py-0.5' : 'px-3 py-1',
              suitInfo.badgeBg
            )}
          >
            <SuitIcon suit={leadSuit!} className={isLandscape ? "w-3.5 h-3.5 shrink-0" : "w-4 h-4 sm:w-5 sm:h-5 shrink-0"} />
            <div className="flex items-center gap-1 text-[10px] xs:text-xs sm:text-sm font-black">
              <span className={suitInfo.color}>{suitInfo.hi}</span>
              <span className="text-zinc-400 text-[8.5px] xs:text-[9.5px] sm:text-xs">({suitInfo.en} Lead)</span>
            </div>
          </motion.div>
        ) : (
          <div className={cn(
            "rounded-full bg-black/60 border border-white/10 text-zinc-400 font-bold backdrop-blur-md flex items-center gap-1.5",
            isLandscape ? "px-2 py-0.5 text-[9px] xs:text-[10px]" : "px-3 py-1 text-[11px] sm:text-xs"
          )}>
            {isFirstTrickOfGame ? (
              <>
                <span className="text-amber-400">♠</span>
                <span>Opening Trick: Ace of Spades (♠ A) must start</span>
              </>
            ) : (
              <span>Trick #{roundNumber} • Waiting for lead card...</span>
            )}
          </div>
        )}

        {/* Waste Pile (Cleared cards) Counter */}
        {wastePileCount > 0 && (
          <div
            title={`${wastePileCount} cards safely discarded to waste pile`}
            className={cn(
              "flex items-center gap-1 rounded-full bg-black/60 border border-white/10 text-zinc-400 font-bold backdrop-blur-md",
              isLandscape ? "px-2 py-0.5 text-[9px] xs:text-[10px]" : "px-2.5 py-1 text-[10px] sm:text-xs"
            )}
          >
            <Trash2 className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-zinc-500" />
            <span className="font-mono text-zinc-300 font-bold">{wastePileCount}</span>
            <span className="hidden sm:inline">cleared</span>
          </div>
        )}
      </div>

      {/* Main Trick Area (Cards played on the felt) */}
      <div className={cn(
        "relative flex items-center justify-center rounded-2xl sm:rounded-3xl bg-black/40 border backdrop-blur-sm shadow-inner transition-all",
        isResolvingTrick ? "border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.25)]" : "border-emerald-500/20",
        isLandscape
          ? "min-w-[170px] xs:min-w-[210px] sm:min-w-[280px] min-h-[65px] xs:min-h-[75px] sm:min-h-[95px] p-1.5"
          : "min-w-[240px] xs:min-w-[280px] sm:min-w-[360px] min-h-[110px] xs:min-h-[125px] sm:min-h-[150px] p-2.5 sm:p-3"
      )}>
        {currentTrick.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-2 sm:p-4">
            <div className={cn(
              "rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400",
              isLandscape ? "w-7 h-7 mb-0.5 text-xs" : "w-10 h-10 sm:w-12 sm:h-12 mb-1"
            )}>
              ♠
            </div>
            <p className={cn(
              "text-zinc-400 font-medium",
              isLandscape ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"
            )}>
              {starterName ? `${starterName}'s turn to lead` : 'Center Table Empty'}
            </p>
            {!isLandscape && (
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Follow suit if you hold the card, else throw a Thulla!
              </p>
            )}
          </div>
        ) : (
          <div className={cn(
            "flex items-center justify-center",
            isLandscape ? "-space-x-3 xs:-space-x-4 sm:-space-x-5" : "-space-x-4 sm:-space-x-6"
          )}>
            <AnimatePresence>
              {currentTrick.map((trickCard, idx) => {
                const isHighestLead = highestLeadCard && highestLeadCard.card.id === trickCard.card.id;
                const isThulla = trickCard.isThulla;
                const isLastThrown = idx === currentTrick.length - 1;

                return (
                  <motion.div
                    key={`trick-${trickCard.card.id}-${idx}`}
                    initial={{ y: -30, opacity: 0, scale: 0.8, rotate: (idx % 2 === 0 ? -6 : 6) }}
                    animate={{ y: 0, opacity: 1, scale: 1, rotate: (idx - (currentTrick.length - 1) / 2) * 5 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className="relative flex flex-col items-center group pointer-events-auto"
                    style={{ zIndex: idx + 10 }}
                  >
                    {/* Highest Lead Card Badge */}
                    {isHighestLead && !isThulla && (
                      <div className="absolute -top-3.5 z-30 flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[7.5px] xs:text-[8px] font-black shadow-md border border-white/50 animate-bounce">
                        <Crown className="w-2.5 h-2.5 fill-black" />
                        <span>HIGHEST</span>
                      </div>
                    )}

                    {/* Thulla Badge */}
                    {isThulla && (
                      <div className="absolute -top-4 z-30 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[8px] xs:text-[9px] font-black shadow-lg border border-yellow-300 animate-pulse">
                        <Flame className="w-2.5 h-2.5 xs:w-3 xs:h-3 fill-yellow-300 text-yellow-300" />
                        <span>THULLA!</span>
                      </div>
                    )}

                    {/* Last Thrown Indicator during trick resolution */}
                    {isResolvingTrick && isLastThrown && !isThulla && !isHighestLead && (
                      <div className="absolute -top-3.5 z-30 flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[7.5px] font-black shadow-md border border-white">
                        <span>NEW</span>
                      </div>
                    )}

                    {/* The Card */}
                    <div
                      className={cn(
                        'transition-transform shadow-2xl rounded-lg',
                        isHighestLead && 'ring-2 ring-gold/90 shadow-[0_0_20px_rgba(234,179,8,0.5)]',
                        isThulla && 'ring-2 ring-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)]',
                        isResolvingTrick && isLastThrown && 'ring-2 ring-emerald-400 scale-105'
                      )}
                    >
                      <PlayingCard card={trickCard.card} size={isLandscape ? 'xs' : 'sm'} />
                    </div>

                    {/* Player Name Pill */}
                    <div
                      className={cn(
                        "rounded-full bg-black/85 backdrop-blur-md border border-white/20 font-bold text-white shadow-md flex items-center gap-1 truncate",
                        isLandscape ? "mt-0.5 px-1.5 py-0 text-[8px] max-w-[70px]" : "mt-1 px-2 py-0.5 text-[9px] sm:text-[10px] max-w-[85px]"
                      )}
                      style={{ borderLeftColor: trickCard.playerAvatar, borderLeftWidth: 3 }}
                    >
                      <span className="truncate">{trickCard.playerName}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 2-Second Trick Resolution Banner (Shows immediately when the last card is thrown) */}
      <AnimatePresence>
        {(isResolvingTrick || lastTrickResult) && (
          <motion.div
            key={lastTrickResult ? lastTrickResult.id : 'resolving-banner'}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={cn(
              'mt-1.5 rounded-full font-bold backdrop-blur-md border shadow-lg flex items-center gap-1.5 transition-all',
              isLandscape ? 'px-2.5 py-0.5 text-[9px] xs:text-[10px]' : 'px-3.5 py-1 text-xs',
              lastTrickResult?.type === 'THULLA'
                ? 'bg-red-950/90 border-red-500/70 text-red-200 animate-pulse'
                : 'bg-emerald-950/90 border-emerald-500/70 text-emerald-200'
            )}
          >
            {lastTrickResult?.type === 'THULLA' ? (
              <>
                <Flame className="w-3 h-3 text-red-400 fill-red-400 shrink-0" />
                <span>
                  THULLA by <strong className="text-white">{lastTrickResult.thullaPlayerName}</strong>!{' '}
                  <strong className="text-amber-300">{lastTrickResult.winnerOrPenalizedPlayerName}</strong> collects{' '}
                  {lastTrickResult.cards.length} cards
                  {isResolvingTrick && <span className="text-yellow-300 ml-1 font-mono text-[9px]">(sweeping in 2s...)</span>}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>
                  Clean trick won by{' '}
                  <strong className="text-white">{lastTrickResult?.winnerOrPenalizedPlayerName}</strong> ({lastTrickResult?.cards.length || currentTrick.length} cards)
                  {isResolvingTrick && <span className="text-emerald-300 ml-1 font-mono text-[9px]">(clearing in 2s...)</span>}
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
