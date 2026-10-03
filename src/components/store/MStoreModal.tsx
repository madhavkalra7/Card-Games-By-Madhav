'use client';

import React, { useState, useEffect } from 'react';
import { useMStore } from '@/store/mStore';
import { M_COIN_PACKS, CoinPack, DailyStoreCard } from '@/lib/mStoreTypes';
import { PlayingCard } from '@/components/card/PlayingCard';
import { sounds } from '@/lib/sound';
import { cn } from '@/lib/utils';
import { useViewportOrientation } from '@/hooks/useViewportOrientation';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  Crown,
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Info,
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
          particleCount: 75,
          spread: 80,
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

  return (
    <div
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 select-none overflow-y-auto"
    >
      {/* Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-5xl bg-gradient-to-b from-[#120f09] via-zinc-950 to-black border-2 sm:border-4 border-amber-500/70 rounded-2xl sm:rounded-3xl shadow-[0_0_80px_rgba(217,119,6,0.35)] overflow-hidden flex flex-col',
          isLandscapeMobile ? 'max-h-[96dvh] my-1' : 'max-h-[92dvh]'
        )}
      >
        {/* Luxury Gold Shimmer Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 shadow-md" />

        {/* ================= HEADER ================= */}
        <div
          className={cn(
            'relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 shrink-0 bg-black/40',
            isLandscapeMobile ? 'p-2.5 px-4' : 'p-3.5 sm:p-5'
          )}
        >
          {/* Brand & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-0.5 shadow-gold-glow flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-2xl bg-black/85 flex items-center justify-center">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-xl text-white uppercase tracking-wider font-serif">
                  M Store
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Emporium
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Official digital coin packs, 24K Golden Joker & daily rotating cards
              </p>
            </div>
          </div>

          {/* Right Controls: Balance + Close */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            {/* Player M Coins Balance Display */}
            <div
              onClick={() => setActiveTab('coins')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-400/50 cursor-pointer hover:border-amber-300 transition-all shadow-sm group"
              title="Your M Coins Balance (Click to view Coin Packs)"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black text-xs shadow">
                M
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold uppercase tracking-wider text-amber-300/80">
                  Your Balance
                </span>
                <span className="font-mono font-black text-xs sm:text-sm text-yellow-300 group-hover:text-white transition-colors">
                  {mCoins.toLocaleString()} M Coins
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
        <div className="flex items-center gap-2 px-3.5 sm:px-6 py-2.5 border-b border-white/10 bg-zinc-950/80 shrink-0">
          {/* Tab 1: Buy M Coins */}
          <button
            type="button"
            onClick={() => setActiveTab('coins')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer',
              activeTab === 'coins'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow scale-102'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850 border border-white/5'
            )}
          >
            <span>🪙 Buy M Coins</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-black/25">
              INR ₹
            </span>
          </button>

          {/* Tab 2: Buy Cards */}
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer',
              activeTab === 'cards'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow scale-102'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850 border border-white/5'
            )}
          >
            <span>🃏 Buy Cards</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              7 Daily
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
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-5">
          {/* ================= TAB 1: BUY M COINS ================= */}
          {activeTab === 'coins' && (
            <div className="space-y-4">
              {/* Showcase Mode Informational Banner */}
              <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200/90 shadow-sm">
                <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-white">
                    Showcase Mode Active (Demo Rupee Prices)
                  </p>
                  <p className="text-[11px] text-zinc-300">
                    Real payment integration (UPI, QR & Cards) is currently in showcase preview mode. Clicking any pack displays the showcase package details without deducting real money.
                  </p>
                </div>
              </div>

              {/* Grid of the 4 requested coin packs */}
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {M_COIN_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPackForShowcase(pack)}
                    className={cn(
                      'relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all flex flex-col justify-between gap-4 cursor-pointer group bg-gradient-to-b shadow-lg hover:scale-102 active:scale-98',
                      pack.gradient,
                      pack.borderGlow
                    )}
                  >
                    {/* Top Badge */}
                    <div className="flex items-center justify-between">
                      {pack.badge ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-300 border border-amber-400/50">
                          {pack.badge}
                        </span>
                      ) : <span />}
                      <span className="text-2xl group-hover:scale-110 transition-transform">
                        {pack.icon}
                      </span>
                    </div>

                    {/* Middle Info */}
                    <div className="space-y-1">
                      <h3 className="font-mono font-black text-xl sm:text-2xl text-white">
                        {pack.coins.toLocaleString()}
                        <span className="text-xs text-amber-400 font-sans font-bold ml-1">M Coins</span>
                      </h3>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        {pack.tagline}
                      </p>
                    </div>

                    {/* Price in Rupees Button (Showcase) */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase text-zinc-500">Price (INR)</span>
                        <span className="font-mono font-extrabold text-lg text-emerald-400">
                          ₹{pack.priceRupees}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPackForShowcase(pack);
                        }}
                        className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1 group-hover:border-amber-400 group-hover:text-amber-300"
                      >
                        <span>Preview</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Perks of M Coins */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Why collect M Coins?</span>
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-300">
                  <li className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
                    <span>👑</span>
                    <span>Unlock the permanent <strong>24K Golden Joker</strong> card</span>
                  </li>
                  <li className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
                    <span>🃏</span>
                    <span>Buy rare daily cards from the 7-card rotation shop</span>
                  </li>
                  <li className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
                    <span>🏆</span>
                    <span>Show off luxury card cosmetics at live multiplayer tables</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ================= TAB 2: BUY CARDS ================= */}
          {activeTab === 'cards' && (
            <div className="space-y-6">
              {/* Daily Reset Countdown Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl bg-zinc-900/80 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
                      Daily Card Rotation (7 Cards Available)
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      1 Fixed 24K Golden Joker + 6 rotating cards that change every midnight!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Resets in:</span>
                  <span className="font-mono font-black text-xs sm:text-sm text-amber-300">
                    {timeLeft}
                  </span>
                </div>
              </div>

              {/* 1. FEATURED FIXED CARD: 24K GOLDEN JOKER (10,000 M COINS) */}
              <div className="relative p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-yellow-950/60 via-amber-900/30 to-black border-2 sm:border-3 border-yellow-400/80 shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden">
                {/* Glow accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/20 blur-3xl pointer-events-none rounded-full" />

                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Left: Card Visual */}
                  <div className="relative flex items-center justify-center group shrink-0">
                    <div className="relative transform group-hover:scale-105 transition-transform duration-300">
                      <PlayingCard
                        card={goldenJoker.card}
                        size="lg"
                        showIndexBadge={true}
                        glow={true}
                        className="shadow-[0_0_35px_rgba(245,158,11,0.6)] ring-4 ring-yellow-400 border-2 border-yellow-200"
                      />

                      {/* Floating Crown Stamp */}
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center shadow-gold-glow animate-bounce">
                        <Crown className="w-4 h-4 text-black" />
                      </div>
                    </div>
                  </div>

                  {/* Center: Info & Lore */}
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-yellow-400 text-black shadow-gold-glow">
                        Fixed Permanent Card
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-400/40">
                        Mythic 24K Gold
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-wider font-serif">
                      {goldenJoker.name}
                    </h2>

                    <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
                      {goldenJoker.lore}
                    </p>

                    <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-amber-300 font-mono">
                      <span>Doctor Value: <strong>50 PTS</strong></span>
                      <span>•</span>
                      <span>Card ID: <strong>#001-GOLD</strong></span>
                    </div>
                  </div>

                  {/* Right: Buy Controls */}
                  <div className="flex flex-col items-center md:items-end gap-2.5 shrink-0 w-full md:w-auto">
                    <div className="flex flex-col items-center md:items-end">
                      <span className="text-[10px] font-bold uppercase text-zinc-400">Fixed Store Price</span>
                      <div className="font-mono font-black text-2xl sm:text-3xl text-yellow-300 flex items-center gap-1.5 filter drop-shadow">
                        <span>10,000</span>
                        <span className="text-xs font-sans font-bold text-amber-400">M Coins</span>
                      </div>
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
                          'w-full md:w-auto px-6 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer',
                          mCoins >= goldenJoker.priceCoins
                            ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-300 hover:from-yellow-300 hover:to-amber-400 text-black'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        )}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          {mCoins >= goldenJoker.priceCoins ? 'Buy Golden Joker' : 'Need More M Coins'}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInspectingCard(goldenJoker)}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect 3D Art</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. THE 6 ROTATING DAILY CARDS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <span>6 Rotating Cards For Today</span>
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Updated Daily at 00:00 IST
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {rotatingCards.map((item) => {
                    const owned = isCardOwned(item.id);
                    const canAfford = mCoins >= item.priceCoins;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'relative p-4 rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between gap-3 bg-gradient-to-b shadow-md group hover:border-amber-400/80',
                          item.gradient,
                          owned ? 'border-emerald-500/50' : 'border-white/10'
                        )}
                      >
                        {/* Top: Rarity Badge + Inspect Button */}
                        <div className="flex items-center justify-between">
                          <span
                            className="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider border shadow-sm"
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
                            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Inspect 3D Card"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Middle: Card Visual & Title */}
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 transform group-hover:scale-105 transition-transform">
                            <PlayingCard
                              card={item.card}
                              size="xs"
                              showIndexBadge={true}
                              className="shadow-md"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-sm text-white truncate">
                              {item.name}
                            </h4>
                            <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                              {item.lore}
                            </p>
                          </div>
                        </div>

                        {/* Bottom: Price & Buy Button */}
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-[8px] uppercase font-bold text-zinc-500">Price</span>
                            <span className="font-mono font-black text-sm text-amber-300">
                              {item.priceCoins.toLocaleString()} M
                            </span>
                          </div>

                          {owned ? (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase flex items-center gap-1 border border-emerald-500/40">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Owned</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBuyCardAction(item)}
                              className={cn(
                                'px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95 cursor-pointer',
                                canAfford
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow hover:from-amber-400 hover:to-yellow-300'
                                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-zinc-750'
                              )}
                            >
                              <span>Buy</span>
                            </button>
                          )}
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
            'border-t border-white/10 flex items-center justify-between bg-black/60 shrink-0',
            isLandscapeMobile ? 'p-2.5 px-4' : 'p-3 sm:p-5'
          )}
        >
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] hidden xs:inline">
              Card Games By Madhav Official Virtual Store • Fair play & pure entertainment
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
          >
            Close Store
          </button>
        </div>
      </div>

      {/* ================= SHOWCASE DETAILS MODAL (FOR RUPEE PACKS) ================= */}
      {selectedPackForShowcase && (
        <div
          onClick={() => setSelectedPackForShowcase(null)}
          className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm p-5 sm:p-6 rounded-3xl bg-zinc-950 border-2 border-amber-500/80 text-center space-y-4 shadow-2xl overflow-hidden"
          >
            {/* Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-10 bg-amber-500/30 blur-xl pointer-events-none rounded-full" />

            <div className="text-4xl sm:text-5xl animate-bounce pt-2">
              {selectedPackForShowcase.icon}
            </div>

            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {selectedPackForShowcase.badge || 'Showcase Pack'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white font-mono">
                {selectedPackForShowcase.coins.toLocaleString()} M Coins
              </h3>
              <p className="text-xs text-zinc-400">{selectedPackForShowcase.title}</p>
            </div>

            {/* Price Tag */}
            <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Demo Price Tag
              </span>
              <span className="font-mono font-black text-2xl text-emerald-400">
                ₹{selectedPackForShowcase.priceRupees} INR
              </span>
            </div>

            {/* Explicit Notice that coins are not added */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
              <strong>Showcase Mode Active:</strong> As requested, payments are currently simulated in showcase mode. No real money or coins are deducted or added upon clicking.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPackForShowcase(null)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-gold-glow active:scale-95 transition-all"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 3D CARD INSPECTOR MODAL ================= */}
      {inspectingCard && (
        <div
          onClick={() => setInspectingCard(null)}
          className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md p-6 rounded-3xl bg-gradient-to-b from-zinc-900 to-black border-2 border-amber-400/80 text-center space-y-4 shadow-2xl flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => setInspectingCard(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Rarity & Title */}
            <div className="space-y-1">
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
              <h3 className="text-xl sm:text-2xl font-black text-white font-serif">
                {inspectingCard.name}
              </h3>
            </div>

            {/* Big Card Rendering */}
            <div className="py-2 transform hover:scale-105 transition-transform duration-300">
              <PlayingCard
                card={inspectingCard.card}
                size="lg"
                showIndexBadge={true}
                glow={true}
                className="shadow-[0_0_40px_rgba(245,158,11,0.5)] ring-4 ring-amber-400"
              />
            </div>

            {/* Lore */}
            <p className="text-xs text-zinc-300 leading-relaxed italic max-w-sm">
              &quot;{inspectingCard.lore}&quot;
            </p>

            {/* Price & Action */}
            <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase font-bold text-zinc-500">Price</span>
                <span className="font-mono font-black text-base text-yellow-300">
                  {inspectingCard.priceCoins.toLocaleString()} M Coins
                </span>
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-gold-glow active:scale-95 transition-all"
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
