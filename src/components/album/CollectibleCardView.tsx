import React from 'react';
import { motion } from 'framer-motion';
import { CollectibleCard } from '@/lib/collectibles';
import { getCardSvgPath } from '@/components/card/PlayingCard';
import { Lock, Sparkles, Crown, Gem, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/sound';

interface CollectibleCardViewProps {
  card: CollectibleCard;
  isUnlocked: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function getCollectibleSvg(card: CollectibleCard): string {
  if (card.id === 'VAULT-GOLDEN-JOKER') return '/cards/red_joker.svg';
  if (card.id === 'VAULT-DIAMOND-ACE') return '/cards/ace_of_spades.svg';
  if (card.id === 'VAULT-SILVER-J') return '/cards/jack_of_spades.svg';
  if (card.id === 'VAULT-SILVER-Q') return '/cards/queen_of_spades.svg';
  if (card.id === 'VAULT-SILVER-K') return '/cards/king_of_spades.svg';
  return getCardSvgPath(card.rank, card.suit);
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

  const svgUrl = getCollectibleSvg(card);

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      className={cn(
        'group relative cursor-pointer select-none transition-all duration-300 overflow-hidden',
        'rounded-lg xs:rounded-xl sm:rounded-2xl p-0.5 sm:p-1 flex flex-col items-center justify-between',
        size === 'sm'
          ? 'w-full max-w-[58px] xs:max-w-[68px] sm:max-w-[88px] md:max-w-[102px] aspect-[5/7.2]'
          : size === 'lg'
          ? 'w-full max-w-[140px] xs:max-w-[160px] sm:max-w-[190px] aspect-[5/7.2]'
          : 'w-full max-w-[80px] xs:max-w-[96px] sm:max-w-[124px] md:max-w-[140px] aspect-[5/7.2]',
        isUnlocked
          ? card.specialEffect === 'diamond_shine'
            ? 'bg-gradient-to-br from-cyan-300 via-sky-100 to-indigo-500 shadow-[0_0_22px_rgba(56,189,248,0.7)] border-2 border-cyan-300'
            : card.specialEffect === 'gold_particles'
            ? 'bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-600 shadow-[0_0_22px_rgba(245,158,11,0.7)] border-2 border-amber-300'
            : card.specialEffect === 'silver_chrome'
            ? 'bg-gradient-to-br from-slate-200 via-white to-slate-400 shadow-[0_0_20px_rgba(148,163,184,0.7)] border-2 border-slate-200'
            : card.specialEffect === 'holo_shimmer'
            ? 'bg-gradient-to-br from-indigo-300 via-pink-200 to-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.5)] border-2 border-purple-300'
            : 'bg-stone-100 border border-stone-300 shadow-[0_4px_12px_rgba(60,20,10,0.15)] hover:shadow-md'
          : 'bg-[#ede7da] border-2 border-dashed border-[#cbbfab] shadow-[inset_0_2px_4px_rgba(60,40,20,0.08)] hover:bg-[#eae3d4]'
      )}
    >
      {/* Inner Card Container */}
      <div
        className={cn(
          'relative w-full h-full rounded-[6px] xs:rounded-[8px] sm:rounded-[13px] overflow-hidden flex flex-col justify-between',
          isUnlocked ? 'bg-white' : 'bg-transparent text-stone-400'
        )}
      >
        {isUnlocked ? (
          <>
            {/* 1. Authentic Real Card SVG Artwork as Base */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-center p-0.5 bg-[#fdfdfd]">
              <img
                src={svgUrl}
                alt={card.name}
                className={cn(
                  'w-full h-full object-contain pointer-events-none select-none rounded-[5px] xs:rounded-[7px] sm:rounded-[11px]',
                  card.specialEffect === 'silver_chrome' && 'filter contrast-110 brightness-105 saturate-50'
                )}
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* 2. Tier Overlays on Top of the Real Card */}
            
            {/* A. DIAMOND PRISMATIC SHINE EFFECT */}
            {card.specialEffect === 'diamond_shine' && (
              <>
                {/* Iridescent Rainbow Prismatic Holographic Film */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/25 via-fuchsia-400/20 to-indigo-500/25 pointer-events-none mix-blend-color-dodge animate-pulse" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.45)_0%,transparent_75%)] pointer-events-none" />
                {/* Shimmering Diamond Glint Flares */}
                <div className="absolute top-2 left-2 text-[10px] sm:text-xs animate-ping opacity-75">💎</div>
                <div className="absolute bottom-6 right-2 text-[8px] sm:text-[10px] animate-bounce opacity-80">✨</div>
              </>
            )}

            {/* B. 24K GOLD PARTICLES EFFECT */}
            {card.specialEffect === 'gold_particles' && (
              <>
                {/* Molten 24K Gold Shimmer Filter */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/25 via-yellow-200/25 to-amber-600/30 pointer-events-none mix-blend-color-dodge animate-pulse" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.35)_0%,transparent_75%)] pointer-events-none" />
                {/* Floating Gold Sparkle Badges */}
                <div className="absolute top-2 left-2 text-[9px] sm:text-xs animate-bounce opacity-85">✨</div>
                <div className="absolute bottom-6 right-2 text-[8px] sm:text-[10px] animate-ping opacity-75">🪙</div>
              </>
            )}

            {/* C. LIQUID SILVER CHROME EFFECT */}
            {card.specialEffect === 'silver_chrome' && (
              <>
                {/* Liquid Chrome Metallic Reflection */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-400/20 via-white/45 to-slate-300/20 pointer-events-none mix-blend-overlay" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.45)_0%,transparent_75%)] pointer-events-none" />
                {/* Platinum Highlights */}
                <div className="absolute top-2 left-2 text-[9px] sm:text-xs opacity-80">❄️</div>
                <div className="absolute bottom-6 right-2 text-[8px] sm:text-[10px] animate-pulse opacity-75">✨</div>
              </>
            )}

            {/* D. HOLOGRAPHIC SHIMMER (Aces) */}
            {card.specialEffect === 'holo_shimmer' && (
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 via-indigo-500/20 to-amber-500/20 pointer-events-none mix-blend-color-dodge opacity-80" />
            )}

            {/* Dynamic Interactive Sweeping Glare on Hover */}
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/35 to-transparent rotate-45 transform pointer-events-none group-hover:translate-x-full transition-transform duration-1000" />

            {/* 3. Top Floating Badges (Power / Special Tier Emblem) */}
            <div className="relative z-10 w-full flex items-center justify-between p-1 sm:p-1.5 leading-none pointer-events-none">
              <div className="flex items-center">
                {card.specialEffect === 'diamond_shine' ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-300 text-cyan-200 text-[6.5px] xs:text-[7px] sm:text-[8px] font-mono font-black shadow-[0_0_10px_rgba(56,189,248,0.9)] flex items-center gap-0.5">
                    <Gem className="w-2.5 h-2.5 text-cyan-200 fill-cyan-300 animate-spin-slow" />
                    <span>DIAMOND</span>
                  </span>
                ) : card.specialEffect === 'gold_particles' ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-950/90 border border-amber-300 text-yellow-300 text-[6.5px] xs:text-[7px] sm:text-[8px] font-mono font-black shadow-[0_0_10px_rgba(245,158,11,0.9)] flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5 text-yellow-300 fill-yellow-400 animate-pulse" />
                    <span>GOLD</span>
                  </span>
                ) : card.specialEffect === 'silver_chrome' ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-950/90 border border-slate-200 text-slate-100 text-[6.5px] xs:text-[7px] sm:text-[8px] font-mono font-black shadow-[0_0_10px_rgba(226,232,240,0.8)] flex items-center gap-0.5">
                    <Shield className="w-2.5 h-2.5 text-slate-200 fill-slate-300" />
                    <span>SILVER</span>
                  </span>
                ) : card.specialEffect === 'holo_shimmer' ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-black/85 border border-purple-400 text-purple-200 text-[6.5px] xs:text-[7px] sm:text-[8px] font-mono font-black shadow-sm flex items-center gap-0.5">
                    <Sparkles className="w-2 h-2 text-yellow-300 fill-yellow-300" />
                    <span>HOLO</span>
                  </span>
                ) : null}
              </div>

              {/* Power Rating Tag */}
              <span className="text-[6.5px] xs:text-[7px] sm:text-[8px] font-mono px-1 py-0.2 rounded bg-black/80 text-amber-300 border border-amber-400/50 font-black shadow-sm">
                ★{card.power}
              </span>
            </div>

            {/* Spacer for bottom */}
            <div className="flex-1 pointer-events-none" />

            {/* 4. Bottom Nameplate Banner */}
            <div
              className={cn(
                'relative z-10 w-full flex flex-col items-center py-0.5 px-1 backdrop-blur-md rounded-b-[5px] xs:rounded-b-[7px] sm:rounded-b-[11px] border-t leading-none pointer-events-none',
                card.specialEffect === 'diamond_shine'
                  ? 'bg-slate-950/92 border-cyan-400/80 text-cyan-200 shadow-[0_2px_12px_rgba(56,189,248,0.7)]'
                  : card.specialEffect === 'gold_particles'
                  ? 'bg-amber-950/92 border-amber-300/90 text-yellow-300 shadow-[0_2px_12px_rgba(245,158,11,0.7)]'
                  : card.specialEffect === 'silver_chrome'
                  ? 'bg-slate-950/92 border-slate-300/80 text-slate-100 shadow-[0_2px_10px_rgba(226,232,240,0.6)]'
                  : 'bg-black/82 border-white/20 text-white shadow-sm'
              )}
            >
              <span className="text-[7px] xs:text-[8px] sm:text-[9.5px] font-extrabold truncate text-center w-full drop-shadow">
                {card.hindiName}
              </span>
              <span className="text-[5px] xs:text-[6px] sm:text-[7px] font-mono text-amber-300/90 mt-0.5">
                #{String(card.collectorNumber).padStart(2, '0')} / 57
              </span>
            </div>
          </>
        ) : (
          /* Locked Slot Silhouette */
          <div className="w-full h-full flex flex-col items-center justify-between p-1.5 xs:p-2">
            <div className="w-full flex items-center justify-between">
              <span className="text-xs sm:text-sm font-mono font-black text-stone-400">
                {card.rank}
              </span>
              <div className="w-4 h-4 rounded-full bg-stone-300/40 border border-stone-400/50 flex items-center justify-center">
                <Lock className="w-2.5 h-2.5 text-stone-500" />
              </div>
            </div>

            <div className="flex flex-col items-center opacity-60 my-auto">
              <span className="text-xl xs:text-2xl sm:text-3xl text-stone-400 font-serif">
                {suitSymbol}
              </span>
              <span className="text-[6.5px] xs:text-[7.5px] sm:text-[8.5px] font-mono uppercase tracking-widest text-stone-500 mt-0.5">
                SLOT #{String(card.collectorNumber).padStart(2, '0')}
              </span>
            </div>

            <div className="w-full flex flex-col items-center pt-0.5 border-t border-stone-300/80 leading-none">
              <span className="text-[7px] xs:text-[8px] font-bold text-stone-400 truncate w-full text-center">
                Empty Pocket
              </span>
              <span className="text-[5.5px] xs:text-[6px] font-mono text-stone-400 mt-0.5">
                #{String(card.collectorNumber).padStart(2, '0')} / 57
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
