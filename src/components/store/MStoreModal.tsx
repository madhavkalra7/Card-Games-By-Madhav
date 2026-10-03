'use client';

import React, { useState, useEffect } from 'react';
import { useMStore } from '@/store/mStore';
import { M_COIN_PACKS, DailyStoreCard } from '@/lib/mStoreTypes';
import { PlayingCard } from '@/components/card/PlayingCard';
import { cn } from '@/lib/utils';
import { useViewportOrientation } from '@/hooks/useViewportOrientation';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  Crown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShoppingBag,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

export const MStoreModal: React.FC = () => {
  const {
    isOpen,
    setOpen,
    activeTab,
    setActiveTab,
    mCoins,
    dailyCards,
    buyCard,
    isCardOwned,
    selectedPackForShowcase,
    setSelectedPackForShowcase,
    inspectingCard,
    setInspectingCard,
  } = useMStore();

  const { isLandscape, isMobile, viewportHeight } = useViewportOrientation();
  const isLandscapeMobile = isLandscape && (viewportHeight <= 520 || isMobile);

  // Daily reset countdown timer
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [purchaseToast, setPurchaseToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = tomorrow.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds
          .toString()
          .padStart(2, '0')}s`
      );
    }
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const handleBuyCardAction = (card: DailyStoreCard) => {
    const res = buyCard(card);
    setPurchaseToast({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });
    if (res.success) {
      try {
        confetti({
          particleCount: 80,
          spread: 85,
          origin: { y: 0.6 },
        });
      } catch {}
    }
    setTimeout(() => {
      setPurchaseToast(null);
    }, 4000);
  };

  const goldenJoker = dailyCards[0];
  const rotatingCards = dailyCards.slice(1);

  // Helper to render authentic casino chip stacks for each pack
  const renderChipStack = (count: 1 | 2 | 3 | 4) => {
    return (
      <div className="relative h-12 w-14 flex items-center justify-center">
        {Array.from({ length: count }).map((_, idx) => (
          <img
            key={`chip-${idx}`}
            src="/icons/casino-chip.png"
            alt="M Coin Chip"
            className="absolute w-9 h-9 sm:w-10 sm:h-10 object-contain filter drop-shadow-md transition-transform group-hover:scale-105"
            style={{
              left: `${idx * 6}px`,
              top: `${(count - 1 - idx) * 3}px`,
              zIndex: idx + 1,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 select-none overflow-y-auto"
    >
      {/* Modal Dialog Card - Matched with Home Screen Ruby & Obsidian Casino Theme */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-4xl bg-gradient-to-b from-[#18080d] via-[#0d0407] to-[#040102] border-2 sm:border-3 border-red-500/50 rounded-2xl sm:rounded-3xl shadow-[0_0_80px_rgba(225,29,72,0.35)] overflow-hidden flex flex-col',
          isLandscapeMobile ? 'max-h-[96dvh] my-1' : 'max-h-[92dvh]'
        )}
      >
        {/* Luxury Ruby & Gold Shimmer Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-700 via-amber-500 to-red-700 shadow-md" />

        {/* Ambient background glow accents */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-red-600/15 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-amber-600/15 blur-3xl pointer-events-none rounded-full" />

        {/* ================= HEADER ================= */}
        <div
          className={cn(
            'relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 shrink-0 bg-black/50',
            isLandscapeMobile ? 'p-2.5 px-4' : 'p-3.5 sm:p-5'
          )}
        >
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-red-700 via-rose-600 to-amber-400 p-0.5 shadow-[0_0_20px_rgba(225,29,72,0.4)] flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-2xl bg-black/85 p-1 flex items-center justify-center">
                <img
                  src="/icons/casino-chip.png"
                  alt="M Store Chip"
                  className="w-full h-full object-contain filter drop-shadow animate-pulse"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-xl text-white uppercase tracking-wider font-serif">
                  M Store
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">
                  Exclusive Vault
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Official M Coins &amp; Daily Collector Cards
              </p>
            </div>
          </div>

          {/* Right Controls: Balance + Close */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            {/* Player M Coins Balance Display */}
            <div
              onClick={() => setActiveTab('coins')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-950/70 via-black/80 to-zinc-950/80 border border-red-500/50 cursor-pointer hover:border-red-400 transition-all shadow-sm group"
              title="Your M Coins Balance"
            >
              <img
                src="/icons/casino-chip.png"
                alt="Coins"
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain filter drop-shadow group-hover:scale-110 transition-transform"
              />
              <div className="flex flex-col text-left">
                <span className="text-[8px] font-bold uppercase tracking-wider text-red-300/80">
                  Balance
                </span>
                <span className="font-mono font-black text-xs sm:text-sm text-white group-hover:text-amber-300 transition-colors">
                  {mCoins.toLocaleString()} <span className="text-[10px] text-red-300 font-sans font-bold">Chips</span>
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= TABS NAVIGATION ================= */}
        <div className="flex items-center gap-2 px-3.5 sm:px-6 py-2.5 border-b border-white/10 bg-black/60 shrink-0">
          {/* Tab 1: Buy M Coins */}
          <button
            type="button"
            onClick={() => setActiveTab('coins')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer border',
              activeTab === 'coins'
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.45)] border-amber-300/50 scale-102'
                : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border-white/5'
            )}
          >
            <img src="/icons/casino-chip.png" alt="M Coin" className="w-4 h-4 object-contain inline-block" />
            <span>Buy M Coins</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-black/40 text-amber-200">
              ₹ INR
            </span>
          </button>

          {/* Tab 2: Buy Cards */}
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer border',
              activeTab === 'cards'
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.45)] border-amber-300/50 scale-102'
                : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border-white/5'
            )}
          >
            <span>🃏 Daily Cards</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
              7 Available
            </span>
          </button>
        </div>

        {/* Toast Notification Banner */}
        {purchaseToast && (
          <div
            className={cn(
              'px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-all animate-in fade-in slide-in-from-top-2 shrink-0 border-b',
              purchaseToast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
                : 'bg-red-950/90 text-red-200 border-red-500/40'
            )}
          >
            {purchaseToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{purchaseToast.message}</span>
          </div>
        )}

        {/* ================= TAB CONTENT BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ================= TAB 1: BUY M COINS ================= */}
          {activeTab === 'coins' && (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {M_COIN_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  onClick={() => setSelectedPackForShowcase(pack)}
                  className={cn(
                    'relative p-5 rounded-2xl sm:rounded-3xl border-2 transition-all flex flex-col justify-between gap-5 cursor-pointer group bg-gradient-to-b hover:scale-102 active:scale-98',
                    pack.gradient,
                    pack.borderGlow
                  )}
                >
                  {/* Top Badge + Authentic Chip Stack */}
                  <div className="flex items-center justify-between">
                    {pack.badge ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/25 text-red-300 border border-red-500/40">
                        {pack.badge}
                      </span>
                    ) : <span />}
                    {renderChipStack(pack.chipCount)}
                  </div>

                  {/* Coins Count */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono font-black text-2xl sm:text-3xl text-white">
                        {pack.coins.toLocaleString()}
                      </span>
                      <span className="text-xs text-amber-400 font-sans font-bold">M Coins</span>
                    </div>
                  </div>

                  {/* Price Button */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="font-mono font-black text-xl text-emerald-400">
                      ₹{pack.priceRupees}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPackForShowcase(pack);
                      }}
                      className="px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md transition-all flex items-center gap-1 border border-red-400/40"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Buy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================= TAB 2: BUY CARDS ================= */}
          {activeTab === 'cards' && (
            <div className="space-y-6">
              {/* Daily Reset Countdown Bar */}
              <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-black/60 border border-red-500/30">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
                    Daily Card Vault
                  </span>
                  <span className="text-[10px] text-zinc-400 hidden sm:inline">• Resets at 00:00 IST</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm text-amber-300 bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-500/30">
                  <span className="text-[10px] text-zinc-400 uppercase font-sans font-semibold">Resets in:</span>
                  <span>{timeLeft}</span>
                </div>
              </div>

              {/* 1. FEATURED FIXED CARD: 24K SOLID GOLD JOKER (10,000 M COINS) */}
              <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#281504] via-[#160c02] to-[#070301] border-2 sm:border-3 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.35)] overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Left: Real Gold Card Visual */}
                  <div className="relative flex items-center justify-center group shrink-0">
                    <div className="relative transform group-hover:scale-105 transition-transform duration-300">
                      <PlayingCard
                        card={goldenJoker.card}
                        size="lg"
                        glow={true}
                      />

                      {/* Floating Crown Stamp */}
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg border border-amber-200">
                        <Crown className="w-4 h-4 text-black" />
                      </div>
                    </div>
                  </div>

                  {/* Center: Info */}
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/50">
                        👑 24K Solid Gold
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-600/30 text-red-200 border border-red-500/40">
                        Permanent Master Edition
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-amber-300 uppercase tracking-wider font-serif">
                      {goldenJoker.name}
                    </h2>

                    <p className="text-xs sm:text-sm text-zinc-300 max-w-lg leading-relaxed">
                      {goldenJoker.lore}
                    </p>
                  </div>

                  {/* Right: Buy Controls */}
                  <div className="flex flex-col items-center md:items-end gap-2.5 shrink-0 w-full md:w-auto">
                    <div className="font-mono font-black text-2xl sm:text-3xl text-white flex items-center gap-1.5">
                      <img
                        src="/icons/casino-chip.png"
                        alt="M Coin"
                        className="w-7 h-7 object-contain filter drop-shadow shrink-0"
                      />
                      <span>10,000</span>
                      <span className="text-xs font-sans font-bold text-amber-400">M Coins</span>
                    </div>

                    {isCardOwned(goldenJoker.id) ? (
                      <div className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>In Your Collection</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBuyCardAction(goldenJoker)}
                        className={cn(
                          'w-full md:w-auto px-6 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer border',
                          mCoins >= goldenJoker.priceCoins
                            ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black border-amber-200'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-750'
                        )}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          {mCoins >= goldenJoker.priceCoins ? 'Buy 24K Joker' : 'Need More M Coins'}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInspectingCard(goldenJoker)}
                      className="text-xs text-amber-300/80 hover:text-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect 3D Art</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. THE 6 ROTATING DAILY CARDS */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>6 Daily Rotation Cards</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {rotatingCards.map((item) => {
                    const owned = isCardOwned(item.id);
                    const canAfford = mCoins >= item.priceCoins;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'relative p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 bg-gradient-to-b shadow-md group hover:border-red-400/80',
                          item.gradient,
                          owned ? 'border-emerald-500/50' : 'border-white/10'
                        )}
                      >
                        {/* Card Visual */}
                        <div className="shrink-0 transform group-hover:scale-105 transition-transform">
                          <PlayingCard
                            card={item.card}
                            size="xs"
                          />
                        </div>

                        {/* Card Info & Actions */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full gap-2">
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border"
                                style={{
                                  backgroundColor: `${item.glowColor}25`,
                                  borderColor: `${item.glowColor}60`,
                                  color: item.glowColor,
                                }}
                              >
                                {item.rarity}
                              </span>

                              <button
                                type="button"
                                onClick={() => setInspectingCard(item)}
                                className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                                title="Inspect Card"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <h4 className="font-bold text-xs sm:text-sm text-white truncate mt-1">
                              {item.name}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-white/10">
                            <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm text-white">
                              <img
                                src="/icons/casino-chip.png"
                                alt="M Coin"
                                className="w-3.5 h-3.5 object-contain filter drop-shadow shrink-0"
                              />
                              <span>{item.priceCoins.toLocaleString()}</span>
                            </div>

                            {owned ? (
                              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase flex items-center gap-1 border border-emerald-500/40">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Owned</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleBuyCardAction(item)}
                                className={cn(
                                  'px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95 cursor-pointer border',
                                  canAfford
                                    ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md border-amber-300/30 hover:scale-102'
                                    : 'bg-zinc-850 text-zinc-500 border-zinc-700'
                                )}
                              >
                                <span>Buy</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div
          className={cn(
            'border-t border-white/10 flex items-center justify-between bg-black/70 shrink-0',
            isLandscapeMobile ? 'p-2.5 px-4' : 'p-3 sm:p-4'
          )}
        >
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] hidden xs:inline">
              Card Games By Madhav Vault
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Close Store
          </button>
        </div>
      </div>

      {/* ================= PACK PAYMENT MODAL ================= */}
      {selectedPackForShowcase && (
        <div
          onClick={() => setSelectedPackForShowcase(null)}
          className="fixed inset-0 z-[170] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#1a080e] to-black border-2 border-red-500/60 text-center shadow-2xl overflow-y-auto my-auto',
              isLandscapeMobile ? 'max-h-[96dvh] p-3.5 space-y-2.5' : 'max-h-[92dvh] p-6 space-y-4'
            )}
          >
            <div className="flex justify-center pt-1">
              <img
                src="/icons/casino-chip.png"
                alt="Casino Chip"
                className={cn('object-contain filter drop-shadow-lg', isLandscapeMobile ? 'w-10 h-10' : 'w-16 h-16')}
              />
            </div>

            <div className="space-y-0.5">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/25 text-red-300 border border-red-500/40">
                {selectedPackForShowcase.badge || 'Coin Pack'}
              </span>
              <h3 className={cn('font-black text-white font-mono flex items-center justify-center gap-1.5', isLandscapeMobile ? 'text-xl' : 'text-2xl')}>
                <span>{selectedPackForShowcase.coins.toLocaleString()}</span>
                <span className="text-xs text-red-300 font-sans font-bold">M Coins</span>
              </h3>
            </div>

            {/* Price Tag */}
            <div className={cn('rounded-2xl bg-black/70 border border-white/10', isLandscapeMobile ? 'p-2' : 'p-3.5')}>
              <span className={cn('font-mono font-black text-emerald-400', isLandscapeMobile ? 'text-2xl' : 'text-3xl')}>
                ₹{selectedPackForShowcase.priceRupees} <span className="text-xs text-zinc-400 font-sans">INR</span>
              </span>
            </div>

            {/* Clean Status Note (No "Demo" word, no chaos) */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
              Online checkout (UPI, QR &amp; Cards) is opening soon in the next update!
            </div>

            <button
              type="button"
              onClick={() => setSelectedPackForShowcase(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.4)] active:scale-95 transition-all cursor-pointer border border-amber-300/40"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ================= 3D CARD INSPECTOR MODAL ================= */}
      {inspectingCard && (
        <div
          onClick={() => setInspectingCard(null)}
          className="fixed inset-0 z-[170] flex items-center justify-center p-2.5 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#18080d] to-black border-2 border-red-500/70 text-center shadow-2xl flex flex-col items-center my-auto overflow-y-auto',
              isLandscapeMobile ? 'max-h-[96dvh] p-3.5 space-y-2' : 'max-h-[92dvh] p-6 space-y-4'
            )}
          >
            <button
              type="button"
              onClick={() => setInspectingCard(null)}
              className="absolute top-3 right-3 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Rarity & Title */}
            <div className="space-y-0.5">
              <span
                className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow"
                style={{
                  backgroundColor: `${inspectingCard.glowColor}25`,
                  borderColor: `${inspectingCard.glowColor}60`,
                  color: inspectingCard.glowColor,
                }}
              >
                {inspectingCard.rarity}
              </span>
              <h3 className={cn('font-black text-white font-serif', isLandscapeMobile ? 'text-lg' : 'text-xl')}>
                {inspectingCard.name}
              </h3>
            </div>

            {/* Big Card Rendering */}
            <div className={cn('transform hover:scale-105 transition-transform duration-300', isLandscapeMobile ? 'py-1' : 'py-2')}>
              <PlayingCard
                card={inspectingCard.card}
                size={isLandscapeMobile ? 'md' : 'lg'}
                glow={true}
              />
            </div>

            {/* Price & Action */}
            <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase font-bold text-zinc-500">Price</span>
                <div className="flex items-center gap-1 font-mono font-black text-base text-white">
                  <img
                    src="/icons/casino-chip.png"
                    alt="M Coin"
                    className="w-4 h-4 object-contain filter drop-shadow shrink-0"
                  />
                  <span>{inspectingCard.priceCoins.toLocaleString()}</span>
                </div>
              </div>

              {isCardOwned(inspectingCard.id) ? (
                <span className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase border border-emerald-500/40">
                  ✓ Owned
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleBuyCardAction(inspectingCard);
                    setInspectingCard(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.4)] active:scale-95 transition-all cursor-pointer border border-amber-300/40"
                >
                  Buy Card
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
