'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Gamepad2, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const IMAGES = [
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png',
    bg: '#F4845F',
    panel: '#F79B7F',
    gameTitle: 'DUKKI BAZAAR',
    gameBadge: 'Available Now',
    tagline: 'Classic Indian 52-Card Game',
    description: 'Gather your friends for authentic traditional Indian 52-card action. Establish 4 center suit rails, trigger Bazaar Open, and play online with authoritative table rules.',
    actionText: 'ENTER BAZAAR',
    isAvailable: true,
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png',
    bg: '#6BBF7A',
    panel: '#85CC92',
    gameTitle: 'MENDICOT',
    gameBadge: 'Coming Soon',
    tagline: 'Dehla Pakad 2v2 Trick Taking',
    description: 'Iconic 4-player (2v2) Indian partnership game. Capture highest-rank tricks, cut suits with trump cards, and seize all four 10s (Dehlas) for the ultimate Mendicot win!',
    actionText: 'VIEW MENDICOT',
    isAvailable: false,
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png',
    bg: '#E882B4',
    panel: '#ED9DC4',
    gameTitle: 'TEEN DO PAANCH',
    gameBadge: 'Coming Soon',
    tagline: '3-Player 30-Card Quota Battle',
    description: 'A fiercely competitive 3-player trick-taking battle played with 30 cards. Hit your quota (3, 2, or 5 hands) or surrender cards to opponents in the next round.',
    actionText: 'VIEW 3-2-5',
    isAvailable: false,
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.4457fbce.png',
    bg: '#6EB5FF',
    panel: '#8DC4FF',
    gameTitle: 'SATTE PE SATTA',
    gameBadge: 'Coming Soon',
    tagline: '7 on 7 Suit Ladders Strategy',
    description: 'Classic sequence shedding game. Launch suit ladders starting from the 7 of Hearts, strategically block your rivals, and empty your hand first to win.',
    actionText: 'VIEW 7 ON 7',
    isAvailable: false,
  },
];

