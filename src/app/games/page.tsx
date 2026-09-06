'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CreateRoomModal } from '@/components/modal/CreateRoomModal';
import { JoinRoomModal } from '@/components/modal/JoinRoomModal';
import { RulesModal } from '@/components/modal/RulesModal';
import { useGameStore } from '@/store/gameStore';
import { sounds } from '@/lib/sound';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Lock,
  Play,
  Plus,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameItem {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  players: string;
  deck: string;
  status: 'available' | 'locked';
  badge: string;
  color: string;
  panelColor: string;
  image: string;
  avatarName: string;
  description: string;
}

const GAMES: GameItem[] = [
  {
    id: 'dukki-bazaar',
    title: 'DUKKI BAZAAR',
    subtitle: 'Classic Indian Table Game',
    tagline: 'Match Center Bazaar, open your stall & build 4 suit rails!',
    players: '2 - 5 Players',
    deck: '52 Cards',
    status: 'available',
    badge: 'Available Now',
    color: '#F4845F',
    panelColor: '#F79B7F',
    image: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png',
    avatarName: 'Hearts Master',
    description: 'Each player has a hidden deck and an open right deck. Match the center Bazaar card or build on right decks once open. Center plays have absolute priority — miss it and suffer the flying penalty cards!',
  },
  {
    id: 'mendicot',
    title: 'MENDICOT',
    subtitle: 'Dehla Pakad 2v2 Trick Taking',
    tagline: 'Capture the four 10s (Dehlas) with your partner in this iconic game.',
    players: '4 Players (2v2)',
    deck: '52 Cards',
    status: 'locked',
    badge: 'Coming Soon',
    color: '#6BBF7A',
    panelColor: '#85CC92',
    image: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png',
    avatarName: 'Clubs Tactician',
    description: 'Capture highest rank tricks, seize all four 10s for the ultimate Mendicot victory, and cut suits with trump cards.',
  },
  {
    id: 'teen-do-paanch',
    title: 'TEEN DO PAANCH',
    subtitle: '3-Player 30-Card Quota Battle',
    tagline: 'Hit your target quota (3, 2, or 5 hands) and steal cards from opponents.',
    players: '3 Players',
    deck: '30 Cards',
    status: 'locked',
    badge: 'Coming Soon',
    color: '#E882B4',
    panelColor: '#ED9DC4',
    image: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png',
    avatarName: 'Diamonds Shield',
    description: 'A fiercely competitive 3-player trick-taking game played with 30 cards. Secure your hands or surrender cards next round.',
  },
  {
    id: 'satte-pe-satta',
    title: 'SATTE PE SATTA',
    subtitle: '7 on 7 Suit Ladders Strategy',
    tagline: 'Start from the 7 of Hearts and build out suit ladders to empty your hand.',
    players: '3 - 8 Players',
    deck: '52 Cards',
    status: 'locked',
    badge: 'Coming Soon',
    color: '#6EB5FF',
    panelColor: '#8DC4FF',
    image: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.4457fbce.png',
    avatarName: 'Spades Strategist',
    description: 'A classic sequence shedding game where players strategically block opponents while building out full suits from 7.',
  },
];

