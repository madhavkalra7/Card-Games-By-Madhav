'use client';

import React, { useEffect, useState } from 'react';
import { BluffChallengeResult } from '@/lib/types';
import { PlayingCard } from '../card/PlayingCard';
import { CheckCircle, ShieldAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/sound';
import { announceShowdownResult, VoiceLanguage } from '@/lib/bluffAnnouncer';

interface ChallengeRevealModalProps {
  result: BluffChallengeResult | null;
  onClose: () => void;
  voiceLanguage?: VoiceLanguage;
  isMuted?: boolean;
}

export const ChallengeRevealModal: React.FC<ChallengeRevealModalProps> = ({
  result,
  onClose,
  voiceLanguage = 'EN',
  isMuted = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const handleDismiss = () => {
    if (result) {
      setDismissedId(result.id);
    }
    setVisible(false);
    onClose();
  };

  useEffect(() => {
    if (result && result.id !== dismissedId) {
      setVisible(true);

      // Play audio reaction based on showdown outcome
      if (!result.wasBluff) {
        // Honest move: Challenger was wrong! Play funny comical "awwww" sound!
        sounds.playAww();
      } else {
        // Bluff caught: Play dramatic penalty sound!
        sounds.playPenalty();
      }

      // Voice announcer reaction
      if (!isMuted) {
        announceShowdownResult(
          result.wasBluff,
          result.accusedName,
          result.challengerName,
          voiceLanguage
        );
      }

      const timer = setTimeout(() => {
        handleDismiss();
      }, 7000);
      return () => clearTimeout(timer);
    } else if (!result) {
      setVisible(false);
    }
  }, [result?.id, dismissedId, isMuted, voiceLanguage]);

  if (!visible || !result || result.id === dismissedId) return null;

  const {
    challengerName,
    accusedName,
    declaredRank,
    revealedCards,
    wasBluff,
    cardsPenalizedCount,
    penalizedPlayerName,
  } = result;

  return (
    <div
      onClick={handleDismiss}
      className="fixed inset-0 z-[150] flex items-center justify-center p-2.5 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-sm sm:max-w-md md:max-w-lg rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-7 shadow-2xl overflow-hidden text-center transition-all animate-in zoom-in-90 duration-300 max-h-[92vh] overflow-y-auto',
          wasBluff
            ? 'bg-gradient-to-b from-red-950/95 via-zinc-950/95 to-black border-red-500/70 shadow-red-950/50'
            : 'bg-gradient-to-b from-emerald-950/95 via-zinc-950/95 to-black border-emerald-500/70 shadow-emerald-950/50'
        )}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4 text-zinc-400 hover:text-white p-1 sm:p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Top Challenge Banner */}
        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
          {wasBluff ? (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] sm:text-xs font-black uppercase tracking-widest animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>SHOWDOWN • BLUFF DETECTED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[10px] sm:text-xs font-black uppercase tracking-widest animate-pulse">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>SHOWDOWN • 100% HONEST (AWWW! 🥺)</span>
            </div>
          )}
        </div>

        {/* Challenge Storyline */}
        <h3 className="text-xs sm:text-base font-bold text-zinc-300">
          <span className="text-white font-extrabold">{challengerName}</span> challenged{' '}
          <span className="text-white font-extrabold">{accusedName}</span>!
        </h3>

        <p className="text-[11px] sm:text-xs text-amber-300/90 font-medium mt-0.5 sm:mt-1">
          Claimed: <span className="font-black text-amber-400">{revealedCards.length} × Rank &apos;{declaredRank}&apos;</span>
        </p>

        {/* Revealed Cards Display */}
        <div className="my-3 sm:my-5 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          {revealedCards.map((card, idx) => {
            const isMatch = card.rank === declaredRank;
            return (
              <div key={idx} className="flex flex-col items-center gap-1 animate-in slide-in-from-bottom-2 duration-300">
                <PlayingCard
                  card={card}
                  size="xs"
                  className={cn(
                    'shadow-xl transition-all sm:scale-110',
                    isMatch
                      ? 'ring-2 ring-emerald-400 shadow-emerald-500/40'
                      : 'ring-3 ring-red-500 shadow-red-500/50 scale-105 sm:scale-115'
                  )}
                />
                <span
                  className={cn(
                    'text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.2 rounded-md',
                    isMatch
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-red-500/30 text-red-400 border border-red-500/60'
                  )}
                >
                  {isMatch ? 'Truth' : 'Lie!'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Big Verdict Header */}
        <div className="mb-3 sm:mb-4">
          <h2
            className={cn(
              'text-xl sm:text-3xl font-black uppercase tracking-wide font-serif',
              wasBluff ? 'text-red-400' : 'text-emerald-400'
            )}
          >
            {wasBluff ? '🚨 BLUFF CAUGHT!' : '🛡️ 100% HONEST! AWWWW~ 🥺'}
          </h2>
          <p className="text-[11px] sm:text-sm text-zinc-200 mt-1.5 sm:mt-2 font-medium leading-relaxed">
            {wasBluff ? (
              <>
                <strong className="text-red-300 font-bold">{accusedName}</strong> was caught lying!
                <br />
                <span className="text-amber-300 font-black">{penalizedPlayerName}</span> picks up all{' '}
                <strong className="text-amber-400 font-extrabold">{cardsPenalizedCount} cards</strong> from the table!
              </>
            ) : (
              <>
                <strong className="text-emerald-300 font-bold">{accusedName}</strong> played strictly truthful cards!
                <br />
                Challenger <span className="text-amber-300 font-black">{penalizedPlayerName}</span> was wrong and must pick up all{' '}
                <strong className="text-amber-400 font-extrabold">{cardsPenalizedCount} cards</strong>!
              </>
            )}
          </p>
        </div>

        {/* Continue Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full py-2.5 sm:py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-gold-glow transition-all active:scale-95 cursor-pointer pointer-events-auto"
        >
          Continue Game
        </button>
      </div>
    </div>
  );
};
