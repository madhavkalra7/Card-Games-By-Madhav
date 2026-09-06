'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useAlbumStore } from '@/store/albumStore';
import { AlbumPage } from './AlbumPage';
import { ChevronLeft, ChevronRight, BookOpen, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/sound';

const CHAPTER_TABS = [
  { page: 0, label: 'Codex', symbol: '📜', color: 'text-amber-300' },
  { page: 1, label: 'Spades', symbol: '♠', color: 'text-indigo-400' },
  { page: 2, label: 'Hearts', symbol: '♥', color: 'text-rose-500' },
  { page: 3, label: 'Diamonds', symbol: '♦', color: 'text-amber-400' },
  { page: 4, label: 'Clubs', symbol: '♣', color: 'text-emerald-400' },
  { page: 5, label: 'Vault', symbol: '👑', color: 'text-yellow-300' },
];

export const AlbumBook: React.FC = () => {
  const currentPage = useAlbumStore((s) => s.currentPage);
  const setPage = useAlbumStore((s) => s.setPage);
  const nextPage = useAlbumStore((s) => s.nextPage);
  const prevPage = useAlbumStore((s) => s.prevPage);

  // Track flip direction for realistic 3D curl effect
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

  // Realistic Page Flip Animation Variants
  const pageVariants = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 85 : -85,
      opacity: 0.3,
      scale: 0.94,
      boxShadow: dir > 0 ? '-30px 0 50px rgba(0,0,0,0.8)' : '30px 0 50px rgba(0,0,0,0.8)',
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      boxShadow: '0 0 40px rgba(0,0,0,0.7)',
      transition: {
        rotateY: { type: 'spring' as const, damping: 20, stiffness: 120, duration: 0.65 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.4 },
      },
    },
    exit: (dir: number) => ({
      rotateY: dir > 0 ? -85 : 85,
      opacity: 0.2,
      scale: 0.94,
      boxShadow: dir > 0 ? '30px 0 50px rgba(0,0,0,0.8)' : '-30px 0 50px rgba(0,0,0,0.8)',
      transition: {
        rotateY: { type: 'spring' as const, damping: 20, stiffness: 120, duration: 0.55 },
        opacity: { duration: 0.25 },
      },
    }),
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none py-1 sm:py-3">
      {/* Top Chapter Bookmark Ribbon Tabs */}
      <div className="w-full flex items-center justify-start sm:justify-center gap-1 sm:gap-2 mb-2 sm:mb-3 px-2 pr-6 sm:pr-2 overflow-x-auto no-scrollbar scroll-smooth">
        {CHAPTER_TABS.map((tab) => {
          const isActive = tab.page === currentPage;
          return (
            <button
              key={tab.page}
              onClick={() => handleTabClick(tab.page)}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95',
                isActive
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black shadow-gold-glow border border-yellow-200'
                  : 'bg-black/60 hover:bg-white/15 text-zinc-300 border border-white/15 backdrop-blur-md'
              )}
            >
              <span className={cn('text-xs sm:text-sm', isActive ? 'text-black' : tab.color)}>
                {tab.symbol}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main 3D Book Container */}
      <div
        style={{ perspective: 1600 }}
        className="relative w-full h-[68vh] min-h-[440px] max-h-[640px] sm:h-auto sm:aspect-[16/11] sm:max-h-[76vh] flex items-center justify-center px-0.5 xs:px-1 sm:px-6"
      >
        {/* Outer Hardcover Leather Book Frame */}
        <div className="relative w-full h-full rounded-2xl sm:rounded-3xl p-1 xs:p-2 sm:p-4 bg-gradient-to-br from-amber-950/90 via-zinc-950 to-amber-950/80 border-2 sm:border-4 border-gold/70 shadow-[0_0_60px_rgba(212,175,55,0.4)] flex items-center justify-center overflow-hidden">
          {/* Subtle Stitched Seam & Leather Texture */}
          <div className="absolute inset-1 rounded-[14px] sm:rounded-[22px] border border-dashed border-amber-400/30 pointer-events-none" />

          {/* Book Spine Crease Effect (Center) */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-2 sm:w-6 bg-gradient-to-r from-black/40 via-black/80 to-black/40 pointer-events-none z-30 opacity-60" />

          {/* Inner Foil Page Container */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            style={{ transformStyle: 'preserve-3d', transformOrigin: direction > 0 ? 'left center' : 'right center' }}
            className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing bg-zinc-950 touch-pan-y"
          >
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentPage}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full h-full rounded-xl sm:rounded-2xl bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black border border-white/10 shadow-2xl flex flex-col justify-between"
              >
                <AlbumPage pageIndex={currentPage} />
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
            'hidden sm:flex absolute -left-1 sm:left-1 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-3 rounded-full border-2 transition-all cursor-pointer active:scale-90 shadow-2xl items-center justify-center',
            currentPage === 0
              ? 'opacity-0 pointer-events-none'
              : 'border-gold/80 bg-black/85 hover:bg-black text-amber-300 shadow-[0_0_20px_rgba(212,175,55,0.6)] hover:scale-110'
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
            'hidden sm:flex absolute -right-1 sm:right-1 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-3 rounded-full border-2 transition-all cursor-pointer active:scale-90 shadow-2xl items-center justify-center',
            currentPage === 5
              ? 'opacity-0 pointer-events-none'
              : 'border-gold/80 bg-black/85 hover:bg-black text-amber-300 shadow-[0_0_20px_rgba(212,175,55,0.6)] hover:scale-110'
          )}
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>
      </div>

      {/* Bottom Nav Helper & Mobile Ergonomic Flip Controls */}
      <div className="flex items-center justify-between w-full px-2 xs:px-4 mt-2 sm:mt-3 text-[10px] sm:text-xs font-mono text-zinc-400">
        {/* Mobile Prev Button & Desktop Hint */}
        <div className="flex items-center">
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className={cn(
              'sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all active:scale-90 font-bold',
              currentPage === 0
                ? 'opacity-30 border-white/10 text-zinc-600 pointer-events-none'
                : 'border-amber-400/50 bg-white/10 text-amber-300 active:bg-amber-400 active:text-black shadow-sm'
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          <span className="hidden sm:inline">
            ← Swipe Left / Right to flip pages
          </span>
        </div>

        {/* Center Chapter Indicator */}
        <div className="flex items-center gap-1.5 font-bold text-amber-300/90 text-center">
          <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
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
                ? 'opacity-30 border-white/10 text-zinc-600 pointer-events-none'
                : 'border-amber-400/50 bg-white/10 text-amber-300 active:bg-amber-400 active:text-black shadow-sm'
            )}
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span className="hidden sm:inline">
            Tap card for 3D view →
          </span>
        </div>
      </div>
    </div>
  );
};
