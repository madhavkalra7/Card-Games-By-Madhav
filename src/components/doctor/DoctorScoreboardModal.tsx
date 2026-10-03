'use client';

import React, { useEffect, useState } from 'react';
import { DoctorRoundScore, PlayerClientView, Card } from '@/lib/types';
import { sounds } from '@/lib/sound';
import { cn } from '@/lib/utils';
import { Trophy, ArrowRight, AlertTriangle, CheckCircle2, Crown, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getDoctorCardValue } from '@/lib/doctorUtils';

import { useViewportOrientation } from '@/hooks/useViewportOrientation';

interface DoctorScoreboardModalProps {
  isOpen: boolean;
  roundResult: DoctorRoundScore | null;
  scoresHistory: DoctorRoundScore[];
  cumulativeScores: Record<string, number>;
  players: PlayerClientView[];
  myPlayerId: string;
  isHost: boolean;
  currentRound: number;
  totalRounds: number;
  onNextRound: () => void;
  onClose?: () => void;
}

export const DoctorScoreboardModal: React.FC<DoctorScoreboardModalProps> = ({
  isOpen,
  roundResult,
  scoresHistory,
  cumulativeScores,
  players,
  myPlayerId,
  isHost,
  currentRound,
  totalRounds,
  onNextRound,
  onClose,
}) => {
  const [animationStep, setAnimationStep] = useState<number>(0);
  const isFinalRound = currentRound >= totalRounds;
  const { isLandscape, isMobile, viewportHeight } = useViewportOrientation();
  const isLandscapeMobile = isLandscape && (viewportHeight <= 520 || isMobile);

  // Staggered marker drawing animation
  useEffect(() => {
    if (!isOpen || !roundResult) {
      setAnimationStep(0);
      return;
    }

    setAnimationStep(1);
    sounds.playMarkerScribble();

    const t1 = setTimeout(() => {
      setAnimationStep(2);
      sounds.playMarkerScribble();
    }, 600);

    const t2 = setTimeout(() => {
      setAnimationStep(3);
      sounds.playMarkerScribble();
      if (!roundResult.isWrongShow) {
        sounds.playBazaarOpen();
      } else {
        sounds.playWrongShowBuzzer();
      }
    }, 1200);

    const t3 = setTimeout(() => {
      setAnimationStep(4);
      if (isFinalRound) {
        try {
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, roundResult, isFinalRound]);

  if (!isOpen || !roundResult) return null;

  // Sort players by cumulative score ascending (lowest score is best!)
  const sortedPlayers = [...players].sort((a, b) => {
    const sA = cumulativeScores[a.id] ?? 99999;
    const sB = cumulativeScores[b.id] ?? 99999;
    return sA - sB;
  });

  const callerPlayer = players.find((p) => p.id === roundResult.callerId);
  const winnerPlayer = players.find((p) => p.id === roundResult.winnerId);

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 select-none overflow-y-auto">
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-2xl bg-gradient-to-b from-stone-900 via-zinc-950 to-black border-2 sm:border-4 border-amber-500/80 rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(217,119,6,0.4)] overflow-hidden flex flex-col",
          isLandscapeMobile ? "max-h-[96dvh] m-1" : "max-h-[92dvh]"
        )}
      >
        {/* Whiteboard / Scorecard Outer Frame */}
        <div className="absolute top-0 left-0 right-0 h-3 sm:h-4 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 shadow-md" />

        {/* Realistic Metallic Paper Clip Accent at Top */}
        <div className={cn("absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 pointer-events-none", isLandscapeMobile ? "top-1" : "top-2")}>
          <div className="w-10 sm:w-12 h-2 sm:h-2.5 bg-zinc-400 rounded-full border border-zinc-600 shadow-sm" />
        </div>

        {/* Scorecard Header */}
        <div className={cn("text-center border-b border-white/10 shrink-0 bg-stone-900/60", isLandscapeMobile ? "pt-3.5 pb-1.5 px-3" : "pt-6 pb-3 px-4 sm:px-6")}>
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-wider mb-0.5">
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" />
            <span>Doctor Tournament Scorecard</span>
            <span className="text-white/60">•</span>
            <span className="text-white">
              Round {currentRound} of {totalRounds}
            </span>
          </div>

          <h2
            className={cn("font-black uppercase tracking-wider text-white filter drop-shadow flex items-center justify-center gap-2", isLandscapeMobile ? "text-base sm:text-lg" : "text-xl sm:text-2xl")}
            style={{ fontFamily: "'Impact', 'Arial Black', sans-serif" }}
          >
            <span>ROUND {currentRound} RESULTS</span>
          </h2>

          {/* Outcome Headline with Marker Stamp Animation */}
          <div className="mt-1 flex items-center justify-center">
            {roundResult.isWrongShow ? (
              <div
                className={cn(
                  'rounded-xl sm:rounded-2xl bg-rose-950/80 border border-rose-500 text-rose-200 font-extrabold flex items-center gap-1.5 shadow-lg transition-all duration-300',
                  isLandscapeMobile ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm',
                  animationStep >= 2 ? 'scale-100 opacity-100 rotate-[-1deg]' : 'scale-90 opacity-0'
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
                <span>
                  WRONG SHOW! <strong className="text-white underline">{callerPlayer?.name || 'Caller'}</strong> caught with sum{' '}
                  <strong>{roundResult.handSums[roundResult.callerId]}</strong>!{' '}
                  <span className="text-yellow-300 font-mono">+{roundResult.penaltyPoints || 50} PTS Penalty</span>
                </span>
              </div>
            ) : (
              <div
                className={cn(
                  'rounded-xl sm:rounded-2xl bg-emerald-950/80 border border-emerald-400 text-emerald-200 font-extrabold flex items-center gap-1.5 shadow-lg transition-all duration-300',
                  isLandscapeMobile ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm',
                  animationStep >= 2 ? 'scale-100 opacity-100 rotate-[1deg]' : 'scale-90 opacity-0'
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  SHOW SUCCESSFUL! <strong className="text-white underline">{winnerPlayer?.name || 'Winner'}</strong> had lowest sum (
                  {roundResult.handSums[roundResult.winnerId]} PTS) & claims{' '}
                  <span className="text-yellow-300 font-mono font-black">0 PTS</span>!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Whiteboard Slate Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-stone-100/95 text-zinc-900 rounded-2xl m-2 sm:m-3 shadow-inner border border-stone-300">
          
          {/* Authentic Whiteboard Grid Header */}
          <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-stone-400 px-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1">
              <span>✍️ HANDWRITTEN SCORE LOG</span>
              <span className="text-stone-400 font-normal">(Lowest Cumulative Wins)</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-stone-500">
              Limit: ≤{roundResult.callerId ? '10' : '15'}
            </span>
          </div>

          {/* Scores Table */}
          <div className="space-y-2">
            {sortedPlayers.map((player, idx) => {
              const pId = player.id;
              const isWinnerThisRound = roundResult.winnerId === pId;
              const isCallerThisRound = roundResult.callerId === pId;
              const isWrongCaller = isCallerThisRound && roundResult.isWrongShow;
              const handSum = roundResult.handSums[pId] ?? 0;
              const roundScore = roundResult.scores[pId] ?? handSum;
              const totalScore = cumulativeScores[pId] ?? 0;
              const revealedCards = roundResult.revealedHands[pId] || [];
              const isMe = pId === myPlayerId;

              return (
                <div
                  key={`score-row-${pId}`}
                  className={cn(
                    'relative p-2.5 sm:p-3 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm',
                    isWinnerThisRound
                      ? 'bg-amber-100/90 border-amber-500/90 ring-2 ring-amber-400/40'
                      : isWrongCaller
                      ? 'bg-red-50/90 border-red-400/80'
                      : 'bg-white/80 border-stone-300'
                  )}
                >
                  {/* Left: Player Profile & Revealed Hand */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={cn(
                        'w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center font-black text-xs font-mono shrink-0 shadow-sm',
                        idx === 0
                          ? 'bg-amber-500 text-black shadow-gold-glow'
                          : 'bg-stone-800 text-stone-200'
                      )}
                    >
                      #{idx + 1}
                    </div>

                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full border border-stone-400 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow"
                      style={{ backgroundColor: player.avatarColor || '#e11d48' }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs sm:text-sm text-stone-900 truncate max-w-[100px] sm:max-w-[150px]">
                          {player.name}
                        </span>
                        {isMe && (
                          <span className="text-[8px] bg-stone-900 text-white font-extrabold px-1 rounded">
                            YOU
                          </span>
                        )}
                        {isWinnerThisRound && (
                          <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-200/80 px-1.5 py-0.2 rounded border border-emerald-400 flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" />
                            <span>Winner</span>
                          </span>
                        )}
                        {isCallerThisRound && !roundResult.isWrongShow && (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">
                            Caller
                          </span>
                        )}
                        {isWrongCaller && (
                          <span className="text-[9px] font-black uppercase text-red-800 bg-red-200 px-1.5 py-0.2 rounded border border-red-400 animate-pulse">
                            Penalty
                          </span>
                        )}
                      </div>

                      {/* Mini Hand Preview */}
                      <div className="flex items-center gap-1 text-[10px] text-stone-600 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-[280px]">
                        <span>Hand Sum: <strong>{handSum}</strong></span>
                        <span>•</span>
                        <span className="truncate">
                          ({revealedCards.map((c) => c.rank).join(', ')})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Round Score with Thick Black Marker Style */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-200 shrink-0">
                    {/* Round Points with Marker Effect */}
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider">
                        R{currentRound} Score
                      </span>
                      <div className="flex items-center gap-1">
                        {animationStep >= 2 ? (
                          <span
                            className={cn(
                              'text-base sm:text-lg font-black tracking-tight transition-all',
                              isWinnerThisRound
                                ? 'text-emerald-700 underline decoration-wavy decoration-emerald-500 font-mono text-xl'
                                : isWrongCaller
                                ? 'text-red-600 font-mono'
                                : 'text-stone-900 font-mono'
                            )}
                            style={{
                              fontFamily: "'Courier New', Courier, monospace",
                              textShadow: '0 0 1px rgba(0,0,0,0.5)',
                            }}
                          >
                            {isWinnerThisRound ? '0 PTS' : `+${roundScore} PTS`}
                          </span>
                        ) : (
                          <span className="text-sm font-mono text-stone-400 animate-pulse">writing...</span>
                        )}
                      </div>
                    </div>

                    {/* Total Cumulative Score Badge */}
                    <div className="flex flex-col items-end pl-3 border-l border-stone-300">
                      <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider">
                        Cumulative Total
                      </span>
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-stone-900 text-amber-300 font-mono font-black text-sm sm:text-base shadow">
                        <span>{totalScore} PTS</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Past Rounds Summary Pills */}
          {scoresHistory.length > 1 && (
            <div className="pt-2 border-t border-stone-300">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-600 block mb-1">
                Completed Rounds History:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {scoresHistory.map((s) => (
                  <div
                    key={`hist-${s.roundNumber}`}
                    className="px-2 py-1 rounded-xl bg-stone-200 border border-stone-300 text-[10px] font-mono text-stone-800 flex items-center gap-1"
                  >
                    <span className="font-bold">R{s.roundNumber}:</span>
                    <span className="text-emerald-700 font-black">
                      {players.find((p) => p.id === s.winnerId)?.name || 'Winner'} (0)
                    </span>
                    {s.isWrongShow && (
                      <span className="text-red-600 font-bold">• 🚨 Penalty</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Scoreboard Bottom Bar / Advance Controls */}
        <div className="p-3.5 sm:p-5 bg-stone-950 border-t border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium hidden xs:inline">
              {isFinalRound
                ? '🏆 Tournament finished! Lowest total score won.'
                : `Next match will begin round ${currentRound + 1} of ${totalRounds}.`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>
            )}

            {!isFinalRound ? (
              isHost ? (
                <button
                  type="button"
                  onClick={onNextRound}
                  className="px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-gold-glow flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Start Round {currentRound + 1}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/30">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Waiting for host to start Round {currentRound + 1}...</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-gold-glow">
                <Crown className="w-4 h-4" />
                <span>Tournament Champion Crowned!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
