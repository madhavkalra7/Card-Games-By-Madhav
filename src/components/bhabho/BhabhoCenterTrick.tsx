'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BhabhoTrickCard, BhabhoLastTrickResult, Suit } from '@/lib/types';
import { PlayingCard, SuitIcon } from '../card/PlayingCard';
import { Crown, Flame, Trash2, ShieldAlert } from 'lucide-react';
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
}) => {
  const suitInfo = leadSuit ? SUIT_NAMES[leadSuit] : null;

  return (
    <div className="relative flex flex-col items-center justify-center p-2 sm:p-4 select-none pointer-events-none">
      {/* Lead Suit Header Badge */}
      <div className="flex items-center gap-2 mb-2 z-10">
        {suitInfo ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-full border shadow-xl backdrop-blur-md',
              suitInfo.badgeBg
            )}
          >
            <SuitIcon suit={leadSuit!} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black">
              <span className={suitInfo.color}>{suitInfo.hi}</span>
              <span className="text-zinc-400 text-[10px] sm:text-xs">({suitInfo.en} Lead)</span>
            </div>
          </motion.div>
        ) : (
          <div className="px-3 py-1 rounded-full bg-black/60 border border-white/10 text-zinc-400 text-[11px] sm:text-xs font-bold backdrop-blur-md flex items-center gap-1.5">
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-zinc-400 text-[10px] sm:text-xs font-bold backdrop-blur-md"
          >
            <Trash2 className="w-3 h-3 text-zinc-500" />
            <span className="font-mono text-zinc-300 font-bold">{wastePileCount}</span>
            <span className="hidden sm:inline">cleared</span>
          </div>
        )}
      </div>

      {/* Main Trick Area (Cards played on the felt) */}
      <div className="relative min-w-[240px] xs:min-w-[280px] sm:min-w-[360px] min-h-[110px] xs:min-h-[125px] sm:min-h-[150px] flex items-center justify-center p-3 rounded-2xl sm:rounded-3xl bg-black/35 border border-emerald-500/20 backdrop-blur-sm shadow-inner">
        {currentTrick.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-1 text-emerald-400">
              ♠
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium">
              {starterName ? `${starterName}'s turn to lead` : 'Center Table Empty'}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Follow suit if you hold the card, else throw a Thulla!
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center -space-x-4 sm:-space-x-6">
            <AnimatePresence>
              {currentTrick.map((trickCard, idx) => {
                const isHighestLead = highestLeadCard && highestLeadCard.card.id === trickCard.card.id;
                const isThulla = trickCard.isThulla;

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
                      <div className="absolute -top-3.5 z-30 flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[8px] font-black shadow-md border border-white/50 animate-bounce">
                        <Crown className="w-2.5 h-2.5 fill-black" />
                        <span>HIGHEST</span>
                      </div>
                    )}

                    {/* Thulla Badge */}
                    {isThulla && (
                      <div className="absolute -top-4 z-30 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black shadow-lg border border-yellow-300 animate-pulse">
                        <Flame className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                        <span>THULLA!</span>
                      </div>
                    )}

                    {/* The Card */}
                    <div
                      className={cn(
                        'transition-transform shadow-2xl rounded-lg',
                        isHighestLead && 'ring-2 ring-gold/90 shadow-[0_0_20px_rgba(234,179,8,0.5)]',
                        isThulla && 'ring-2 ring-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                      )}
                    >
                      <PlayingCard card={trickCard.card} size="sm" />
                    </div>

                    {/* Player Name Pill */}
                    <div
                      className="mt-1 px-2 py-0.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-[9px] sm:text-[10px] font-bold text-white shadow-md flex items-center gap-1 max-w-[85px] truncate"
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

      {/* Floating Notification for Recent Trick Outcome (e.g. Thulla penalty or Clean Sweep) */}
      <AnimatePresence>
        {lastTrickResult && (
          <motion.div
            key={lastTrickResult.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'mt-2 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg flex items-center gap-1.5',
              lastTrickResult.type === 'THULLA'
                ? 'bg-red-950/85 border-red-500/60 text-red-200'
                : 'bg-emerald-950/85 border-emerald-500/60 text-emerald-200'
            )}
          >
            {lastTrickResult.type === 'THULLA' ? (
              <>
                <Flame className="w-3.5 h-3.5 text-red-400 fill-red-400 shrink-0" />
                <span>
                  THULLA by <strong className="text-white">{lastTrickResult.thullaPlayerName}</strong>!{' '}
                  <strong className="text-amber-300">{lastTrickResult.winnerOrPenalizedPlayerName}</strong> picked up{' '}
                  {lastTrickResult.cards.length} cards!
                </span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>
                  Clean trick cleared! Won by{' '}
                  <strong className="text-white">{lastTrickResult.winnerOrPenalizedPlayerName}</strong> ({lastTrickResult.cards.length} cards)
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
