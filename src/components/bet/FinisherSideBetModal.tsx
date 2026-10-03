'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useMStore } from '@/store/mStore';
import { useViewportOrientation } from '@/hooks/useViewportOrientation';
import { cn } from '@/lib/utils';
import { X, Crown, Flame, Trophy, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { sounds } from '@/lib/sound';

export const FinisherSideBetModal: React.FC = () => {
  const {
    gameState,
    activeSideBet,
    isSideBetModalOpen,
    setSideBetModalOpen,
    proposeSideBet,
    acceptSideBet,
    declineSideBet,
  } = useGameStore();

  const { mCoins } = useMStore();
  const { isLandscape, isMobile, viewportHeight } = useViewportOrientation();
  const isLandscapeMobile = isLandscape && (viewportHeight <= 520 || isMobile);

  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isSideBetModalOpen || !gameState) return null;

  const myPlayerId = gameState.myPlayerId;

  // 1st and 2nd place finishers
  const finisher1 = gameState.players.find((p) => p.isFinished && p.rank === 1);
  const finisher2 = gameState.players.find((p) => p.isFinished && p.rank === 2);

  // Active playing players who can be bet on (remaining 2 or 3)
  const activeRemainingPlayers = gameState.players.filter((p) => !p.isFinished);

  const isInitiator = activeSideBet?.initiatorId === myPlayerId;
  const isChallenger = activeSideBet?.challengerId === myPlayerId;
  const isBetProposed = activeSideBet?.status === 'PROPOSED';
  const isBetActive = activeSideBet?.status === 'ACTIVE';

  const handlePropose = async () => {
    if (!selectedTargetId) {
      setErrorMsg('Please select a remaining player to back!');
      return;
    }
    if (betAmount < 10) {
      setErrorMsg('Minimum bet is 10 M Coins.');
      return;
    }
    if (mCoins < betAmount) {
      setErrorMsg(`Insufficient M Coins! Your balance: ${mCoins.toLocaleString()} M Coins.`);
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    sounds.playCoinJingle();
    const res = await proposeSideBet(selectedTargetId, betAmount);
    setIsSubmitting(false);
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleAccept = async () => {
    if (!selectedTargetId) {
      setErrorMsg('Please select which remaining player you back!');
      return;
    }
    if (!activeSideBet) return;
    if (mCoins < activeSideBet.amount) {
      setErrorMsg(`Insufficient M Coins! You need ${activeSideBet.amount.toLocaleString()} M Coins to match.`);
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    sounds.playCoinJingle();
    const res = await acceptSideBet(selectedTargetId);
    setIsSubmitting(false);
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    await declineSideBet();
    setIsSubmitting(false);
  };

  const quickAmounts = [50, 100, 250, 500, 1000];

  return (
    <div
      onClick={() => setSideBetModalOpen(false)}
      className="fixed inset-0 z-[180] flex items-center justify-center p-2.5 xs:p-3 sm:p-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 select-none overflow-y-auto touch-manipulation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-lg bg-gradient-to-b from-[#1c080f] via-[#100509] to-[#040102] border-2 sm:border-3 border-amber-500/60 rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.3)] overflow-hidden flex flex-col my-auto transition-all',
          isLandscapeMobile ? 'max-h-[96dvh]' : 'max-h-[92dvh]'
        )}
      >
        {/* Top Shimmer Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-400 to-rose-600 shrink-0" />

        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b border-white/10 shrink-0 bg-black/40',
            isLandscapeMobile ? 'p-2.5 px-3.5' : 'p-3.5 sm:p-5'
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'rounded-xl bg-gradient-to-tr from-amber-600 to-red-600 p-0.5 shadow-md flex items-center justify-center shrink-0',
                isLandscapeMobile ? 'w-8 h-8' : 'w-10 h-10 sm:w-11 sm:h-11'
              )}
            >
              <div className="w-full h-full rounded-xl bg-black/80 flex items-center justify-center">
                <img
                  src="/icons/casino-chip.png"
                  alt="M Coin"
                  className={cn('object-contain filter drop-shadow', isLandscapeMobile ? 'w-5 h-5' : 'w-6 h-6 sm:w-7 sm:h-7')}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 xs:gap-2">
                <h3 className={cn('font-black text-white font-serif tracking-wider uppercase', isLandscapeMobile ? 'text-sm' : 'text-base sm:text-lg')}>
                  Finisher Side Bet
                </h3>
                <span className="px-1.5 py-0.2 rounded-full text-[8.5px] xs:text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  1st vs 2nd
                </span>
              </div>
              <p className={cn('text-zinc-400', isLandscapeMobile ? 'text-[10px]' : 'text-[11px] sm:text-xs')}>
                Bet M Coins on who among remaining players will win!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSideBetModalOpen(false)}
            className="p-1 sm:p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          className={cn(
            'flex-1 overflow-y-auto overscroll-contain space-y-3 sm:space-y-4',
            isLandscapeMobile ? 'p-3' : 'p-3.5 sm:p-5'
          )}
        >
          {/* Head-to-Head Bettor Matchup Card */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between gap-2">
            {/* 1st Place Finisher */}
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm border border-amber-400/70"
                style={{ backgroundColor: finisher1?.avatarColor || '#e11d48' }}
              >
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center shadow">
                  <Crown className="w-2 h-2 text-black" />
                </div>
                <span>{finisher1?.name.slice(0, 2).toUpperCase() || '#1'}</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-400">#1 Winner</span>
                  {finisher1?.id === myPlayerId && (
                    <span className="text-[8.5px] font-bold px-1 rounded bg-amber-500/20 text-amber-300">YOU</span>
                  )}
                </div>
                <p className="font-bold text-xs text-white truncate">{finisher1?.name || '1st Place'}</p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-600/30 text-red-200 border border-red-500/40 shrink-0">
              VS
            </span>

            {/* 2nd Place Finisher */}
            <div className="flex items-center gap-2 min-w-0 text-right justify-end">
              <div className="min-w-0">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-zinc-300">#2 Runner-Up</span>
                  {finisher2?.id === myPlayerId && (
                    <span className="text-[8.5px] font-bold px-1 rounded bg-amber-500/20 text-amber-300">YOU</span>
                  )}
                </div>
                <p className="font-bold text-xs text-white truncate">{finisher2?.name || '2nd Place'}</p>
              </div>
              <div
                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm border border-zinc-400/70"
                style={{ backgroundColor: finisher2?.avatarColor || '#3b82f6' }}
              >
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-zinc-300 flex items-center justify-center shadow">
                  <Trophy className="w-2 h-2 text-black" />
                </div>
                <span>{finisher2?.name.slice(0, 2).toUpperCase() || '#2'}</span>
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-2 sm:p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================= CASE 1: ACTIVE BET IN PROGRESS ================= */}
          {isBetActive && activeSideBet && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-red-950/60 via-zinc-950 to-black border border-amber-400/60 text-center space-y-2.5 sm:space-y-3 shadow-md">
              <div className="flex items-center justify-center gap-1.5 text-amber-300 text-xs font-black uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Side Bet Active &amp; Locked in Pot!</span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center gap-2">
                <img src="/icons/casino-chip.png" alt="M Coin" className="w-5 h-5 sm:w-6 sm:h-6 object-contain filter drop-shadow" />
                <span className="font-mono font-black text-xl sm:text-2xl text-amber-400">{activeSideBet.pot.toLocaleString()}</span>
                <span className="text-[11px] sm:text-xs text-zinc-300 font-bold uppercase tracking-wider">M Coins Pot</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[9.5px] text-zinc-400 uppercase font-bold block">{activeSideBet.initiatorName}</span>
                  <span className="font-bold text-emerald-400 text-xs">Backed: {activeSideBet.initiatorTargetName}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[9.5px] text-zinc-400 uppercase font-bold block">{activeSideBet.challengerName}</span>
                  <span className="font-bold text-emerald-400 text-xs">Backed: {activeSideBet.challengerTargetName}</span>
                </div>
              </div>

              <p className="text-[10px] sm:text-[11px] text-zinc-400 italic">
                Watching live table... The bet automatically resolves and credits the full pot to the winner!
              </p>
            </div>
          )}

          {/* ================= CASE 2: INITIATOR WAITING FOR CHALLENGER ================= */}
          {!isBetActive && isBetProposed && isInitiator && activeSideBet && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-amber-500/40 text-center space-y-2.5 sm:space-y-3">
              <div className="inline-block p-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse">
                <img src="/icons/casino-chip.png" alt="M Coin" className="w-5 h-5 object-contain" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-white">Bet Proposal Sent!</h4>
              <p className="text-xs text-zinc-300">
                You proposed a <strong className="text-amber-300">{activeSideBet.amount.toLocaleString()} M Coin</strong> bet backing{' '}
                <strong className="text-emerald-400">{activeSideBet.initiatorTargetName}</strong>.
              </p>
              <p className="text-[10.5px] text-zinc-400">
                Waiting for {activeSideBet.challengerName} to match the bet...
              </p>
              <button
                type="button"
                onClick={handleDecline}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel Proposal
              </button>
            </div>
          )}

          {/* ================= CASE 3: CHALLENGER RECEIVING PROPOSAL ================= */}
          {!isBetActive && isBetProposed && isChallenger && activeSideBet && (
            <div className="space-y-3 sm:space-y-4">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/60 to-black border border-amber-400/50 space-y-1">
                <span className="text-[9.5px] uppercase font-bold text-amber-400 tracking-wider">Incoming Bet Challenge!</span>
                <p className="text-xs text-zinc-200">
                  <strong className="text-white">{activeSideBet.initiatorName}</strong> has placed a{' '}
                  <strong className="text-amber-300 font-mono">{activeSideBet.amount.toLocaleString()} M Coin</strong> bet backing{' '}
                  <strong className="text-emerald-400">{activeSideBet.initiatorTargetName}</strong> to win!
                </p>
              </div>

              {/* Pick remaining player */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                  <span>Pick your remaining player:</span>
                  <span className="text-[10px] text-amber-400 font-mono">Match: {activeSideBet.amount} M Coins</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeRemainingPlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => setSelectedTargetId(player.id)}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5',
                        selectedTargetId === player.id
                          ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          : 'bg-black/50 border-white/10 hover:border-white/30'
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-white text-[10px] shrink-0 shadow-sm"
                          style={{ backgroundColor: player.avatarColor }}
                        >
                          {player.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-xs text-white truncate">{player.name}</span>
                      </div>

                      <div className="flex items-center justify-between text-[9.5px]">
                        <span className="text-zinc-400">{player.cardsCount ?? player.hiddenCount} cards left</span>
                        {selectedTargetId === player.id && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accept / Decline */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={isSubmitting}
                  className="flex-1 py-2 sm:py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Decline
                </button>

                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={isSubmitting || !selectedTargetId}
                  className={cn(
                    'flex-[2] py-2 sm:py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                    selectedTargetId && mCoins >= activeSideBet.amount
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  )}
                >
                  <span>Accept ({activeSideBet.amount} M Coins)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ================= CASE 4: FRESH BET CREATION ================= */}
          {!isBetActive && !isBetProposed && (
            <div className="space-y-3 sm:space-y-4">
              {/* Step 1: Select which active player will win */}
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                  1. Select the player you bet will win:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeRemainingPlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => setSelectedTargetId(player.id)}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5',
                        selectedTargetId === player.id
                          ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          : 'bg-black/50 border-white/10 hover:border-white/30'
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-white text-[10px] shrink-0 shadow-sm"
                          style={{ backgroundColor: player.avatarColor }}
                        >
                          {player.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-xs text-white truncate">{player.name}</span>
                      </div>

                      <div className="flex items-center justify-between text-[9.5px]">
                        <span className="text-zinc-400">{player.cardsCount ?? player.hiddenCount} cards</span>
                        {selectedTargetId === player.id && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Choose Bet Amount in M Coins */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-300">
                    2. Choose M Coins Bet Amount:
                  </label>
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-zinc-400">
                    <span>Balance:</span>
                    <img src="/icons/casino-chip.png" alt="Chip" className="w-3.5 h-3.5 object-contain" />
                    <span className="font-mono font-bold text-amber-300">{mCoins.toLocaleString()}</span>
                  </div>
                </div>

                {/* Quick Chip Preset Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBetAmount(amt)}
                      className={cn(
                        'px-2.5 py-1 rounded-xl font-mono font-bold text-xs transition-all cursor-pointer border',
                        betAmount === amt
                          ? 'bg-amber-500 text-black border-amber-300 shadow-sm'
                          : 'bg-black/50 text-zinc-300 border-white/10 hover:border-white/30'
                      )}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>

                {/* Custom Input */}
                <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-black/60 border border-white/15">
                  <img src="/icons/casino-chip.png" alt="M Coin" className="w-4 h-4 sm:w-5 sm:h-5 object-contain filter drop-shadow shrink-0" />
                  <input
                    type="number"
                    min="10"
                    max={mCoins}
                    value={betAmount || ''}
                    onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Enter M Coins amount"
                    className="w-full bg-transparent text-white font-mono font-black text-xs sm:text-sm outline-none"
                  />
                  <span className="text-[11px] sm:text-xs text-amber-400 font-bold shrink-0">M Coins</span>
                </div>
              </div>

              {/* Total Pot preview */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                <span className="text-zinc-400 text-[11px]">Total Pot (Both Match):</span>
                <div className="font-mono font-bold text-amber-300 flex items-center gap-1">
                  <img src="/icons/casino-chip.png" alt="Chip" className="w-3.5 h-3.5 object-contain" />
                  <span>{(betAmount * 2).toLocaleString()} M Coins</span>
                </div>
              </div>

              {/* Submit Propose Button */}
              <button
                type="button"
                onClick={handlePropose}
                disabled={isSubmitting || !selectedTargetId || betAmount < 10 || mCoins < betAmount}
                className={cn(
                  'w-full py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer border',
                  selectedTargetId && betAmount >= 10 && mCoins >= betAmount
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                    : 'bg-zinc-850 text-zinc-500 cursor-not-allowed border-zinc-700'
                )}
              >
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Propose Side Bet ({betAmount} M Coins)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
