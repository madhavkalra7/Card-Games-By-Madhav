'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Gamepad2, Plus, Users, Music, User, Trophy, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { funkyMusic } from '@/lib/funkyMusic';
import { sounds } from '@/lib/sound';
import { useAuthStore } from '@/store/authStore';
import { useFriendsStore } from '@/store/friendsStore';
import { getAvatarById } from '@/lib/avatars';
import { GameType } from '@/lib/types';

const IMAGES = [
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png',
    bg: '#F4845F',
    panel: '#F79B7F',
    gameTitle: 'DUKKI BAZAAR',
    tagline: 'Classic Indian 52-Card Game',
    description: 'Gather your friends for authentic traditional Indian 52-card action. Establish 4 center suit rails, trigger Bazaar Open, and play online with authoritative table rules.',
    actionText: 'ENTER BAZAAR',
    isAvailable: true,
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png',
    bg: '#6BBF7A',
    panel: '#85CC92',
    gameTitle: 'BHABHO',
    tagline: 'Classic Indian Get-Away Card Game',
    description: 'Iconic traditional Indian get-away card game. Discard matching cards, avoid getting stuck with the highest card, and escape before becoming the Bhabho!',
    actionText: 'PLAY BHABHO',
    isAvailable: true,
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png',
    bg: '#E882B4',
    panel: '#ED9DC4',
    gameTitle: 'DOCTOR',
    tagline: 'Low-Sum Discard & Show Card Game',
    description: 'Shed matching rank sets to drop your hand sum below the Show Limit. Beware of 50-pt Jokers and wrong show penalties. Lowest cumulative score wins!',
    actionText: 'PLAY DOCTOR',
    isAvailable: true,
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.4457fbce.png',
    bg: '#6EB5FF',
    panel: '#8DC4FF',
    gameTitle: 'BLUFF MASTER',
    tagline: 'High-Stakes Deception & Card Shedding',
    description: 'Classic high-stakes card game of deception and bluffing. Play your cards face down, claim the rank, catch lying rivals, and empty your hand to win!',
    actionText: 'PLAY BLUFF MASTER',
    isAvailable: true,
  },
];

