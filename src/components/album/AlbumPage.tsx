'use client';

import React from 'react';
import { FAMILIES, CollectibleFamily, getCardsByFamily, MYTHIC_VAULT_CARDS } from '@/lib/collectibles';
import { CollectibleCardView } from './CollectibleCardView';
import { useAlbumStore } from '@/store/albumStore';
import { Crown, Sparkles, Trophy, BookOpen, Gem, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlbumPageProps {
  pageIndex: number; // 0 to 5
}

export const AlbumPage: React.FC<AlbumPageProps> = ({ pageIndex }) => {
  const isUnlocked = useAlbumStore((s) => s.isUnlocked);
  const openInspect = useAlbumStore((s) => s.openInspect);
  const unlockedCount = useAlbumStore((s) => s.getUnlockedCount());
  const totalCount = useAlbumStore((s) => s.getTotalCount());
  const setPage = useAlbumStore((s) => s.setPage);

  // PAGE 0: Codex Cover / Collector Overview
  if (pageIndex === 0) {
    const percent = Math.round((unlockedCount / totalCount) * 100);

    return (
      <div className="w-full h-full flex flex-col justify-between p-2.5 xs:p-3 sm:p-6 text-center select-none overflow-y-auto custom-scrollbar">
        {/* Top Emblem */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-red-600 via-amber-500 to-red-800 p-0.5 shadow-md mb-1.5 xs:mb-2 sm:mb-2.5 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#fdfbf7] flex items-center justify-center border border-amber-300">
              <Crown className="w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 text-red-700 animate-pulse" />
            </div>
          </div>
          <span className="text-[9px] xs:text-[10px] sm:text-xs font-black uppercase text-red-800 tracking-[0.2em] sm:tracking-[0.25em]">
            SHAHI TAASH KOSH
          </span>
          <h2 className="text-base xs:text-lg sm:text-3xl font-black text-stone-900 uppercase tracking-wider font-serif mt-0.5">
            THE ROYAL GRIMOIRE
          </h2>
          <p className="text-[10.5px] xs:text-xs sm:text-sm text-stone-600 max-w-sm mx-auto mt-0.5 font-serif italic">
            Official Royal Compendium of 57 Legendary Trump Cards &amp; Mythic Relics.
          </p>
        </div>

        {/* Collector Statistics Box */}
        <div className="my-2 sm:my-3 bg-white/80 border border-amber-900/15 rounded-xl sm:rounded-2xl p-2.5 xs:p-3 sm:p-4 max-w-md mx-auto w-full shadow-sm backdrop-blur-xs">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <div className="text-left">
              <span className="text-[8px] xs:text-[9px] uppercase tracking-wider font-bold text-stone-500 block">
                Total Collection
              </span>
              <span className="text-base xs:text-lg sm:text-2xl font-mono font-black text-red-900">
                {unlockedCount} / {totalCount}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[8px] xs:text-[9px] uppercase tracking-wider font-bold text-stone-500 block">
                Mastery
              </span>
              <span className="text-base xs:text-lg sm:text-2xl font-mono font-black text-emerald-700">
                {percent}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 xs:h-2.5 bg-stone-200/80 rounded-full overflow-hidden border border-stone-300 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600 transition-all duration-700 shadow-xs"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* 5 Chapters Quick Index - Clean Single Row Grid on All Devices */}
        <div className="grid grid-cols-5 gap-1 xs:gap-1.5 sm:gap-2 max-w-lg mx-auto w-full my-1 sm:my-2">
          {[
            { page: 1, symbol: '♠', name: 'Spades', color: 'text-slate-800', border: 'border-slate-300' },
            { page: 2, symbol: '♥', name: 'Hearts', color: 'text-red-700', border: 'border-red-200' },
            { page: 3, symbol: '♦', name: 'Diamonds', color: 'text-amber-700', border: 'border-amber-200' },
            { page: 4, symbol: '♣', name: 'Clubs', color: 'text-emerald-800', border: 'border-emerald-200' },
            { page: 5, symbol: '👑', name: 'Vault', color: 'text-purple-800', border: 'border-purple-200' },
          ].map((item) => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              className={cn(
                'flex flex-col items-center justify-center p-1.5 xs:p-2 rounded-lg xs:rounded-xl bg-white/90 hover:bg-stone-50 border transition-all cursor-pointer group active:scale-95 shadow-xs',
                item.border
              )}
            >
              <span className={cn('text-base xs:text-lg sm:text-2xl group-hover:scale-125 transition-transform leading-none', item.color)}>
                {item.symbol}
              </span>
              <span className="text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] font-bold text-stone-700 mt-0.5 group-hover:text-red-800 truncate w-full text-center">
                {item.name}
              </span>
            </button>
          ))}
        </div>

        {/* Footer Prompt */}
        <div className="text-[9px] xs:text-[10px] text-stone-500 font-serif italic">
          Tip: Drag or swipe page to flip through chapters • Tap cards to inspect in 3D
        </div>
      </div>
    );
  }

  // PAGE 5: The Imperial Mythic Vault (Grand Finale Page)
  if (pageIndex === 5) {
    const family = FAMILIES.mythic;
    const vaultCards = MYTHIC_VAULT_CARDS;
    const unlockedVault = vaultCards.filter((c) => isUnlocked(c.id)).length;

    return (
      <div className="w-full h-full flex flex-col justify-between p-2.5 xs:p-3 sm:p-5 select-none overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-200 pb-1.5 xs:pb-2 mb-1.5 sm:mb-2">
          <div className="flex items-center gap-1.5 xs:gap-2">
            <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg xs:rounded-xl bg-gradient-to-br from-purple-700 via-indigo-700 to-amber-600 p-0.5 shadow-sm flex items-center justify-center">
              <Crown className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-xs xs:text-sm sm:text-base font-black text-purple-950 uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 font-serif">
                {family.name}
                <Sparkles className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-amber-500 animate-pulse" />
              </h3>
              <span className="text-[9px] xs:text-[10px] sm:text-xs font-bold text-purple-700">
                {family.hindiName}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[8px] xs:text-[9px] font-mono uppercase text-stone-500 block">
              Vault Unlocks
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {unlockedVault} / {vaultCards.length}
            </span>
          </div>
        </div>

        {/* Vault Motto Banner */}
        <div className="bg-purple-50/80 border border-purple-200/80 rounded-lg xs:rounded-xl px-2.5 py-1 sm:px-3 sm:py-1 mb-2 sm:mb-3 text-center shadow-2xs">
          <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-semibold text-purple-900 tracking-wide uppercase font-serif">
            👑 {family.motto}
          </span>
        </div>

        {/* 5 Mythic Cards Showcase */}
        <div className="flex-1 flex flex-col justify-center my-auto">
          {/* Top Row: The 2 Supreme Apex Cards (Golden Joker & Diamond Ace) */}
          <div className="flex items-center justify-center gap-3 xs:gap-4 sm:gap-6 mb-2.5 sm:mb-4">
            {vaultCards.slice(0, 2).map((card) => (
              <CollectibleCardView
                key={card.id}
                card={card}
                isUnlocked={isUnlocked(card.id)}
                onClick={() => openInspect(card)}
                size="md"
              />
            ))}
          </div>

          {/* Bottom Row: The 3 Silver Monarchs (Silver Jack, Queen, King) */}
          <div className="flex items-center justify-center gap-2 xs:gap-3 sm:gap-4">
            {vaultCards.slice(2).map((card) => (
              <CollectibleCardView
                key={card.id}
                card={card}
                isUnlocked={isUnlocked(card.id)}
                onClick={() => openInspect(card)}
                size="sm"
              />
            ))}
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="pt-1.5 xs:pt-2 mt-1.5 sm:mt-2 border-t border-amber-900/15 text-center">
          <span className="text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] font-serif text-stone-500 uppercase tracking-wider">
            ★ Golden Joker • Diamond Ace of Spades • Silver J, Q &amp; K ★
          </span>
        </div>
      </div>
    );
  }

  // PAGES 1-4: The 4 Families (Spades, Hearts, Diamonds, Clubs)
  const familyKeys: CollectibleFamily[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const currentFamilyKey = familyKeys[pageIndex - 1];
  const family = FAMILIES[currentFamilyKey];
  const familyCards = getCardsByFamily(currentFamilyKey);
  const unlockedFamilyCount = familyCards.filter((c) => isUnlocked(c.id)).length;

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 xs:p-2.5 sm:p-4 select-none overflow-y-auto custom-scrollbar">
      {/* Chapter Header Bar */}
      <div className="flex items-center justify-between border-b border-amber-900/15 pb-1 xs:pb-1.5 sm:pb-2 mb-1.5 sm:mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xl sm:text-2xl" style={{ color: family.accentColor }}>
            {family.symbol}
          </span>
          <div className="text-left leading-tight">
            <h3 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wider font-serif">
              {family.name}
            </h3>
            <span className="text-[8.5px] xs:text-[9px] sm:text-[10px] font-bold text-stone-600">
              {family.hindiName}
            </span>
          </div>
        </div>

        <div className="text-right leading-tight">
          <span className="text-[7.5px] xs:text-[8px] sm:text-[9px] font-mono uppercase text-stone-500 block">
            Family Progress
          </span>
          <span
            className="text-xs sm:text-sm font-mono font-black px-2 py-0.5 rounded-full bg-white border border-stone-300 shadow-2xs inline-block mt-0.5"
            style={{ color: family.accentColor }}
          >
            {unlockedFamilyCount} / {familyCards.length}
          </span>
        </div>
      </div>

      {/* 13 Trump Cards Responsive Grid */}
      <div className="flex-1 grid grid-cols-4 sm:grid-cols-5 gap-1.5 xs:gap-2 sm:gap-2.5 justify-items-center items-center py-0.5 xs:py-1">
        {familyCards.map((card) => (
          <CollectibleCardView
            key={card.id}
            card={card}
            isUnlocked={isUnlocked(card.id)}
            onClick={() => openInspect(card)}
            size="sm"
          />
        ))}
      </div>

      {/* Footer Line */}
      <div className="pt-1 xs:pt-1.5 border-t border-amber-900/15 flex items-center justify-between text-[7.5px] xs:text-[8px] sm:text-[9px] text-stone-500 font-serif italic">
        <span className="truncate max-w-[200px] sm:max-w-none">{family.motto}</span>
        <span className="shrink-0 ml-1 font-mono not-italic font-bold">PAGE {pageIndex} OF 5</span>
      </div>
    </div>
  );
};