export default function GamesPage() {
  const { isRulesModalOpen, setRulesModalOpen } = useGameStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <main
      className="relative min-h-screen bg-[#0e0c12] text-zinc-100 flex flex-col justify-between overflow-x-hidden overflow-y-auto selection:bg-white selection:text-black"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* 1. Grain overlay matching landing page */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
          opacity: 0.35,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* 2. Ambient Colored Flares from the 4 Game Colors */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-[#F4845F]/15 rounded-full blur-[140px]" />
        <div className="absolute -top-32 -right-32 w-[550px] h-[550px] bg-[#6BBF7A]/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 -left-32 w-[550px] h-[550px] bg-[#E882B4]/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-[#6EB5FF]/15 rounded-full blur-[140px]" />
      </div>

      {/* 3. Top Navigation matching Landing Page */}
      <header className="relative z-30 w-full px-3 sm:px-8 py-3 sm:py-5 flex items-center justify-between border-b border-white/10 bg-black/30 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-xs sm:text-sm border border-white/30 shadow-sm group-hover:scale-105 transition-transform">
            ♠
          </div>
          <div>
            <span
              className="text-[10px] sm:text-xs font-semibold uppercase text-white tracking-[0.16em] sm:tracking-[0.18em] block"
              style={{ opacity: 0.9 }}
            >
              CARD GAMES BY MADHAV
            </span>
            <span className="hidden sm:block text-[9px] text-white/70 font-medium tracking-wider uppercase">
              Traditional Indian 52-Card Platform
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" />
            <span>Home</span>
          </Link>

          <button
            onClick={() => setRulesModalOpen(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all active:scale-95"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* 4. Main Catalog Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-10 w-full flex-1">
        
        {/* Page Title & Intro */}
        <div className="mb-5 sm:mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] sm:text-xs font-bold mb-2 sm:mb-3 backdrop-blur-md">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-300" />
            <span className="tracking-wide">TRADITIONAL 52-CARD CATALOG • 4 INDIAN FORMATS</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase"
            style={{ fontFamily: "'Anton', sans-serif" }}
          >
            SELECT YOUR GAME
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-base text-zinc-300 max-w-2xl leading-relaxed">
            Choose an authentic Indian table card game. Create private tables with custom room codes, invite friends, and play with authoritative server fairness.
          </p>
        </div>

        {/* 5. Games Grid - Colored & Styled matching landing page figurines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-7">
          {GAMES.map((game, idx) => {
            const isAvailable = game.status === 'available';

            return (
              <div
                key={game.id}
                className={cn(
                  'group relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 flex flex-col justify-between overflow-hidden transition-all duration-300',
                  'border backdrop-blur-md shadow-2xl',
                  isAvailable
                    ? 'hover:-translate-y-1 hover:scale-[1.01]'
                    : 'opacity-90 hover:opacity-100'
                )}
                style={{
                  background: `linear-gradient(135deg, ${game.color}22 0%, rgba(18, 16, 24, 0.75) 45%, rgba(10, 8, 14, 0.95) 100%)`,
                  borderColor: isAvailable ? `${game.color}66` : 'rgba(255, 255, 255, 0.12)',
                  boxShadow: isAvailable ? `0 15px 40px -10px ${game.color}35` : undefined,
                }}
              >
                {/* 3D Character Figurine Illustration on Right */}
                <div className="absolute -right-2 sm:right-2 -bottom-4 sm:bottom-0 pointer-events-none select-none opacity-40 group-hover:opacity-65 transition-opacity duration-300 z-0">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-32 h-44 sm:w-40 sm:h-52 object-contain object-bottom filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
                    draggable={false}
                  />
                </div>

                {/* Subtle Game Index Watermark in Anton font */}
                <div
                  className="absolute top-2 right-4 pointer-events-none select-none opacity-10 text-white font-black text-6xl sm:text-7xl"
                  style={{ fontFamily: "'Anton', sans-serif" }}
                >
                  0{idx + 1}
                </div>

                {/* Card Content (Relative above image) */}
                <div className="relative z-10">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider',
                        isAvailable
                          ? 'text-black shadow-md'
                          : 'bg-white/15 text-white/90 border border-white/20'
                      )}
                      style={{
                        backgroundColor: isAvailable ? game.color : undefined,
                      }}
                    >
                      {game.badge}
                    </span>

                    <div className="flex items-center gap-2.5 text-[11px] sm:text-xs text-white/70 font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" style={{ color: game.color }} />
                        {game.players}
                      </span>
                      <span>•</span>
                      <span>{game.deck}</span>
                    </div>
                  </div>

                  {/* Title in Anton Font */}
                  <h2
                    className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase leading-tight"
                    style={{ fontFamily: "'Anton', sans-serif" }}
                  >
                    {game.title}
                  </h2>

                  {/* Subtitle & Tagline */}
                  <p
                    className="text-xs font-bold uppercase tracking-wider mt-1"
                    style={{ color: game.panelColor }}
                  >
                    {game.subtitle}
                  </p>

                  <p className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md">
                    {game.description}
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div className="relative z-10 mt-4 sm:mt-8 pt-3.5 sm:pt-5 border-t border-white/15 flex flex-wrap items-center gap-2 sm:gap-2.5">
                  {isAvailable ? (
                    <>
                      <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#0e0c12',
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Create Table</span>
                      </button>

                      <button
                        onClick={() => setIsJoinOpen(true)}
                        className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wider border border-white/25 backdrop-blur-md active:scale-95 transition-all"
                      >
                        <Users className="w-3.5 h-3.5 text-white" />
                        <span>Join Table</span>
                      </button>

                      <button
                        onClick={() => setRulesModalOpen(true)}
                        className="p-2.5 sm:p-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95"
                        title="View Dukki Bazaar Rules"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-white/50" />
                        <span className="font-medium">Game is in development</span>
                      </div>
                      <span className="text-[11px] font-mono text-white/50 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Locked
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Footer */}
      <footer className="relative z-20 w-full border-t border-white/10 py-6 text-center text-xs text-zinc-400 bg-black/40 backdrop-blur-md">
        <p>© 2026 Card Games By Madhav. Traditional Indian 52-Card Multiplayer Platform.</p>
      </footer>

      {/* Modals */}
      <CreateRoomModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinRoomModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      <RulesModal isOpen={isRulesModalOpen} onClose={() => setRulesModalOpen(false)} />
    </main>
  );
}
