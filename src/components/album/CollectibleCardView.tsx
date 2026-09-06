'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CollectibleCard } from '@/lib/collectibles';
import { Lock, Sparkles, Crown, Gem, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/sound';

interface CollectibleCardViewProps {
  card: CollectibleCard;
  isUnlocked: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const CollectibleCardView: React.FC<CollectibleCardViewProps> = ({
  card,
  isUnlocked,
  onClick,
  size = 'md',
}) => {
  const isRed = card.suit === 'H' || card.suit === 'D';
  const suitSymbol =
    card.suit === 'S'
      ? '♠'
      : card.suit === 'H'
      ? '♥'
      : card.suit === 'D'
      ? '♦'
      : card.suit === 'C'
      ? '♣'
      : '👑';

  const handleClick = () => {
    if (isUnlocked) {
      sounds.playCardShimmer();
    } else {
      sounds.playCardSlide();
    }
    onClick?.();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      className={cn(
        'group relative cursor-pointer select-none transition-all duration-300',
        'rounded-lg xs:rounded-xl sm:rounded-2xl p-0.5 sm:p-1 flex flex-col items-center justify-between',
        size === 'sm'
          ? 'w-full max-w-[58px] xs:max-w-[68px] sm:max-w-[88px] md:max-w-[102px] aspect-[5/7.2]'
          : size === 'lg'
          ? 'w-full max-w-[140px] xs:max-w-[160px] sm:max-w-[190px] aspect-[5/7.2]'
          : 'w-full max-w-[80px] xs:max-w-[96px] sm:max-w-[124px] md:max-w-[140px] aspect-[5/7.2]',
        isUnlocked
          ? card.specialEffect === 'diamond_shine'
            ? 'bg-gradient-to-br from-cyan-300 via-sky-100 to-indigo-500 shadow-[0_4px_16px_rgba(56,189,248,0.45)] border border-cyan-300'
            : card.specialEffect === 'gold_particles'
            ? 'bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-600 shadow-[0_4px_16px_rgba(245,158,11,0.45)] border border-amber-300'
            : card.specialEffect === 'silver_chrome'
            ? 'bg-gradient-to-br from-slate-200 via-white to-slate-400 shadow-[0_4px_14px_rgba(148,163,184,0.4)] border border-slate-300'
            : 'bg-white border border-stone-200 shadow-[0_4px_10px_rgba(60,20,10,0.12)] hover:shadow-md'
          : 'bg-[#ede7da] border-2 border-dashed border-[#cbbfab] shadow-[inset_0_2px_4px_rgba(60,40,20,0.08)] hover:bg-[#eae3d4]'
      )}
    >
      {/* Inner Card Container / Mounting Pocket */}
      <div
        className={cn(
          'relative w-full h-full rounded-[6px] xs:rounded-[8px] sm:rounded-[13px] overflow-hidden flex flex-col justify-between p-1 xs:p-1.5',
          isUnlocked
            ? card.specialEffect === 'diamond_shine'
              ? 'bg-gradient-to-b from-sky-950 via-slate-900 to-black text-white'
              : card.specialEffect === 'gold_particles'
              ? 'bg-gradient-to-b from-amber-950 via-zinc-950 to-black text-amber-200'
              : card.specialEffect === 'silver_chrome'
              ? 'bg-gradient-to-b from-slate-900 via-zinc-900 to-black text-slate-100'
              : isRed
              ? 'bg-gradient-to-b from-rose-50/60 via-white to-rose-50/40 text-stone-900'
              : 'bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40 text-stone-900'
            : 'bg-transparent text-stone-400'
        )}
      >
        {/* Dynamic Holographic Shine Overlay for Unlocked Cards */}
        {isUnlocked && (
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform group-hover:translate-x-full group-hover:translate-y-full" />
        )}

        {/* Diamond Prismatic Rainbow Flare */}
        {isUnlocked && card.specialEffect === 'diamond_shine' && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(56,189,248,0.3)_0%,transparent_70%)] animate-pulse pointer-events-none" />
        )}

        {/* Gold Shimmer Aura */}
        {isUnlocked && card.specialEffect === 'gold_particles' && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(245,158,11,0.25)_0%,transparent_70%)] animate-pulse pointer-events-none" />
        )}

        {/* Top Header: Rank & Suit */}
        <div className="flex items-center justify-between z-10 leading-none">
          <div className="flex flex-col items-center leading-none">
            <span
              className={cn(
                'font-black font-mono text-[9.5px] xs:text-xs sm:text-sm tracking-tight',
                !isUnlocked
                  ? 'text-stone-400'
                  : card.specialEffect === 'diamond_shine'
                  ? 'text-cyan-300 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]'
                  : card.specialEffect === 'gold_particles'
                  ? 'text-yellow-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                  : card.specialEffect === 'silver_chrome'
                  ? 'text-slate-100'
                  : isRed
                  ? 'text-red-600'
                  : 'text-slate-800'
              )}
            >
              {card.rank}
            </span>
            <span
              className={cn(
                'text-[8.5px] xs:text-[9.5px] sm:text-xs',
                !isUnlocked
                  ? 'text-stone-400'
                  : isRed
                  ? 'text-red-600'
                  : 'text-slate-800'
              )}
            >
              {suitSymbol}
            </span>
          </div>

          {/* Rarity Star / Special Icon / Locked Seal */}
          <div className="flex items-center">
            {isUnlocked ? (
              card.specialEffect === 'diamond_shine' ? (
                <Gem className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-cyan-300 animate-spin-slow" />
              ) : card.specialEffect === 'gold_particles' ? (
                <Crown className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-yellow-300 animate-pulse" />
              ) : card.specialEffect === 'silver_chrome' ? (
                <Shield className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-slate-300" />
              ) : (
                <span className="text-[6.5px] xs:text-[7px] sm:text-[8px] font-mono px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold uppercase">
                  ★{card.power}
                </span>
              )
            ) : (
              <div className="w-4 h-4 rounded-full bg-stone-300/40 border border-stone-400/50 flex items-center justify-center">
                <Lock className="w-2 h-2 xs:w-2.5 xs:h-2.5 text-stone-500" />
              </div>
            )}
          </div>
        </div>

        {/* Center Artwork / Emblem / Slot Silhouette */}
        <div className="flex-1 flex flex-col items-center justify-center relative my-0.2 xs:my-0.5 z-10">
          {isUnlocked ? (
            <>
              {card.specialEffect === 'diamond_shine' ? (
                <div className="relative flex items-center justify-center">
                  <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-12 sm:h-12 rounded-full bg-cyan-400/20 flex items-center justify-center border border-cyan-300/40 shadow-[0_0_16px_rgba(56,189,248,0.5)]">
                    <span className="text-base xs:text-lg sm:text-3xl text-cyan-200 drop-shadow-[0_0_12px_rgba(56,189,248,1)]">
                      💎
                    </span>
                  </div>
                </div>
              ) : card.specialEffect === 'gold_particles' ? (
                <div className="relative flex items-center justify-center">
                  <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-12 sm:h-12 rounded-full bg-amber-400/20 flex items-center justify-center border border-amber-300/40 shadow-[0_0_16px_rgba(245,158,11,0.5)]">
                    <span className="text-base xs:text-lg sm:text-3xl text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,1)]">
                      🃏
                    </span>
                  </div>
                </div>
              ) : card.specialEffect === 'silver_chrome' ? (
                <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-11 sm:h-11 rounded-full bg-white/10 flex items-center justify-center border border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                  <span className="text-sm xs:text-base sm:text-2xl font-black font-serif text-slate-100">
                    {card.rank}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'text-xl xs:text-2xl sm:text-4xl filter drop-shadow-xs',
                      isRed ? 'text-red-600' : 'text-slate-800'
                    )}
                  >
                    {suitSymbol}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center opacity-60">
              <span className="text-xl xs:text-2xl sm:text-3xl text-stone-400 font-serif">
                {suitSymbol}
              </span>
              <span className="text-[6.5px] xs:text-[7.5px] sm:text-[8.5px] font-mono uppercase tracking-widest text-stone-500 mt-0.5">
                SLOT #{String(card.collectorNumber).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Footer: Hindi Name & Collector # */}
        <div className="w-full flex flex-col items-center pt-0.5 border-t border-stone-200/80 z-10 leading-none">
          <span
            className={cn(
              'text-[7px] xs:text-[8px] sm:text-[9px] font-bold text-center leading-tight truncate w-full',
              !isUnlocked
                ? 'text-stone-400'
                : card.specialEffect === 'diamond_shine'
                ? 'text-cyan-200'
                : card.specialEffect === 'gold_particles'
                ? 'text-amber-300'
                : card.specialEffect === 'silver_chrome'
                ? 'text-slate-200'
                : isRed
                ? 'text-red-900'
                : 'text-stone-800'
            )}
          >
            {isUnlocked ? card.hindiName : 'Empty Pocket'}
          </span>
          <span className="text-[5.5px] xs:text-[6px] sm:text-[7px] font-mono text-stone-400 mt-0.5">
            #{String(card.collectorNumber).padStart(2, '0')} / 57
          </span>
        </div>
      </div>
    </motion.div>
  );
};