interface ToonHeroSectionProps {
  onCreateRoom: (gameType?: GameType) => void;
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
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cg_landing_music') !== 'false';
    }
    return true;
  });

  // Touch and drag swipe state
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);

  // Mouse drag support for desktop/laptop trackpads
  const isMouseDownRef = useRef<boolean>(false);
  const mouseStartXRef = useRef<number>(0);
  const mouseStartTimeRef = useRef<number>(0);

  const user = useAuthStore((s) => s.user);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const setAuthModalOpen = useAuthStore((s) => s.setAuthModalOpen);
  const setProfileModalOpen = useAuthStore((s) => s.setProfileModalOpen);
  const setFriendsModalOpen = useFriendsStore((s) => s.setFriendsModalOpen);

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

    // Auto-start funky music on mount by default
    if (localStorage.getItem('cg_landing_music') !== 'false') {
      funkyMusic.start();
    }

    // Also auto-start or resume on ANY first user gesture (touch, pointer, click, keydown)
    const handleFirstInteraction = () => {
      if (localStorage.getItem('cg_landing_music') !== 'false') {
        funkyMusic.start();
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      unsub();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('pointerdown', handleFirstInteraction);
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

  // Navigation logic with 650ms animation lock + sound effect
  const navigate = (direction: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);
    try {
      sounds.playCardSlide();
    } catch {}
    setActiveIndex((prev) => (direction === 'next' ? (prev + 1) % 4 : (prev + 3) % 4));
    setTimeout(() => {
      setIsAnimating(false);
    }, 650);
  };

  // Direct jump to game index
  const goToIndex = (index: number) => {
    if (index === activeIndex || isAnimating) return;
    setIsAnimating(true);
    try {
      sounds.playCardSlide();
    } catch {}
    setActiveIndex(index);
    setTimeout(() => {
      setIsAnimating(false);
    }, 650);
  };

  // Touch gesture handlers for mobile phone screens
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating || e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimeRef.current = Date.now();
    hasDraggedRef.current = false;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchStartXRef.current === null || touchStartYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartXRef.current;
    const deltaY = currentY - touchStartYRef.current;

    if (Math.abs(deltaX) > 10) {
      hasDraggedRef.current = true;
    }

    // Only respond horizontally so normal vertical scroll is not blocked
    if (Math.abs(deltaX) > Math.abs(deltaY) * 0.75) {
      const clamped = Math.max(-110, Math.min(110, deltaX * 0.75));
      setDragOffset(clamped);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || touchStartXRef.current === null) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - (touchStartYRef.current ?? touchEndY);
    const duration = Math.max(Date.now() - touchStartTimeRef.current, 1);
    const velocity = Math.abs(deltaX) / duration;

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    setIsDragging(false);
    setDragOffset(0);

    if (Math.abs(deltaX) > Math.abs(deltaY) * 0.75) {
      // 38px swipe threshold or fast flick (>0.25px/ms with at least 18px movement)
      const isSwipe = Math.abs(deltaX) > 38 || (Math.abs(deltaX) > 18 && velocity > 0.25);
      if (isSwipe) {
        if (deltaX < 0) {
          navigate('next');
        } else {
          navigate('prev');
        }
      }
    }
  };

  const handleTouchCancel = () => {
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  // Mouse drag handlers for desktop/laptop interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isAnimating) return;
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    isMouseDownRef.current = true;
    mouseStartXRef.current = e.clientX;
    mouseStartTimeRef.current = Date.now();
    hasDraggedRef.current = false;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    const deltaX = e.clientX - mouseStartXRef.current;
    if (Math.abs(deltaX) > 10) {
      hasDraggedRef.current = true;
    }
    const clamped = Math.max(-110, Math.min(110, deltaX * 0.75));
    setDragOffset(clamped);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    const deltaX = e.clientX - mouseStartXRef.current;
    const duration = Math.max(Date.now() - mouseStartTimeRef.current, 1);
    const velocity = Math.abs(deltaX) / duration;

    setIsDragging(false);
    setDragOffset(0);

    const isSwipe = Math.abs(deltaX) > 40 || (Math.abs(deltaX) > 20 && velocity > 0.25);
    if (isSwipe) {
      if (deltaX < 0) {
        navigate('next');
      } else {
        navigate('prev');
      }
    }
  };

  const handleMouseLeave = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  const handleFigurineClick = (role: 'center' | 'left' | 'right' | 'back') => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    if (role === 'left') navigate('prev');
    if (role === 'right') navigate('next');
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
      <div
        className="relative w-full h-[100dvh] min-h-[320px] overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        
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

        {/* 3. Top Header: Brand Label + Navigation (Ultra-responsive on all screen sizes) */}
        <header className={cn(
          "absolute left-[max(0.6rem,env(safe-area-inset-left))] right-[max(0.6rem,env(safe-area-inset-right))] sm:left-8 sm:right-8 z-[60] flex items-center justify-between",
          isShortHeight ? "top-[max(0.5rem,env(safe-area-inset-top))] sm:top-3" : "top-[max(0.75rem,env(safe-area-inset-top))] sm:top-6"
        )}>
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-white/40 shadow-md shrink-0">
              <img src="/logo.png" alt="Card Games Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0 justify-center">
              <span
                className="text-[10px] sm:text-xs font-black uppercase text-white tracking-[0.1em] sm:tracking-[0.18em] whitespace-nowrap"
                style={{ opacity: 0.95 }}
              >
                <span className="sm:hidden">CARD GAMES</span>
                <span className="hidden sm:inline">CARD GAMES BY MADHAV</span>
              </span>
              <span className="hidden md:block text-[9px] text-white/75 font-medium tracking-wider uppercase whitespace-nowrap">
                Traditional Indian 52-Card Platform
              </span>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Funky Music Toggle Button */}
            <button
              type="button"
              onClick={handleToggleMusic}
              title={isMusicPlaying ? 'Pause Funky Music' : 'Play Funky Music'}
              className={cn(
                "flex items-center justify-center rounded-full backdrop-blur-md transition-all shadow-sm active:scale-95 cursor-pointer shrink-0",
                isMusicPlaying
                  ? "bg-amber-400 text-black border border-yellow-200 font-extrabold shadow-lg"
                  : "bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold",
                "w-8 h-8 sm:w-auto sm:h-9 p-0 sm:px-3.5"
              )}
            >
              {isMusicPlaying ? (
                <>
                  <div className="flex items-end gap-0.5 h-3.5 py-0.5 shrink-0">
                    <span className="w-0.5 sm:w-1 bg-black rounded-full animate-bounce" style={{ height: '70%', animationDuration: '400ms' }} />
                    <span className="w-0.5 sm:w-1 bg-black rounded-full animate-bounce" style={{ height: '100%', animationDuration: '280ms' }} />
                    <span className="w-0.5 sm:w-1 bg-black rounded-full animate-bounce" style={{ height: '50%', animationDuration: '500ms' }} />
                  </div>
                  <span className="hidden md:inline ml-1.5 text-[10px] sm:text-xs font-black tracking-wider">FUNKY BEATS</span>
                </>
              ) : (
                <>
                  <Music className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="hidden md:inline ml-1.5 text-[10px] sm:text-xs tracking-wider">MUSIC</span>
                </>
              )}
            </button>

            {/* Rankings & Friends Modal Button */}
            <button
              type="button"
              onClick={() => setFriendsModalOpen(true, 'leaderboard')}
              className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-9 p-0 sm:px-3.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white text-[11px] sm:text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              title="Global Tournament Rankings & Friends"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="hidden sm:inline ml-1.5">Rankings</span>
            </button>

            {/* Catalog Link */}
            <Link
              href="/games"
              className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-9 p-0 sm:px-3.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white text-[11px] sm:text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
              title="View Games Catalog"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="hidden sm:inline ml-1.5">Catalog</span>
            </Link>

            {/* Royal Collectibles Card Album Link */}
            <Link
              href="/album"
              className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-9 p-0 sm:px-3.5 rounded-full bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 hover:from-amber-500/40 hover:to-yellow-500/30 backdrop-blur-md border border-amber-400/60 text-amber-300 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-gold-glow active:scale-95 shrink-0 group"
              title="View Royal Collectibles Card Album (Trump Cards Grimoire)"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300 group-hover:scale-115 transition-transform shrink-0" />
              <span className="hidden sm:inline ml-1.5">Album</span>
            </Link>

            {/* Casino Currency Coins Pill */}
            {user && (
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-1 xs:gap-1.5 h-8 sm:h-9 px-1.5 xs:px-2.5 sm:px-3 rounded-full bg-gradient-to-r from-red-950/70 via-black/80 to-zinc-950/80 hover:from-red-900/80 hover:to-zinc-900/90 border border-red-500/50 hover:border-red-400 backdrop-blur-md transition-all shadow-[0_0_15px_rgba(225,29,72,0.25)] active:scale-95 cursor-pointer shrink-0 group"
                title={`Casino Coins: ${(user.coins ?? 1000).toLocaleString()} Chips (Tap to open vault)`}
              >
                <img
                  src="/icons/casino-chip.png"
                  alt="Casino Coins"
                  className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 object-contain filter drop-shadow animate-pulse group-hover:scale-110 transition-transform shrink-0"
                />
                <span className="font-mono font-black text-[10px] xs:text-xs sm:text-sm text-red-200 tracking-tight whitespace-nowrap">
                  {(user.coins ?? 1000) >= 100000
                    ? `${Math.round((user.coins ?? 1000) / 1000)}k`
                    : (user.coins ?? 1000).toLocaleString()}
                </span>
              </button>
            )}

            {/* Top-Right Circular Cartoon Avatar or Sign In Button */}
            {user ? (
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 h-8 sm:h-9 p-0.5 sm:pl-1 sm:pr-3 rounded-full bg-black/45 hover:bg-black/70 border border-gold/60 backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer group shrink-0"
                title="View Profile & Game Stats"
              >
                {/* Circular Cartoon Avatar */}
                <div
                  className="w-7 h-7 sm:w-7 sm:h-7 rounded-full border-2 border-amber-300 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-gold-glow group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: `${getAvatarById(user.avatarId).color}40` }}
                >
                  <img
                    src={getAvatarById(user.avatarId).image}
                    alt={user.name}
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                </div>

                <div className="hidden sm:flex flex-col items-start text-left leading-none pr-1">
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
                className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-9 p-0 sm:px-3.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black text-[11px] sm:text-xs font-black tracking-wider uppercase backdrop-blur-md shadow-gold-glow transition-all active:scale-95 cursor-pointer shrink-0"
                title="Sign In / Create Account"
              >
                <User className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                <span className="hidden sm:inline ml-1">Sign In</span>
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

            // Interactive drag transformations for dynamic responsiveness
            let activeDragTransform = roleStyle.transform || '';
            let activeOpacity = roleStyle.opacity;
            let activeFilter = roleStyle.filter;

            if (isDragging && dragOffset !== 0) {
              if (role === 'center') {
                // Main figurine tilts and shifts with the finger
                activeDragTransform = `${roleStyle.transform} translateX(${dragOffset * 0.75}px) rotate(${dragOffset * 0.04}deg)`;
              } else if (role === 'left') {
                // If dragging right, reveal left card
                if (dragOffset > 0) {
                  const factor = Math.min(1, dragOffset / 100);
                  activeDragTransform = `${roleStyle.transform} translateX(${dragOffset * 0.4}px) scale(${1 + factor * 0.12})`;
                  activeOpacity = Math.min(1, 0.85 + factor * 0.15);
                  activeFilter = `blur(${Math.max(0, 2 - factor * 2)}px)`;
                }
              } else if (role === 'right') {
                // If dragging left, reveal right card
                if (dragOffset < 0) {
                  const factor = Math.min(1, -dragOffset / 100);
                  activeDragTransform = `${roleStyle.transform} translateX(${dragOffset * 0.4}px) scale(${1 + factor * 0.12})`;
                  activeOpacity = Math.min(1, 0.85 + factor * 0.15);
                  activeFilter = `blur(${Math.max(0, 2 - factor * 2)}px)`;
                }
              }
            }

            return (
              <div
                key={img.src}
                className="cursor-pointer"
                onClick={() => handleFigurineClick(role)}
                style={{
                  position: 'absolute',
                  aspectRatio: '0.6 / 1',
                  transition: isDragging
                    ? 'none'
                    : 'transform 650ms cubic-bezier(0.4, 0, 0.2, 1), filter 650ms cubic-bezier(0.4, 0, 0.2, 1), opacity 650ms cubic-bezier(0.4, 0, 0.2, 1), left 650ms cubic-bezier(0.4, 0, 0.2, 1)',
                  willChange: 'transform, filter, opacity',
                  ...roleStyle,
                  transform: activeDragTransform,
                  opacity: activeOpacity,
                  filter: activeFilter,
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
              ? "bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-[max(0.6rem,env(safe-area-inset-left))] sm:left-6 max-w-[270px] sm:max-w-[340px]"
              : "bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-16 left-[max(0.6rem,env(safe-area-inset-left))] sm:left-12 lg:left-24 max-w-[calc(100vw-20px)] xs:max-w-[320px] sm:max-w-[380px]"
          )}
          style={{
            transform: isDragging ? `translateX(${dragOffset * 0.12}px)` : undefined,
            transition: isDragging ? 'none' : 'transform 250ms ease-out',
          }}
        >
          {/* Glass Card Container */}
          <div className={cn(
            "bg-black/30 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/15 shadow-2xl",
            isShortHeight ? "p-2.5 sm:p-3.5 mb-2" : "p-3 sm:p-5 mb-2.5 sm:mb-3"
          )}>
            {/* Game Tagline */}
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
              {!currentItem.isAvailable && (
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/15 text-white/90 border border-white/20">
                  Coming Soon
                </span>
              )}
              <span className="text-[10px] sm:text-[11px] text-white/85 font-bold uppercase tracking-wider truncate">
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

            {/* Card Game Description - Hidden on mobile screens to keep card compact and prevent overlap */}
            {!isShortHeight && (
              <p className="hidden sm:block text-xs sm:text-sm text-white/90 leading-[1.5] mb-3">
                {currentItem.description}
              </p>
            )}

            {/* Quick Room Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onCreateRoom(activeIndex === 3 ? 'BLUFF_MASTER' : activeIndex === 2 ? 'DOCTOR' : activeIndex === 1 ? 'BHABHO' : 'DUKKI_BAZAAR')}
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

          {/* Navigation Controls: Arrows + Dots */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => navigate('prev')}
              disabled={isAnimating}
              title="Previous Game"
              className={cn(
                "rounded-full border-2 border-white flex items-center justify-center text-white transition-all active:scale-95 shadow-md",
                isShortHeight ? "w-8 h-8 sm:w-10 sm:h-10" : "w-10 h-10 sm:w-14 sm:h-14"
              )}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transition: 'transform 150ms, background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <ArrowLeft className={cn(isShortHeight ? "w-4 h-4" : "w-4 h-4 sm:w-6 sm:h-6")} strokeWidth={2.25} />
            </button>

            {/* Pagination Dots (Clickable + Active Game Indicator) */}
            <div className="flex items-center gap-1.5 px-1 sm:px-2">
              {IMAGES.map((img, i) => (
                <button
                  key={img.gameTitle}
                  type="button"
                  onClick={() => goToIndex(i)}
                  title={`Go to ${img.gameTitle}`}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 cursor-pointer",
                    i === activeIndex
                      ? "w-6 sm:w-7 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                      : "w-2 sm:w-2.5 bg-white/40 hover:bg-white/70"
                  )}
                />
              ))}
            </div>

            <button
              onClick={() => navigate('next')}
              disabled={isAnimating}
              title="Next Game"
              className={cn(
                "rounded-full border-2 border-white flex items-center justify-center text-white transition-all active:scale-95 shadow-md",
                isShortHeight ? "w-8 h-8 sm:w-10 sm:h-10" : "w-10 h-10 sm:w-14 sm:h-14"
              )}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transition: 'transform 150ms, background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <ArrowRight className={cn(isShortHeight ? "w-4 h-4" : "w-4 h-4 sm:w-6 sm:h-6")} strokeWidth={2.25} />
            </button>
          </div>

          {/* Mobile Swipe Guidance Hint */}
          <div className="flex sm:hidden items-center gap-1.5 text-[9px] text-white/75 font-semibold tracking-wider uppercase mt-1 px-1 select-none pointer-events-none">
            <span className="text-white/40">‹</span>
            <span>Swipe screen or tap arrows</span>
            <span className="text-white/40">›</span>
          </div>
        </div>

        {/* 6. Bottom-right link */}
        <div className={cn(
          "absolute z-[60]",
          isShortHeight ? "bottom-[max(0.5rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] sm:right-8" : "bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-12 right-[max(0.75rem,env(safe-area-inset-right))] sm:right-12"
        )}>
          {currentItem.isAvailable ? (
            <button
              onClick={() => onCreateRoom(activeIndex === 3 ? 'BLUFF_MASTER' : 'DUKKI_BAZAAR')}
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