interface ToonHeroSectionProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export const ToonHeroSection: React.FC<ToonHeroSectionProps> = ({
  onCreateRoom,
  onJoinRoom,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Preload all 4 images on mount
  useEffect(() => {
    IMAGES.forEach((img) => {
      const image = new Image();
      image.src = img.src;
    });
  }, []);

  // Window resize listener for isMobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Navigation logic with 650ms animation lock
  const navigate = (direction: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (direction === 'next' ? (prev + 1) % 4 : (prev + 3) % 4));
    setTimeout(() => {
      setIsAnimating(false);
    }, 650);
  };

  // Keyboard arrow keys navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'ArrowRight') navigate('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnimating]);

  // Derive roles
  const getRole = (idx: number): 'center' | 'left' | 'right' | 'back' => {
    if (idx === activeIndex) return 'center';
    if (idx === (activeIndex + 3) % 4) return 'left';
    if (idx === (activeIndex + 1) % 4) return 'right';
    return 'back';
  };

  const currentItem = IMAGES[activeIndex];

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{
        backgroundColor: currentItem.bg,
        transition: 'background-color 650ms cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="relative w-full h-screen overflow-hidden">
        
        {/* 1. Grain overlay (absolute inset-0 pointer-events-none, zIndex 50) */}
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
            opacity: 0.4,
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat',
          }}
        />

        {/* 2. Giant ghost text: Dynamic game name behind each character with guaranteed NO cropping */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none z-[2] px-2 sm:px-6"
          style={{ top: '15%' }}
        >
          <svg
            viewBox="0 0 1200 240"
            className="w-[92vw] max-w-[1400px] h-auto max-h-[30vh] overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            {IMAGES.map((img, idx) => {
              const isCur = idx === activeIndex;
              // Carefully proportioned font size based on title length to prevent any edge clipping
              const fontSize =
                img.gameTitle.length > 12
                  ? '135px'
                  : img.gameTitle.length > 8
                  ? '155px'
                  : '190px';

              return (
                <text
                  key={img.gameTitle}
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  style={{
                    fontFamily: "'Anton', sans-serif",
                    fontSize,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                    opacity: isCur ? 0.95 : 0,
                    transform: `scale(${isCur ? 1 : 0.96})`,
                    transformOrigin: 'center',
                    transition: 'opacity 650ms cubic-bezier(0.4, 0, 0.2, 1), transform 650ms cubic-bezier(0.4, 0, 0.2, 1)',
                    filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.15))',
                  }}
                >
                  {img.gameTitle}
                </text>
              );
            })}
          </svg>
        </div>

        {/* 3. Top Header: Brand Label + Navigation (absolute top-6, zIndex 60) */}
        <header className="absolute top-6 left-4 sm:left-8 right-4 sm:right-8 z-[60] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-sm border border-white/30 shadow-sm">
              ♠
            </div>
            <div>
              <span
                className="text-xs font-semibold uppercase text-white tracking-[0.18em]"
                style={{ opacity: 0.9 }}
              >
                CARD GAMES BY MADHAV
              </span>
              <span className="hidden sm:block text-[9px] text-white/75 font-medium tracking-wider uppercase">
                Traditional Indian 52-Card Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/games"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-white" />
              <span>Catalog</span>
            </Link>
          </div>
        </header>

        {/* 4. Carousel (absolute inset-0, zIndex 3) */}
        <div className="absolute inset-0 z-[3]">
          {IMAGES.map((img, idx) => {
            const role = getRole(idx);

            // Per-role styling exactly as specified
            let roleStyle: React.CSSProperties = {};

            if (role === 'center') {
              roleStyle = {
                transform: `translateX(-50%) scale(${isMobile ? 1.25 : 1.68})`,
                filter: 'blur(0px)',
                opacity: 1,
                zIndex: 20,
                left: '50%',
                height: isMobile ? '60%' : '92%',
                bottom: isMobile ? '22%' : 0,
              };
            } else if (role === 'left') {
              roleStyle = {
                transform: 'translateX(-50%) scale(1)',
                filter: 'blur(2px)',
                opacity: 0.85,
                zIndex: 10,
                left: isMobile ? '20%' : '30%',
                height: isMobile ? '16%' : '28%',
                bottom: isMobile ? '32%' : '12%',
              };
            } else if (role === 'right') {
              roleStyle = {
                transform: 'translateX(-50%) scale(1)',
                filter: 'blur(2px)',
                opacity: 0.85,
                zIndex: 10,
                left: isMobile ? '80%' : '70%',
                height: isMobile ? '16%' : '28%',
                bottom: isMobile ? '32%' : '12%',
              };
            } else {
              // back
              roleStyle = {
                transform: 'translateX(-50%) scale(1)',
                filter: 'blur(4px)',
                opacity: 1,
                zIndex: 5,
                left: '50%',
                height: isMobile ? '13%' : '22%',
                bottom: isMobile ? '32%' : '12%',
              };
            }

            return (
              <div
                key={img.src}
                className="cursor-pointer"
                onClick={() => {
                  if (role === 'left') navigate('prev');
                  if (role === 'right') navigate('next');
                }}
                style={{
                  position: 'absolute',
                  aspectRatio: '0.6 / 1',
                  transition:
                    'transform 650ms cubic-bezier(0.4, 0, 0.2, 1), filter 650ms cubic-bezier(0.4, 0, 0.2, 1), opacity 650ms cubic-bezier(0.4, 0, 0.2, 1), left 650ms cubic-bezier(0.4, 0, 0.2, 1)',
                  willChange: 'transform, filter, opacity',
                  ...roleStyle,
                }}
              >
                <img
                  src={img.src}
                  alt={img.gameTitle}
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'bottom center',
                    filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.25))',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 5. Bottom-left text + nav buttons (absolute bottom-6 left-4 sm:bottom-16 sm:left-16 lg:left-24, zIndex 60, maxWidth: 380px) */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-16 sm:left-16 lg:left-24 z-[60] flex flex-col"
          style={{ maxWidth: '380px' }}
        >
          {/* Glass Card Container for crisp readability */}
          <div className="bg-black/25 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white/15 shadow-2xl mb-3 sm:mb-4">
            {/* Game Badge & Tagline */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                  currentItem.isAvailable
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                    : 'bg-white/15 text-white/90 border border-white/20'
                )}
              >
                {currentItem.gameBadge}
              </span>
              <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider truncate">
                {currentItem.tagline}
              </span>
            </div>

            {/* Main Card Game Title */}
            <h2
              className="mb-1.5 sm:mb-2 text-lg sm:text-2xl font-black uppercase text-white tracking-wide leading-tight"
              style={{ fontFamily: "'Anton', sans-serif" }}
            >
              {currentItem.gameTitle}
            </h2>

            {/* Card Game Authentic Description */}
            <p
              className="hidden sm:block text-xs sm:text-sm text-white/90 leading-[1.55] mb-3"
            >
              {currentItem.description}
            </p>

            {/* Quick Room Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onCreateRoom}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white text-zinc-900 font-black text-xs uppercase tracking-wider shadow-lg hover:bg-zinc-100 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Create Table</span>
              </button>
              <button
                onClick={onJoinRoom}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wider border border-white/30 backdrop-blur-md active:scale-95 transition-all"
              >
                <Users className="w-3.5 h-3.5 text-white" />
                <span>Join Table</span>
              </button>
            </div>
          </div>

          {/* Two circular navigation buttons exactly as specified */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('prev')}
              disabled={isAnimating}
              title="Previous Game"
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white flex items-center justify-center text-white transition-all active:scale-95"
              style={{
                backgroundColor: 'transparent',
                transition: 'transform 150ms, background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>

            <button
              onClick={() => navigate('next')}
              disabled={isAnimating}
              title="Next Game"
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white flex items-center justify-center text-white transition-all active:scale-95"
              style={{
                backgroundColor: 'transparent',
                transition: 'transform 150ms, background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ArrowRight size={26} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* 6. Bottom-right link (absolute bottom-6 right-4 sm:bottom-16 sm:right-10 lg:right-16, zIndex 60) */}
        <div className="absolute bottom-6 right-4 sm:bottom-16 sm:right-10 lg:right-16 z-[60]">
          {currentItem.isAvailable ? (
            <button
              onClick={onCreateRoom}
              className="flex items-center gap-2 group text-white uppercase transition-opacity duration-200"
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 'clamp(20px, 3.8vw, 52px)',
                fontWeight: 400,
                opacity: 0.95,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.95')}
            >
              <span>{currentItem.actionText}</span>
              <ArrowRight className="w-5 h-5 sm:w-8 sm:h-8 stroke-[2.25] group-hover:translate-x-1.5 transition-transform" />
            </button>
          ) : (
            <Link
              href="/games"
              className="flex items-center gap-2 group text-white uppercase transition-opacity duration-200"
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 'clamp(20px, 3.8vw, 52px)',
                fontWeight: 400,
                opacity: 0.95,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.95')}
            >
              <span>{currentItem.actionText}</span>
              <ArrowRight className="w-5 h-5 sm:w-8 sm:h-8 stroke-[2.25] group-hover:translate-x-1.5 transition-transform" />
            </Link>
          )}
        </div>

      </div>
    </div>
  );
};
