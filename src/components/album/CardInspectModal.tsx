'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlbumStore } from '@/store/albumStore';
import { FAMILIES } from '@/lib/collectibles';
import { X, Lock, CheckCircle, Sparkles, Gem, Crown, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/sound';

export const CardInspectModal: React.FC = () => {
  const selectedCard = useAlbumStore((s) => s.selectedCard);
  const isInspecting = useAlbumStore((s) => s.isInspecting);
  const closeInspect = useAlbumStore((s) => s.closeInspect);
  const isUnlocked = useAlbumStore((s) => (selectedCard ? s.isUnlocked(selectedCard.id) : false));

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
                  'relative w-full h-full rounded-lg xs:rounded-xl overflow-hidden flex flex-col justify-between p-2 xs:p-2.5 sm:p-3',
                  isUnlocked
                    ? selectedCard.specialEffect === 'diamond_shine'
                      ? 'bg-gradient-to-b from-sky-950 via-slate-900 to-black text-white'
                      : selectedCard.specialEffect === 'gold_particles'
                      ? 'bg-gradient-to-b from-amber-950 via-zinc-950 to-black text-amber-200'
                      : selectedCard.specialEffect === 'silver_chrome'
                      ? 'bg-gradient-to-b from-slate-900 via-zinc-950 to-black text-slate-100'
                      : isRed
                      ? 'bg-gradient-to-b from-rose-50/60 via-white to-rose-50/30 text-stone-900'
                      : 'bg-gradient-to-b from-slate-50/60 via-white to-slate-50/30 text-stone-900'
                    : 'bg-transparent text-stone-400'
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center leading-none">
                    <span className="font-black font-mono text-sm sm:text-lg">
                      {isUnlocked ? selectedCard.rank : '?'}
                    </span>
                    <span className={cn('text-xs sm:text-sm', isRed ? 'text-red-600' : 'text-slate-800')}>
                      {suitSymbol}
                    </span>
                  </div>
                  <span className="text-[8px] xs:text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    ★{selectedCard.power}
                  </span>
                </div>

                {/* Big Center Graphic */}
                <div className="flex flex-col items-center justify-center my-auto">
                  {isUnlocked ? (
                    selectedCard.specialEffect === 'diamond_shine' ? (
                      <div className="flex flex-col items-center">
                        <Gem className="w-12 h-12 xs:w-14 xs:h-14 sm:w-20 sm:h-20 text-cyan-300 drop-shadow-[0_0_20px_rgba(56,189,248,1)] animate-pulse" />
                        <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-black uppercase text-cyan-200 tracking-wider xs:tracking-widest mt-1 sm:mt-2">
                          DIAMOND EDITION
                        </span>
                      </div>
                    ) : selectedCard.specialEffect === 'gold_particles' ? (
                      <div className="flex flex-col items-center">
                        <Crown className="w-12 h-12 xs:w-14 xs:h-14 sm:w-20 sm:h-20 text-yellow-300 drop-shadow-[0_0_20px_rgba(245,158,11,1)] animate-bounce" />
                        <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-black uppercase text-amber-300 tracking-wider xs:tracking-widest mt-1 sm:mt-2">
                          GOLDEN LEGEND
                        </span>
                      </div>
                    ) : selectedCard.specialEffect === 'silver_chrome' ? (
                      <div className="flex flex-col items-center">
                        <Shield className="w-12 h-12 xs:w-14 xs:h-14 sm:w-20 sm:h-20 text-slate-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                        <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-black uppercase text-slate-300 tracking-wider xs:tracking-widest mt-1 sm:mt-2">
                          SILVER MONARCH
                        </span>
                      </div>
                    ) : (
                      <span className={cn('text-4xl xs:text-5xl sm:text-6xl filter drop-shadow-xs', isRed ? 'text-red-600' : 'text-slate-800')}>
                        {suitSymbol}
                      </span>
                    )
                  ) : (
                    <div className="flex flex-col items-center">
                      <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-stone-400" />
                      <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-stone-500 mt-1.5 sm:mt-2 uppercase">
                        UNATTAINED
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-stone-200 pt-1 sm:pt-1.5">
                  <span className="text-[8px] xs:text-[9px] font-mono text-stone-500">
                    #{String(selectedCard.collectorNumber).padStart(2, '0')}/57
                  </span>
                  <span className="text-[8px] xs:text-[9px] font-bold text-red-800 uppercase">
                    {selectedCard.rarity}
                  </span>
                </div>
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
                  <Sparkles className="w-3.5 h-3.5 text-red-600 shrink-0" />
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
