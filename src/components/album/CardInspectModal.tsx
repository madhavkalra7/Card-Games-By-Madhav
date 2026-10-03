'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlbumStore } from '@/store/albumStore';
import { FAMILIES } from '@/lib/collectibles';
import { getCollectibleSvg } from './CollectibleCardView';
import { X, Lock, CheckCircle, Gem, Crown, Shield, Zap, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/sound';

export const CardInspectModal: React.FC = () => {
  const selectedCard = useAlbumStore((s) => s.selectedCard);
  const isInspecting = useAlbumStore((s) => s.isInspecting);
  const closeInspect = useAlbumStore((s) => s.closeInspect);
  const inspectForceUnlocked = useAlbumStore((s) => s.inspectForceUnlocked);
  const isUnlocked = useAlbumStore((s) =>
    selectedCard ? (inspectForceUnlocked || s.isUnlocked(selectedCard.id)) : false
  );

  // 3D Card Tilt on Mouse Move
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  if (!isInspecting || !selectedCard) return null;

  const family = FAMILIES[selectedCard.family];
  const isRed = selectedCard.suit === 'H' || selectedCard.suit === 'D';
  const suitSymbol =
    selectedCard.suit === 'S'
      ? '♠'
      : selectedCard.suit === 'H'
      ? '♥'
      : selectedCard.suit === 'D'
      ? '♦'
      : selectedCard.suit === 'C'
      ? '♣'
      : '👑';

  const svgUrl = getCollectibleSvg(selectedCard);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rX = ((y - centerY) / centerY) * -14;
    const rY = ((x - centerX) / centerX) * 14;
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeInspect}
          className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-lg max-h-[90dvh] overflow-y-auto custom-scrollbar bg-gradient-to-b from-[#fdfbf7] via-[#faf6ec] to-[#f4eee0] border-2 border-red-900/30 rounded-2xl sm:rounded-3xl p-3.5 xs:p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(120,15,15,0.4)] flex flex-col md:flex-row items-center gap-3.5 xs:gap-4 sm:gap-6"
        >
          {/* Close Button */}
          <button
            onClick={closeInspect}
            className="absolute top-2.5 right-2.5 xs:top-3 xs:right-3 w-7 h-7 xs:w-8 xs:h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-all cursor-pointer z-30 active:scale-90 shadow-2xs"
            title="Close Card View"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Column: 3D Holographic Card View with Tilt */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ perspective: 1000 }}
            className="shrink-0 flex items-center justify-center p-0.5 xs:p-1 sm:p-2"
          >
            <motion.div
              animate={{ rotateX, rotateY }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              style={{ transformStyle: 'preserve-3d' }}
              className={cn(
                'relative w-[115px] h-[172px] xs:w-[135px] xs:h-[202px] sm:w-[175px] sm:h-[262px] rounded-xl sm:rounded-2xl p-1 shadow-xl transition-all duration-300',
                isUnlocked
                  ? selectedCard.specialEffect === 'diamond_shine'
                    ? 'bg-gradient-to-br from-cyan-300 via-sky-100 to-indigo-600 shadow-[0_0_35px_rgba(56,189,248,0.9)] border-2 border-white'
                    : selectedCard.specialEffect === 'gold_particles'
                    ? 'bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-700 shadow-[0_0_35px_rgba(245,158,11,0.9)] border-2 border-amber-300'
                    : selectedCard.specialEffect === 'silver_chrome'
                    ? 'bg-gradient-to-br from-slate-200 via-white to-slate-400 shadow-[0_0_30px_rgba(226,232,240,0.8)] border-2 border-slate-100'
                    : 'bg-white border border-stone-300 shadow-[0_4px_20px_rgba(0,0,0,0.15)]'
                  : 'bg-[#ede7da] border-2 border-dashed border-[#cbbfab] shadow-[inset_0_2px_4px_rgba(60,40,20,0.08)]'
              )}
            >
              {/* Inner Card */}
              <div
                className={cn(
                  'relative w-full h-full rounded-lg xs:rounded-xl overflow-hidden flex flex-col justify-between',
                  isUnlocked ? 'bg-white' : 'bg-transparent text-stone-400'
                )}
              >
                {isUnlocked ? (
                  <>
                    {/* Real Card SVG Art as Foundation */}
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center p-1 bg-[#fdfdfd]">
                      <img
                        src={svgUrl}
                        alt={selectedCard.name}
                        className={cn(
                          'w-full h-full object-contain pointer-events-none select-none rounded-[6px] xs:rounded-[8px] sm:rounded-[12px]',
                          selectedCard.specialEffect === 'silver_chrome' && 'filter contrast-110 brightness-105 saturate-50'
                        )}
                        loading="eager"
                        decoding="async"
                      />
                    </div>

                    {/* Tier Effects Layered On Top of the Real Card */}

                    {/* A. DIAMOND PRISMATIC SHINE */}
                    {selectedCard.specialEffect === 'diamond_shine' && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 via-fuchsia-400/20 to-indigo-500/30 pointer-events-none mix-blend-color-dodge animate-pulse" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.5)_0%,transparent_75%)] pointer-events-none" />
                        <div className="absolute top-3 left-3 text-sm animate-ping">💎</div>
                        <div className="absolute bottom-8 right-3 text-xs animate-bounce">✨</div>
                        {/* Center Watermark Stamp */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-cyan-400/15 border-2 border-cyan-300/50 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.8)] backdrop-blur-[1px]">
                            <Gem className="w-7 h-7 sm:w-10 sm:h-10 text-cyan-200 fill-cyan-300 animate-spin-slow drop-shadow-[0_0_12px_rgba(56,189,248,1)]" />
                            <span className="text-[7px] sm:text-[9px] font-black uppercase text-cyan-200 tracking-widest mt-0.5">
                              DIAMOND
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* B. 24K GOLD PARTICLES */}
                    {selectedCard.specialEffect === 'gold_particles' && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 via-yellow-200/25 to-amber-600/35 pointer-events-none mix-blend-color-dodge animate-pulse" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(245,158,11,0.4)_0%,transparent_75%)] pointer-events-none" />
                        <div className="absolute top-3 left-3 text-sm animate-bounce">✨</div>
                        <div className="absolute bottom-8 right-3 text-xs animate-ping">🪙</div>
                        {/* Center Watermark Stamp */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-amber-400/15 border-2 border-amber-300/60 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.8)] backdrop-blur-[1px]">
                            <Crown className="w-7 h-7 sm:w-10 sm:h-10 text-yellow-300 fill-yellow-400 animate-bounce drop-shadow-[0_0_12px_rgba(245,158,11,1)]" />
                            <span className="text-[7px] sm:text-[9px] font-black uppercase text-amber-300 tracking-widest mt-0.5">
                              24K GOLD
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* C. LIQUID SILVER CHROME */}
                    {selectedCard.specialEffect === 'silver_chrome' && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-400/25 via-white/50 to-slate-300/25 pointer-events-none mix-blend-overlay" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.5)_0%,transparent_75%)] pointer-events-none" />
                        <div className="absolute top-3 left-3 text-sm animate-pulse">❄️</div>
                        <div className="absolute bottom-8 right-3 text-xs animate-bounce">✨</div>
                        {/* Center Watermark Stamp */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white/15 border-2 border-slate-200/60 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(226,232,240,0.8)] backdrop-blur-[1px]">
                            <Shield className="w-7 h-7 sm:w-10 sm:h-10 text-slate-100 fill-slate-300 drop-shadow-[0_0_10px_rgba(255,255,255,1)]" />
                            <span className="text-[7px] sm:text-[9px] font-black uppercase text-slate-200 tracking-widest mt-0.5">
                              PLATINUM
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* D. HOLOGRAPHIC SHIMMER (Aces) */}
                    {selectedCard.specialEffect === 'holo_shimmer' && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/25 via-indigo-500/25 to-amber-500/25 pointer-events-none mix-blend-color-dodge opacity-85" />
                    )}

                    {/* 3D Sweeping Light Reflection Glare */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-40 transition-opacity"
                      style={{
                        background: `radial-gradient(circle at ${50 + rotateY * 2}% ${50 - rotateX * 2}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
                      }}
                    />

                    {/* Top Header Floating Badges */}
                    <div className="relative z-10 w-full flex items-center justify-between p-1 leading-none pointer-events-none">
                      <div className="flex items-center gap-1">
                        {selectedCard.specialEffect === 'diamond_shine' ? (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-950/95 border border-cyan-300 text-cyan-200 text-[8px] sm:text-[9px] font-mono font-black shadow-[0_0_12px_rgba(56,189,248,0.9)] flex items-center gap-1">
                            <Gem className="w-3 h-3 text-cyan-200 fill-cyan-300 animate-spin-slow" />
                            <span>DIAMOND</span>
                          </span>
                        ) : selectedCard.specialEffect === 'gold_particles' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-950/95 border border-amber-300 text-yellow-300 text-[8px] sm:text-[9px] font-mono font-black shadow-[0_0_12px_rgba(245,158,11,0.9)] flex items-center gap-1">
                            <Crown className="w-3 h-3 text-yellow-300 fill-yellow-400 animate-pulse" />
                            <span>GOLD</span>
                          </span>
                        ) : selectedCard.specialEffect === 'silver_chrome' ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-950/95 border border-slate-200 text-slate-100 text-[8px] sm:text-[9px] font-mono font-black shadow-[0_0_12px_rgba(226,232,240,0.8)] flex items-center gap-1">
                            <Shield className="w-3 h-3 text-slate-200 fill-slate-300" />
                            <span>SILVER</span>
                          </span>
                        ) : selectedCard.specialEffect === 'holo_shimmer' ? (
                          <span className="px-2 py-0.5 rounded-full bg-black/90 border border-purple-400 text-purple-200 text-[8px] sm:text-[9px] font-mono font-black shadow-sm flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300" />
                            <span>HOLO</span>
                          </span>
                        ) : null}
                      </div>

                      <span className="text-[8px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/85 text-amber-300 border border-amber-400/50 font-black shadow-sm">
                        ★{selectedCard.power}
                      </span>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1 pointer-events-none" />

                    {/* Bottom Banner */}
                    <div
                      className={cn(
                        'relative z-10 w-full flex flex-col items-center py-1 px-1.5 backdrop-blur-md rounded-b-[6px] sm:rounded-b-[10px] border-t leading-none pointer-events-none',
                        selectedCard.specialEffect === 'diamond_shine'
                          ? 'bg-slate-950/92 border-cyan-400/80 text-cyan-200 shadow-[0_2px_12px_rgba(56,189,248,0.7)]'
                          : selectedCard.specialEffect === 'gold_particles'
                          ? 'bg-amber-950/92 border-amber-300/90 text-yellow-300 shadow-[0_2px_12px_rgba(245,158,11,0.7)]'
                          : selectedCard.specialEffect === 'silver_chrome'
                          ? 'bg-slate-950/92 border-slate-300/80 text-slate-100 shadow-[0_2px_10px_rgba(226,232,240,0.6)]'
                          : 'bg-black/85 border-white/20 text-white shadow-sm'
                      )}
                    >
                      <span className="text-[9px] sm:text-xs font-black truncate text-center w-full drop-shadow">
                        {selectedCard.hindiName}
                      </span>
                      <span className="text-[6.5px] sm:text-[8px] font-mono text-amber-300/90 mt-0.5">
                        #{String(selectedCard.collectorNumber).padStart(2, '0')} / 57
                      </span>
                    </div>
                  </>
                ) : (
                  /* Locked Inspect View */
                  <div className="w-full h-full flex flex-col items-center justify-between p-2">
                    <div className="w-full flex items-center justify-between">
                      <span className="text-sm font-mono font-black text-stone-400">
                        {selectedCard.rank}
                      </span>
                      <div className="w-5 h-5 rounded-full bg-stone-300/40 border border-stone-400/50 flex items-center justify-center">
                        <Lock className="w-3 h-3 text-stone-500" />
                      </div>
                    </div>

                    <div className="flex flex-col items-center my-auto opacity-60">
                      <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-stone-400" />
                      <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-stone-500 mt-2 uppercase">
                        UNATTAINED
                      </span>
                    </div>

                    <div className="w-full flex items-center justify-center border-t border-stone-300/80 pt-1">
                      <span className="text-[8px] font-mono text-stone-400">
                        #{String(selectedCard.collectorNumber).padStart(2, '0')}/57
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Card Lore & Collectible Details */}
          <div className="flex-1 flex flex-col justify-between text-left w-full min-w-0">
            <div>
              {/* Badge & Family Line */}
              <div className="flex items-center gap-1.5 xs:gap-2 mb-1">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[8.5px] xs:text-[9px] font-black uppercase tracking-wider',
                    selectedCard.rarity === 'mythic'
                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                      : selectedCard.rarity === 'legendary'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-stone-100 text-stone-800 border border-stone-300'
                  )}
                >
                  {selectedCard.rarity}
                </span>
                <span className="text-[9.5px] xs:text-[10px] text-stone-500 font-medium truncate font-serif">
                  {family.name} ({family.symbol})
                </span>
              </div>

              {/* Title & Hindi Name */}
              <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-stone-900 tracking-wide leading-tight font-serif">
                {selectedCard.name}
              </h3>
              <p className="text-xs xs:text-sm sm:text-base font-bold text-red-800 mb-1 xs:mb-1.5">
                {selectedCard.hindiName}
              </p>

              {/* Trump Role Tagline */}
              <p className="text-[11px] xs:text-xs font-semibold text-stone-600 italic mb-2 sm:mb-3 font-serif">
                &ldquo;{selectedCard.title}&rdquo;
              </p>

              {/* Card Stats Grid */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3 bg-white/90 rounded-xl p-2 sm:p-2.5 border border-stone-200 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[7.5px] xs:text-[8px] uppercase tracking-wider text-stone-500 block leading-none">
                      Trump Power
                    </span>
                    <span className="text-[11px] xs:text-xs font-mono font-black text-stone-900">
                      {selectedCard.power} PTS
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <div>
                    <span className="text-[7.5px] xs:text-[8px] uppercase tracking-wider text-stone-500 block leading-none">
                      Collector ID
                    </span>
                    <span className="text-[11px] xs:text-xs font-mono font-black text-stone-900">
                      #{String(selectedCard.collectorNumber).padStart(2, '0')} of 57
                    </span>
                  </div>
                </div>
              </div>

              {/* Flavor Text */}
              <p className="text-[11px] xs:text-xs text-stone-700 leading-relaxed mb-3 sm:mb-4 font-serif">
                {selectedCard.flavorText}
              </p>
            </div>

            {/* Achievement / Unlock Status */}
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {isUnlocked ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[10px] xs:text-[11px] font-black text-emerald-800 uppercase tracking-wider">
                      Collected In Grimoire
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-stone-500 shrink-0" />
                    <span className="text-[10px] xs:text-[11px] font-black text-stone-500 uppercase tracking-wider">
                      Not Yet Discovered (Win Matches to Unlock)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
