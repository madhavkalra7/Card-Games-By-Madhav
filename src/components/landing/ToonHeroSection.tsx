'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Gamepad2, Plus, Users, Music, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { funkyMusic } from '@/lib/funkyMusic';
import { useAuthStore } from '@/store/authStore';
import { getAvatarById } from '@/lib/avatars';

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
  const [isShortHeight, setIsShortHeight] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const user = useAuthStore((s) => s.user);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const setAuthModalOpen = useAuthStore((s) => s.setAuthModalOpen);
  const setProfileModalOpen = useAuthStore((s) => s.setProfileModalOpen);

  // Preload all 4 images on mount and manage background funky music & auth check
  useEffect(() => {
    checkAuth();
    IMAGES.forEach((img) => {
      const image = new Image();
      image.src = img.src;
    });

    const unsub = funkyMusic.subscribe((playing) => {
      setIsMusicPlaying(playing);
    });

    // Auto-start funky music on user's first click or keypress
    const handleFirstInteraction = () => {
      if (localStorage.getItem('cg_landing_music') !== 'false') {
        funkyMusic.start();
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      unsub();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      funkyMusic.stop(); // Stop music when leaving the landing page
    };
  }, []);

  const handleToggleMusic = (e: React.MouseEvent) => {
    e.stopPropagation();
    funkyMusic.toggle();
  };

  // Responsive listener detecting mobile portrait AND mobile landscape (short height)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640 && window.innerHeight >= 500);
      setIsShortHeight(window.innerHeight < 520);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      <div className="relative w-full h-[100dvh] min-h-[320px] overflow-hidden">
        
        {/* 1. Grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
            opacity: 0.35,
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat',
          }}
        />

        {/* 2. Giant ghost text - scaled and positioned responsively for both portrait & landscape */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none z-[2] px-2 sm:px-6"
          style={{ top: isShortHeight ? '8%' : '14%' }}
        >
          <svg
            viewBox="0 0 1200 240"
            className={cn(
              "w-[94vw] max-w-[1400px] h-auto overflow-visible",
              isShortHeight ? "max-h-[20vh]" : "max-h-[30vh]"
            )}
            preserveAspectRatio="xMidYMid meet"
          >
            {IMAGES.map((img, idx) => {
              const isCur = idx === activeIndex;
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

        {/* 3. Top Header: Brand Label + Navigation */}
        <header className={cn(
          "absolute left-3 sm:left-8 right-3 sm:right-8 z-[60] flex items-center justify-between",
          isShortHeight ? "top-2 sm:top-3" : "top-4 sm:top-6"
        )}>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-xs sm:text-sm border border-white/30 shadow-sm">
              ♠
            </div>
            <div>
              <span
                className="text-[10px] sm:text-xs font-semibold uppercase text-white tracking-[0.16em] sm:tracking-[0.18em]"
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
            {/* Funky Music Toggle Button */}
            <button
              type="button"
              onClick={handleToggleMusic}
              title={isMusicPlaying ? 'Pause Funky Music' : 'Play Funky Music'}
              className={cn(
                "flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full backdrop-blur-md transition-all shadow-sm active:scale-95 cursor-pointer",
                isMusicPlaying
                  ? "bg-amber-400 text-black border border-yellow-200 font-extrabold shadow-lg"
                  : "bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold"
              )}
            >
              {isMusicPlaying ? (
                <>
                  <div className="flex items-end gap-0.5 h-3.5 py-0.5 shrink-0">
                    <span className="w-0.5 sm:w-1 bg-black rounded-full animate-bounce" style={{ height: '70%', animationDuration: '400ms' }} />
                    <span className="w-0.5 sm:w-1 bg-black rounded-full animate-bounce" style={{ height: '100%', animationDuration: '280ms' }} />
                    <span className="w-0.5 sm:w-1 bg-black rounded-full animate-bounce" style={{ height: '50%', animationDuration: '500ms' }} />
                  </div>
                  <span className="text-[10px] sm:text-xs font-black tracking-wider">FUNKY BEATS</span>
                </>
              ) : (
                <>
                  <Music className="w-3.5 h-3.5 text-white" />
                  <span className="text-[10px] sm:text-xs tracking-wider">PLAY MUSIC</span>
                </>
              )}
            </button>

            <Link
              href="/games"
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white text-[11px] sm:text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-white" />
              <span>Catalog</span>
            </Link>

            {/* Top-Right Circular Cartoon Avatar or Sign In Button */}
            {user ? (
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-2.5 sm:pr-3.5 py-1 rounded-full bg-black/45 hover:bg-black/70 border border-gold/60 backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer group"
                title="View Profile & Game Stats"
              >
                {/* Circular Cartoon Avatar */}
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-amber-300 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-gold-glow group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: `${getAvatarById(user.avatarId).color}40` }}
                >
                  <img
                    src={getAvatarById(user.avatarId).image}
                    alt={user.name}
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                </div>

                <div className="flex flex-col items-start text-left leading-none">
                  <span className="text-[10px] sm:text-xs font-bold text-white max-w-[70px] sm:max-w-[110px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono text-amber-300 font-extrabold mt-0.5">
                    {user.totalScore.toLocaleString()} PTS
                  </span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true, 'login')}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black text-[11px] sm:text-xs font-black tracking-wider uppercase backdrop-blur-md shadow-gold-glow transition-all active:scale-95 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* 4. Carousel - 3D Character Figurines with Landscape Responsiveness */}
        <div className="absolute inset-0 z-[3]">
          {IMAGES.map((img, idx) => {
            const role = getRole(idx);

            // Per-role styling with short height (mobile landscape) awareness
            let roleStyle: React.CSSProperties = {};

            if (isShortHeight) {
              // Mobile Landscape: tighter vertical scales so heads and feet are 100% visible
              if (role === 'center') {
                roleStyle = {
                  transform: 'translateX(-50%) scale(1.18)',
                  filter: 'blur(0px)',
                  opacity: 1,
                  zIndex: 20,
                  left: '50%',
                  height: '76%',
                  bottom: '0',
                };
              } else if (role === 'left') {
                roleStyle = {
                  transform: 'translateX(-50%) scale(0.92)',
                  filter: 'blur(2px)',
                  opacity: 0.85,
                  zIndex: 10,
                  left: '26%',
                  height: '24%',
                  bottom: '8%',
                };
              } else if (role === 'right') {
                roleStyle = {
                  transform: 'translateX(-50%) scale(0.92)',
                  filter: 'blur(2px)',
                  opacity: 0.85,
                  zIndex: 10,
                  left: '74%',
                  height: '24%',
                  bottom: '8%',
                };
              } else {
                roleStyle = {
                  transform: 'translateX(-50%) scale(0.85)',
                  filter: 'blur(4px)',
                  opacity: 1,
                  zIndex: 5,
                  left: '50%',
                  height: '18%',
                  bottom: '8%',
                };
              }
            } else {
              // Standard View (Portrait phone or Desktop)
              if (role === 'center') {
                roleStyle = {
                  transform: `translateX(-50%) scale(${isMobile ? 1.25 : 1.65})`,
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

        {/* 5. Bottom-left text + nav buttons */}
        <div
          className={cn(
            "absolute z-[60] flex flex-col",
            isShortHeight
              ? "bottom-2 left-3 sm:left-6 max-w-[280px] sm:max-w-[340px]"
              : "bottom-4 sm:bottom-16 left-3 sm:left-12 lg:left-24 max-w-[340px] sm:max-w-[380px]"
          )}
        >
          {/* Glass Card Container */}
          <div className={cn(
            "bg-black/30 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/15 shadow-2xl",
            isShortHeight ? "p-2.5 sm:p-3.5 mb-2" : "p-3.5 sm:p-5 mb-3"
          )}>
            {/* Game Badge & Tagline */}
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider',
                  currentItem.isAvailable
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                    : 'bg-white/15 text-white/90 border border-white/20'
                )}
              >
                {currentItem.gameBadge}
              </span>
              <span className="text-[9px] sm:text-[10px] text-white/75 font-bold uppercase tracking-wider truncate">
                {currentItem.tagline}
              </span>
            </div>

            {/* Main Card Game Title */}
            <h2
              className={cn(
                "font-black uppercase text-white tracking-wide leading-tight",
                isShortHeight ? "text-base sm:text-lg mb-1" : "text-lg sm:text-2xl mb-1.5 sm:mb-2"
              )}
              style={{ fontFamily: "'Anton', sans-serif" }}
            >
              {currentItem.gameTitle}
            </h2>

            {/* Card Game Description - Hidden on ultra-short landscape screens to prevent overflow */}
            {!isShortHeight && (
              <p className="hidden sm:block text-xs sm:text-sm text-white/90 leading-[1.5] mb-3">
                {currentItem.description}
              </p>
            )}

            {/* Quick Room Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onCreateRoom}
                className={cn(
                  "flex items-center gap-1 rounded-xl bg-white text-zinc-900 font-black uppercase tracking-wider shadow-lg hover:bg-zinc-100 active:scale-95 transition-all",
                  isShortHeight ? "px-2.5 py-1.5 text-[10px]" : "px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs"
                )}
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Create Table</span>
              </button>
              <button
                onClick={onJoinRoom}
                className={cn(
                  "flex items-center gap-1 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold uppercase tracking-wider border border-white/30 backdrop-blur-md active:scale-95 transition-all",
                  isShortHeight ? "px-2.5 py-1.5 text-[10px]" : "px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs"
                )}
              >
                <Users className="w-3 h-3 text-white" />
                <span>Join Table</span>
              </button>
            </div>
          </div>

          {/* Two circular navigation buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('prev')}
              disabled={isAnimating}
              title="Previous Game"
              className={cn(
                "rounded-full border-2 border-white flex items-center justify-center text-white transition-all active:scale-95",
                isShortHeight ? "w-8 h-8 sm:w-10 sm:h-10" : "w-11 h-11 sm:w-14 sm:h-14"
              )}
              style={{
                backgroundColor: 'transparent',
                transition: 'transform 150ms, background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ArrowLeft size={isShortHeight ? 18 : 24} strokeWidth={2.25} />
            </button>

            <button
              onClick={() => navigate('next')}
              disabled={isAnimating}
              title="Next Game"
              className={cn(
                "rounded-full border-2 border-white flex items-center justify-center text-white transition-all active:scale-95",
                isShortHeight ? "w-8 h-8 sm:w-10 sm:h-10" : "w-11 h-11 sm:w-14 sm:h-14"
              )}
              style={{
                backgroundColor: 'transparent',
                transition: 'transform 150ms, background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ArrowRight size={isShortHeight ? 18 : 24} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* 6. Bottom-right link */}
        <div className={cn(
          "absolute z-[60]",
          isShortHeight ? "bottom-2 right-3 sm:right-8" : "bottom-4 sm:bottom-12 right-4 sm:right-12"
        )}>
          {currentItem.isAvailable ? (
            <button
              onClick={onCreateRoom}
              className="flex items-center gap-1.5 sm:gap-2 group text-white uppercase transition-opacity duration-200"
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: isShortHeight ? 'clamp(18px, 3.2vw, 36px)' : 'clamp(20px, 3.8vw, 52px)',
                fontWeight: 400,
                opacity: 0.95,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.95')}
            >
              <span>{currentItem.actionText}</span>
              <ArrowRight className="w-4 h-4 sm:w-7 sm:h-7 stroke-[2.25] group-hover:translate-x-1.5 transition-transform" />
            </button>
          ) : (
            <Link
              href="/games"
              className="flex items-center gap-1.5 sm:gap-2 group text-white uppercase transition-opacity duration-200"
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: isShortHeight ? 'clamp(18px, 3.2vw, 36px)' : 'clamp(20px, 3.8vw, 52px)',
                fontWeight: 400,
                opacity: 0.95,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.95')}
            >
              <span>{currentItem.actionText}</span>
              <ArrowRight className="w-4 h-4 sm:w-7 sm:h-7 stroke-[2.25] group-hover:translate-x-1.5 transition-transform" />
            </Link>
          )}
        </div>

      </div>
    </div>
  );
};
