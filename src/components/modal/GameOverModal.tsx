'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { PlayerClientView } from '@/lib/types';
import { Crown, RotateCcw, Trophy, LogOut, Medal, Sparkles, BookOpen, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/sound';
import { useAlbumStore } from '@/store/albumStore';

interface GameOverModalProps {
  status: 'LOBBY' | 'PLAYING' | 'GAME_OVER';
  winner: { id: string; name: string; avatarColor: string } | null;
  rankings?: Array<{
    playerId: string;
    name: string;
    avatarColor: string;
    rank: number;
    scoreEarned?: number;
    totalScore?: number;
    rewardCard?: {
      id: string;
      name: string;
      hindiName: string;
      rank: string;
      suit: string;
      family: string;
      rarity: string;
      power: number;
      collectorNumber: number;
      specialEffect?: string;
      accentColor: string;
      glowColor: string;
    };
  }>;
  players: PlayerClientView[];
  myPlayerId?: string;
  isHost: boolean;
  onPlayAgain: () => void;
  onExit?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  winner,
  rankings = [],
  players,
  myPlayerId,
  isHost,
  onPlayAgain,
  onExit,
}) => {
  const myRanking = rankings.find((r) => r.playerId === myPlayerId);
  const myReward = myRanking?.rewardCard;

  useEffect(() => {
    if (status === 'GAME_OVER') {
      sounds.playVictory();

      // Automatically add reward card into user's persistent album!
      if (myReward) {
        useAlbumStore.getState().unlockCard(myReward.id);
        setTimeout(() => sounds.playCardShimmer(), 600);
      }

      // Fire victory confetti burst
      const count = 180;
      const defaults = { origin: { y: 0.6 } };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
          colors: ['#f59e0b', '#d4af37', '#e11d48', '#10b981', '#3b82f6'],
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [status, myReward]);

  if (status !== 'GAME_OVER') return null;

  let standings: Array<{
    id: string;
    name: string;
    avatarColor: string;
    rank: number;
    scoreEarned?: number;
    totalScore?: number;
    cardsLeft?: number;
    rewardCard?: {
      id: string;
      name: string;
      hindiName: string;
      rank: string;
      suit: string;
      family: string;
      rarity: string;
      power: number;
      collectorNumber: number;
      specialEffect?: string;
      accentColor: string;
      glowColor: string;
    };
  }> = [];

  if (rankings && rankings.length > 0) {
    standings = [...rankings].map((r) => ({
      id: r.playerId,
      name: r.name,
      avatarColor: r.avatarColor,
      rank: r.rank,
      scoreEarned: r.scoreEarned,
      totalScore: r.totalScore,
      rewardCard: r.rewardCard,
    }));
  } else {
    const sorted = [...players].sort(
      (a, b) => a.hiddenCount + a.rightDeckCount - (b.hiddenCount + b.rightDeckCount)
    );
    standings = sorted.map((p, idx) => ({
      id: p.id,
      name: p.name,
      avatarColor: p.avatarColor,
      rank: p.rank || idx + 1,
      cardsLeft: p.hiddenCount + p.rightDeckCount,
    }));
  }

  standings.sort((a, b) => a.rank - b.rank);
  const firstWinner = standings.find((s) => s.rank === 1) || standings[0];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in duration-300 overflow-y-auto select-none">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-gradient-to-b from-zinc-950 via-[#18110b] to-[#0d0a06] border-2 border-gold rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-[0_0_50px_rgba(212,175,55,0.35)] flex flex-col items-center text-center">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-gold/25 blur-2xl pointer-events-none rounded-full" />

        {/* Trophy Icon */}
        <div className="relative mb-2 sm:mb-3">
          <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-gold-glow flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
              <Trophy className="w-7 h-7 sm:w-9 sm:h-9 text-amber-400 animate-pulse" />
            </div>
          </div>
          <Sparkles
            className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300 animate-spin"
            style={{ animationDuration: '6s' }}
          />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-wider font-serif">
          Match Leaderboard
        </h2>
        <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
          Tournament Complete • All Ranks Decided
        </p>

        {/* Winner Highlight Capsule */}
        {firstWinner && (
          <div className="mt-2.5 sm:mt-3 flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gold/15 border border-gold/40 shadow-sm">
            <div
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow"
              style={{ backgroundColor: firstWinner.avatarColor || '#3b82f6' }}
            >
              {firstWinner.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-extrabold text-gold text-sm sm:text-base">
              🏆 {firstWinner.name}
            </span>
            <span className="text-[10px] sm:text-xs text-amber-300 font-bold bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/40">
              +{firstWinner.scoreEarned || 2000} PTS
            </span>
          </div>
        )}

        {/* Post-Match Card Reward Drop Highlight (1st & 2nd place players) */}
        {myReward && (
          <div className="w-full mt-3 sm:mt-4 p-2.5 xs:p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-zinc-950/90 to-purple-950/80 border-2 border-amber-400/70 shadow-[0_0_30px_rgba(212,175,55,0.45)] flex flex-col sm:flex-row items-center justify-between gap-2.5 xs:gap-3 text-left">
            <div className="flex items-center gap-2.5 xs:gap-3 min-w-0 w-full sm:w-auto">
              {/* Mini Card Emblem */}
              <div
                className={cn(
                  'w-11 h-15 xs:w-12 xs:h-16 sm:w-14 sm:h-20 rounded-xl p-0.5 xs:p-1 flex flex-col items-center justify-between text-center shrink-0 shadow-lg border',
                  myReward.specialEffect === 'diamond_shine'
                    ? 'bg-gradient-to-b from-sky-900 via-slate-950 to-black border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.9)] text-cyan-300'
                    : myReward.specialEffect === 'gold_particles'
                    ? 'bg-gradient-to-b from-amber-900 via-zinc-950 to-black border-yellow-300 shadow-[0_0_20px_rgba(245,158,11,0.9)] text-amber-300'
                    : myReward.specialEffect === 'silver_chrome'
                    ? 'bg-gradient-to-b from-slate-800 via-zinc-950 to-black border-slate-300 shadow-[0_0_15px_rgba(255,255,255,0.7)] text-slate-100'
                    : 'bg-zinc-900 border-white/20 text-white'
                )}
              >
                <span className="text-[9px] xs:text-[10px] font-mono font-black">{myReward.rank}</span>
                <span className="text-lg xs:text-xl sm:text-2xl">
                  {myReward.suit === 'VAULT'
                    ? myReward.specialEffect === 'diamond_shine'
                      ? '💎'
                      : '👑'
                    : myReward.suit === 'S'
                    ? '♠'
                    : myReward.suit === 'H'
                    ? '♥'
                    : myReward.suit === 'D'
                    ? '♦'
                    : '♣'}
                </span>
                <span className="text-[6.5px] xs:text-[7px] font-mono text-zinc-400">
                  #{String(myReward.collectorNumber).padStart(2, '0')}
                </span>
              </div>

              {/* Reward Text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[7.5px] xs:text-[8px] uppercase px-1.5 py-0.2 rounded font-black tracking-wider bg-amber-400 text-black">
                    {myReward.rarity}
                  </span>
                  <span className="text-[8.5px] xs:text-[9px] text-amber-300 font-bold uppercase tracking-wider">
                    🎉 Collectible Drop!
                  </span>
                </div>
                <h4 className="text-xs xs:text-sm sm:text-base font-black text-white leading-tight truncate">
                  {myReward.name}
                </h4>
                <p className="text-[11px] xs:text-xs font-bold text-amber-300 truncate">
                  {myReward.hindiName}
                </p>
                <span className="text-[8px] xs:text-[8.5px] text-emerald-400 font-medium block mt-0.5 truncate">
                  ✓ Automatically added to your Royal Album!
                </span>
              </div>
            </div>

            <Link
              href="/album"
              className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black text-xs font-black uppercase tracking-wider transition-all shadow-gold-glow active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>View Album</span>
            </Link>
          </div>
        )}

        {/* Standings List */}
        <div className="w-full mt-3 sm:mt-5 bg-zinc-900/70 rounded-xl sm:rounded-2xl border border-zinc-800/80 p-2 xs:p-2.5 sm:p-4">
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 text-left mb-1.5 xs:mb-2 sm:mb-2.5">
            Final Standings &amp; Rewards
          </h3>
          <div className="space-y-1.5 sm:space-y-2">
            {standings.map((p) => {
              const isFirst = p.rank === 1;
              const isSecond = p.rank === 2;
              const isThird = p.rank === 3;
              const isSelf = p.id === myPlayerId;

              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center justify-between p-1.5 xs:p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all',
                    isFirst
                      ? 'bg-amber-500/15 border border-gold/60 text-gold-light font-bold shadow-gold-glow'
                      : isSecond
                      ? 'bg-slate-300/10 border border-slate-400/40 text-slate-200'
                      : isThird
                      ? 'bg-amber-900/15 border border-amber-700/40 text-amber-200'
                      : 'bg-zinc-800/40 border border-white/5 text-zinc-300',
                    isSelf && 'ring-1.5 ring-gold'
                  )}
                >
                  <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 min-w-0">
                    {/* Medal/Rank */}
                    <span className="w-4 xs:w-5 text-center text-xs sm:text-sm font-black shrink-0">
                      {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `#${p.rank}`}
                    </span>

                    {/* Avatar */}
                    <div
                      className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] xs:text-[10px] sm:text-xs font-bold text-white shrink-0 shadow"
                      style={{ backgroundColor: p.avatarColor || '#3b82f6' }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[130px]">{p.name}</span>
                      {isSelf && (
                        <span className="text-[7.5px] xs:text-[8px] sm:text-[9px] bg-white/20 text-white px-1 py-0.2 rounded font-mono shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Card Drop Pill & Points */}
                  <div className="flex items-center gap-1 xs:gap-1.5 shrink-0">
                    {/* Collectible Reward Pill */}
                    {p.rewardCard && (
                      <span
                        className={cn(
                          'hidden xs:flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono font-bold border',
                          p.rewardCard.rarity === 'mythic'
                            ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-purple-glow'
                            : p.rewardCard.rarity === 'legendary'
                            ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-gold-glow'
                            : 'bg-zinc-800/80 border-white/20 text-zinc-300'
                        )}
                        title={`Unlocked: ${p.rewardCard.name} (${p.rewardCard.hindiName})`}
                      >
                        <span>🎁</span>
                        <span className="truncate max-w-[55px] xs:max-w-[65px] sm:max-w-[100px]">
                          {p.rewardCard.hindiName}
                        </span>
                      </span>
                    )}

                    {p.scoreEarned !== undefined && (
                      <span className="px-1.5 xs:px-2 py-0.5 rounded-full font-black text-[9px] xs:text-[10px] sm:text-[11px] bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono shrink-0">
                        +{p.scoreEarned.toLocaleString()} PTS
                      </span>
                    )}
                    <span
                      className={cn(
                        'px-1.5 xs:px-2 py-0.5 rounded-full font-black text-[8.5px] xs:text-[9px] sm:text-[10px] uppercase tracking-wider shrink-0',
                        isFirst && 'bg-amber-400 text-black',
                        isSecond && 'bg-slate-300 text-black',
                        isThird && 'bg-amber-700 text-white',
                        p.rank > 3 && 'bg-zinc-800 text-zinc-400'
                      )}
                    >
                      {isFirst ? (
                        <>1st<span className="hidden xs:inline"> Place</span></>
                      ) : isSecond ? (
                        <>2nd<span className="hidden xs:inline"> Place</span></>
                      ) : isThird ? (
                        <>3rd<span className="hidden xs:inline"> Place</span></>
                      ) : (
                        `#${p.rank}`
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-4 sm:mt-6 w-full flex flex-col sm:flex-row gap-2">
          {isHost ? (
            <button
              onClick={onPlayAgain}
              className="flex-1 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300 shadow-gold-glow active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Deal Again & Rematch</span>
            </button>
          ) : (
            <div className="flex-1 py-2.5 text-center text-[11px] sm:text-xs text-zinc-400">
              Waiting for host to restart match...
            </div>
          )}

          {onExit && (
            <button
              onClick={onExit}
              className="py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-200 shadow active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
