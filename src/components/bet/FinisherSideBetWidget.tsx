'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { useViewportOrientation } from '@/hooks/useViewportOrientation';
import { cn } from '@/lib/utils';
import { Flame, ArrowRight } from 'lucide-react';

export const FinisherSideBetWidget: React.FC = () => {
  const { gameState, activeSideBet, setSideBetModalOpen } = useGameStore();
  const { isLandscape, isMobile, viewportHeight } = useViewportOrientation();
  const isLandscapeMobile = isLandscape && (viewportHeight <= 520 || isMobile);

  if (!gameState || gameState.status !== 'PLAYING') return null;

  const myPlayerId = gameState.myPlayerId;
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  const isFinisher = myPlayer?.isFinished && (myPlayer.rank === 1 || myPlayer.rank === 2);

  const finisher1 = gameState.players.find((p) => p.isFinished && p.rank === 1);
  const finisher2 = gameState.players.find((p) => p.isFinished && p.rank === 2);
  const bothFinishersExist = !!finisher1 && !!finisher2;
  const activeRemaining = gameState.players.filter((p) => !p.isFinished);

  const canPlaceBet = isFinisher && bothFinishersExist && activeRemaining.length >= 2;

  // Case 1: Active Bet is locked in and rolling!
  if (activeSideBet && activeSideBet.status === 'ACTIVE') {
    return (
      <div
        onClick={() => setSideBetModalOpen(true)}
        className={cn(
          'fixed z-[120] cursor-pointer group animate-in fade-in slide-in-from-top-3 duration-300',
          isLandscapeMobile
            ? 'top-1.5 sm:top-2 left-1/2 -translate-x-1/2 max-w-[94vw]'
            : 'top-16 sm:top-20 left-1/2 -translate-x-1/2'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 rounded-2xl bg-black/85 backdrop-blur-md border border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.4)] group-hover:border-amber-300 transition-all group-hover:scale-102',
            isLandscapeMobile ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs'
          )}
        >
          <img
            src="/icons/casino-chip.png"
            alt="M Coin"
            className={cn('object-contain filter drop-shadow animate-pulse', isLandscapeMobile ? 'w-4 h-4' : 'w-5 h-5')}
          />

          <div className="flex items-center gap-1.5 xs:gap-2">
            <span className="font-black text-amber-300 uppercase tracking-wider text-[10px] xs:text-[11px] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Side Bet:</span>
            </span>

            <span className="text-white font-bold hidden xs:inline text-[11px]">
              <span className="text-amber-200">{activeSideBet.initiatorName}</span> ({activeSideBet.initiatorTargetName}) vs{' '}
              <span className="text-amber-200">{activeSideBet.challengerName}</span> ({activeSideBet.challengerTargetName})
            </span>

            <span className="px-1.5 xs:px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-black border border-amber-400/40 text-[10px] xs:text-[11px]">
              {activeSideBet.pot.toLocaleString()} M Coins Pot
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: A Bet is PROPOSED
  if (activeSideBet && activeSideBet.status === 'PROPOSED') {
    const isChallenger = activeSideBet.challengerId === myPlayerId;
    const isInitiator = activeSideBet.initiatorId === myPlayerId;

    if (isChallenger) {
      return (
        <div
          onClick={() => setSideBetModalOpen(true)}
          className={cn(
            'fixed z-[130] cursor-pointer group animate-bounce',
            isLandscapeMobile
              ? 'top-1.5 sm:top-2 left-1/2 -translate-x-1/2'
              : 'bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black uppercase tracking-wider shadow-[0_0_30px_rgba(225,29,72,0.6)] border-2 border-amber-300',
              isLandscapeMobile ? 'px-3 py-1.5 text-xs' : 'px-4 sm:px-5 py-2.5 text-xs sm:text-sm'
            )}
          >
            <img
              src="/icons/casino-chip.png"
              alt="M Coin"
              className={cn('object-contain filter drop-shadow animate-spin', isLandscapeMobile ? 'w-4 h-4' : 'w-6 h-6')}
            />
            <div className="flex flex-col text-left">
              <span className="text-[9.5px] xs:text-[10px] text-amber-200 font-sans normal-case font-bold leading-tight">
                {activeSideBet.initiatorName} bet {activeSideBet.amount.toLocaleString()} M Coins!
              </span>
              <span className="flex items-center gap-1">
                <span>Match Bet &amp; Pick Winner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (isInitiator) {
      return (
        <div
          onClick={() => setSideBetModalOpen(true)}
          className={cn(
            'fixed z-[120] cursor-pointer group',
            isLandscapeMobile
              ? 'top-1.5 sm:top-2 left-1/2 -translate-x-1/2'
              : 'bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-2 rounded-2xl bg-black/85 backdrop-blur-md border border-amber-400/60 shadow-md',
              isLandscapeMobile ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 py-1.5 text-xs'
            )}
          >
            <img src="/icons/casino-chip.png" alt="M Coin" className="w-4 h-4 object-contain" />
            <span className="text-zinc-300">
              Waiting for <strong className="text-amber-300">{activeSideBet.challengerName}</strong> to match your{' '}
              <strong className="text-amber-400">{activeSideBet.amount} M Coin</strong> bet...
            </span>
          </div>
        </div>
      );
    }
  }

  // Case 3: Both 1st and 2nd place finished, but no bet placed yet
  if (canPlaceBet) {
    return (
      <div
        className={cn(
          'fixed z-[120]',
          isLandscapeMobile ? 'bottom-2.5 right-2 sm:bottom-3 sm:right-3' : 'bottom-20 sm:bottom-24 right-4 sm:right-6'
        )}
      >
        <button
          type="button"
          onClick={() => setSideBetModalOpen(true)}
          className={cn(
            'flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black font-black uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] border border-amber-200 cursor-pointer active:scale-95 transition-all group touch-manipulation animate-pulse',
            isLandscapeMobile ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs'
          )}
        >
          <img
            src="/icons/casino-chip.png"
            alt="M Coin"
            className={cn('object-contain filter drop-shadow group-hover:rotate-12 transition-transform', isLandscapeMobile ? 'w-4 h-4' : 'w-5 h-5')}
          />
          <div className="flex flex-col text-left leading-tight">
            <span className="text-[8.5px] xs:text-[9px] font-bold text-black/70">1st vs 2nd Finisher</span>
            <span className="flex items-center gap-1 font-mono font-black text-[10.5px] sm:text-xs">
              <Flame className="w-3 h-3 xs:w-3.5 xs:h-3.5 fill-black" />
              <span>Bet M Coins</span>
            </span>
          </div>
        </button>
      </div>
    );
  }

  return null;
};
