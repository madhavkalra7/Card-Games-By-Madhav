'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useAlbumStore } from '@/store/albumStore';
import { AlbumPage } from './AlbumPage';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/sound';

const CHAPTER_TABS = [
  { page: 0, label: 'Codex', symbol: '📜', ribbonBg: 'bg-[#92400e]', text: 'text-amber-100' },
  { page: 1, label: 'Spades', symbol: '♠', ribbonBg: 'bg-[#1e293b]', text: 'text-slate-100' },
  { page: 2, label: 'Hearts', symbol: '♥', ribbonBg: 'bg-[#991b1b]', text: 'text-rose-100' },
  { page: 3, label: 'Diamonds', symbol: '♦', ribbonBg: 'bg-[#b45309]', text: 'text-amber-100' },
  { page: 4, label: 'Clubs', symbol: '♣', ribbonBg: 'bg-[#065f46]', text: 'text-emerald-100' },
  { page: 5, label: 'Vault', symbol: '👑', ribbonBg: 'bg-[#581c87]', text: 'text-purple-100' },
];

export const AlbumBook: React.FC = () => {
  const currentPage = useAlbumStore((s) => s.currentPage);
  const setPage = useAlbumStore((s) => s.setPage);
  const nextPage = useAlbumStore((s) => s.nextPage);
  const prevPage = useAlbumStore((s) => s.prevPage);

  // Track flip direction for realistic 3D paper curl
  const [direction, setDirection] = useState<1 | -1>(1);

  const handleNext = () => {
    if (currentPage < 5) {
      setDirection(1);
      sounds.playPageFlip();
      nextPage();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setDirection(-1);
      sounds.playPageFlip();
      prevPage();
    }
  };

  const handleTabClick = (page: number) => {
    if (page !== currentPage) {
      setDirection(page > currentPage ? 1 : -1);
      sounds.playPageFlip();
      setPage(page);
    }
  };

  // Drag / Swipe handling on mobile & desktop
  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold) {
      handlePrev();
    }
  };

  // Dynamic Page Stack Thickness (shows realistic paper sheets on left vs right side)
  const leftStackWidth = Math.max(3, currentPage * 2.2 + 2);
  const rightStackWidth = Math.max(3, (5 - currentPage) * 2.2 + 2);

  // Authentic Paper Page Turn Variants (Kaagaz Palatna - Silky Smooth 3D Physics)
  const pageVariants = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 75 : -75,
      opacity: 0.35,
      scale: 0.97,
      filter: 'brightness(0.92)',
      boxShadow: dir > 0 ? '-20px 0 40px rgba(0,0,0,0.28)' : '20px 0 40px rgba(0,0,0,0.28)',
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      filter: 'brightness(1)',
      boxShadow: '0 4px 25px rgba(0,0,0,0.12)',
      transition: {
        rotateY: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
        opacity: { duration: 0.28 },
        scale: { duration: 0.35, ease: 'easeOut' as const },
      },
    },
    exit: (dir: number) => ({
      rotateY: dir > 0 ? -75 : 75,
      opacity: 0.25,
      scale: 0.97,
      filter: 'brightness(0.86)',
      boxShadow: dir > 0 ? '20px 0 40px rgba(0,0,0,0.28)' : '-20px 0 40px rgba(0,0,0,0.28)',
      transition: {
        rotateY: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
        opacity: { duration: 0.22 },
      },
    }),
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none py-1 sm:py-2">
      {/* Top Silk Bookmark Ribbon Tabs protruding from the Kitaab */}
      <div className="w-full flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2.5 px-2 pr-6 sm:pr-2 overflow-x-auto no-scrollbar scroll-smooth pt-1">
        {CHAPTER_TABS.map((tab) => {
          const isActive = tab.page === currentPage;
          return (
            <button
              key={tab.page}
              onClick={() => handleTabClick(tab.page)}
              className={cn(
                'relative flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 rounded-t-lg text-[10.5px] sm:text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs active:scale-95',
                tab.ribbonBg,
                tab.text,
                isActive
                  ? 'translate-y-0.5 ring-2 ring-amber-300 shadow-md font-black border-t-2 border-x-2 border-amber-300'
                  : 'opacity-85 hover:opacity-100 hover:-translate-y-0.5 border-t border-x border-white/20'
              )}
            >
              <span className="text-xs sm:text-sm leading-none drop-shadow-xs">{tab.symbol}</span>
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-300 rotate-45" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Real Kitaab Spread (Red Leather Hardcover with Paper Folio) */}
      <div
        style={{ perspective: 2400 }}
        className="relative w-full h-[68vh] min-h-[440px] max-h-[640px] sm:h-auto sm:aspect-[16/11] sm:max-h-[76vh] flex items-center justify-center px-0.5 xs:px-1 sm:px-6"
      >
        {/* Outer Red Leather Hardcover Frame (Kitaab Binding) */}
        <div
          className="relative w-full h-full rounded-2xl sm:rounded-3xl p-2.5 xs:p-3.5 sm:p-5 flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #5b0707 0%, #851212 25%, #9b1919 50%, #780d0d 75%, #4a0404 100%)',
            boxShadow: `
              0 32px 64px -12px rgba(100, 10, 10, 0.42),
              0 14px 28px -6px rgba(0, 0, 0, 0.22),
              inset 0 0 0 1.5px rgba(251, 191, 36, 0.45),
              inset 0 2px 10px rgba(255, 255, 255, 0.22)
            `,
          }}
        >
          {/* Ornate Gold Stitched Perimeter Border */}
          <div className="absolute inset-1.5 sm:inset-2.5 rounded-[12px] sm:rounded-[20px] border border-dashed border-amber-300/40 pointer-events-none" />
          <div className="absolute inset-2 sm:inset-3 rounded-[10px] sm:rounded-[18px] border border-amber-400/20 pointer-events-none" />

          {/* Antique Brass Corner Brackets (Kone) */}
          <div className="absolute top-1.5 left-1.5 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-l-2 border-amber-300/80 rounded-tl-sm pointer-events-none flex items-start justify-start p-0.5">
            <span className="text-[7px] sm:text-[9px] text-amber-300/90 leading-none">⚜</span>
          </div>
          <div className="absolute top-1.5 right-1.5 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-r-2 border-amber-300/80 rounded-tr-sm pointer-events-none flex items-start justify-end p-0.5">
            <span className="text-[7px] sm:text-[9px] text-amber-300/90 leading-none">⚜</span>
          </div>
          <div className="absolute bottom-1.5 left-1.5 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-l-2 border-amber-300/80 rounded-bl-sm pointer-events-none flex items-end justify-start p-0.5">
            <span className="text-[7px] sm:text-[9px] text-amber-300/90 leading-none">⚜</span>
          </div>
          <div className="absolute bottom-1.5 right-1.5 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-r-2 border-amber-300/80 rounded-br-sm pointer-events-none flex items-end justify-end p-0.5">
            <span className="text-[7px] sm:text-[9px] text-amber-300/90 leading-none">⚜</span>
          </div>

          {/* Dynamic Paper Pages Stack Thickness (Left & Right Book Edges) */}
          <div
            className="absolute inset-y-3.5 left-1.5 rounded-l-xs pointer-events-none transition-all duration-500"
            style={{
              width: `${leftStackWidth}px`,
              background: 'repeating-linear-gradient(to right, #ede6d8, #ede6d8 1px, #dfd6c4 1px, #dfd6c4 2px)',
              boxShadow: 'inset 1px 0 3px rgba(0,0,0,0.35)',
            }}
          />
          <div
            className="absolute inset-y-3.5 right-1.5 rounded-r-xs pointer-events-none transition-all duration-500"
            style={{
              width: `${rightStackWidth}px`,
              background: 'repeating-linear-gradient(to right, #dfd6c4, #dfd6c4 1px, #ede6d8 1px, #ede6d8 2px)',
              boxShadow: 'inset -1px 0 3px rgba(0,0,0,0.35)',
            }}
          />

          {/* Book Spine Headband (Top & Bottom Woven Cloth Strip) */}
          <div
            className="absolute top-1 left-1/2 -translate-x-1/2 w-8 sm:w-14 h-1.5 rounded-xs pointer-events-none z-30 opacity-90"
            style={{
              background: 'repeating-linear-gradient(to right, #881337, #881337 2px, #f59e0b 2px, #f59e0b 4px)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          />
          <div
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 sm:w-14 h-1.5 rounded-xs pointer-events-none z-30 opacity-90"
            style={{
              background: 'repeating-linear-gradient(to right, #881337, #881337 2px, #f59e0b 2px, #f59e0b 4px)',
              boxShadow: '0 -1px 2px rgba(0,0,0,0.3)',
            }}
          />

          {/* Central Book Spine Crease & Valley Gutter */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 sm:w-12 bg-gradient-to-r from-stone-900/10 via-stone-950/40 to-stone-900/10 pointer-events-none z-30 opacity-80" />

          {/* Trailing Red Silk Bookmark Ribbon with Swallowtail Notch */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-3.5 sm:w-4.5 h-7 bg-gradient-to-b from-red-800 via-red-600 to-rose-700 shadow-md z-30 pointer-events-none border-x border-b border-amber-300/40" />

          {/* Inner Kaagaz Page Container with Authentic 3D Paper Curl */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: direction > 0 ? 'left center' : 'right center',
            }}
            className="relative w-full h-full rounded-lg sm:rounded-xl overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y shadow-inner"
          >
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentPage}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{
                  transformStyle: 'preserve-3d',
                  transformOrigin: direction > 0 ? 'left center' : 'right center',
                }}
                className="w-full h-full rounded-lg sm:rounded-xl bg-gradient-to-b from-[#fdfbf7] via-[#faf6ec] to-[#f4eee0] border border-amber-900/15 shadow-xl flex flex-col justify-between overflow-hidden"
              >
                {/* Paper Texture Shading Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none z-20 opacity-40 mix-blend-multiply"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.85) 0%, rgba(220,210,195,0.45) 100%)',
                  }}
                />

                {/* Spine Fold Shadow (Inside Left/Right Page Gutter) */}
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 sm:w-12 bg-gradient-to-r from-stone-900/0 via-stone-900/15 to-stone-900/0 pointer-events-none z-20" />

                {/* Inner Page Content */}
                <div className="relative z-10 w-full h-full flex flex-col justify-between">
                  <AlbumPage pageIndex={currentPage} />
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Floating Brass Previous Page Button (Desktop & Tablet) */}
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          title="Previous Page (Swipe Right)"
          className={cn(
            'hidden sm:flex absolute -left-2 sm:left-1 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-3 rounded-full border-2 transition-all cursor-pointer active:scale-90 shadow-lg items-center justify-center',
            currentPage === 0
              ? 'opacity-0 pointer-events-none'
              : 'border-amber-400 bg-white/95 hover:bg-amber-50 text-red-900 shadow-[0_4px_20px_rgba(153,27,27,0.3)] hover:scale-105'
          )}
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>

        {/* Floating Brass Next Page Button (Desktop & Tablet) */}
        <button
          onClick={handleNext}
          disabled={currentPage === 5}
          title="Next Page (Swipe Left)"
          className={cn(
            'hidden sm:flex absolute -right-2 sm:right-1 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-3 rounded-full border-2 transition-all cursor-pointer active:scale-90 shadow-lg items-center justify-center',
            currentPage === 5
              ? 'opacity-0 pointer-events-none'
              : 'border-amber-400 bg-white/95 hover:bg-amber-50 text-red-900 shadow-[0_4px_20px_rgba(153,27,27,0.3)] hover:scale-105'
          )}
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>
      </div>

      {/* Bottom Navigation Controls & Chapter Indicator */}
      <div className="flex items-center justify-between w-full px-2 xs:px-4 mt-2 sm:mt-3 text-[10.5px] sm:text-xs font-mono text-stone-600">
        {/* Mobile Prev Button & Desktop Hint */}
        <div className="flex items-center">
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className={cn(
              'sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all active:scale-90 font-bold',
              currentPage === 0
                ? 'opacity-30 border-stone-300 text-stone-400 pointer-events-none'
                : 'border-red-300 bg-white text-red-800 active:bg-red-700 active:text-white shadow-xs'
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          <span className="hidden sm:inline font-serif italic text-stone-500">
            ← Drag or swipe page to flip
          </span>
        </div>

        {/* Center Chapter Indicator */}
        <div className="flex items-center gap-1.5 font-bold text-red-950 text-center font-serif">
          <BookOpen className="w-3.5 h-3.5 text-red-700 shrink-0" />
          <span>
            Chapter {currentPage} of 5: {CHAPTER_TABS[currentPage].label}
          </span>
        </div>

        {/* Mobile Next Button & Desktop Hint */}
        <div className="flex items-center">
          <button
            onClick={handleNext}
            disabled={currentPage === 5}
            className={cn(
              'sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all active:scale-90 font-bold',
              currentPage === 5
                ? 'opacity-30 border-stone-300 text-stone-400 pointer-events-none'
                : 'border-red-300 bg-white text-red-800 active:bg-red-700 active:text-white shadow-xs'
            )}
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span className="hidden sm:inline font-serif italic text-stone-500">
            Tap card to inspect →
          </span>
        </div>
      </div>
    </div>
  );
};
