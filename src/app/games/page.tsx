'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { CreateRoomModal } from '@/components/modal/CreateRoomModal';
import { JoinRoomModal } from '@/components/modal/JoinRoomModal';
import { RulesModal } from '@/components/modal/RulesModal';
import { useGameStore } from '@/store/gameStore';
import { Lock, Play, Sparkles, Users, BookOpen, Clock } from 'lucide-react';
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
  description: string;
}

const GAMES: GameItem[] = [
  {
    id: 'dukki-bazaar',
    title: 'Dukki Bazaar',
    subtitle: 'Classic Indian Table Game',
    tagline: 'Match Center Bazaar, open your stall, and challenge your friends with penalties!',
    players: '3 - 5 Players',
    deck: '52 Cards',
    status: 'available',
    badge: 'Available Now',
    description: 'Each player has a hidden deck and an open right deck. Match the center Bazaar card or build on right decks once open. Center plays have absolute priority — miss it and suffer the flying penalty cards!',
  },
  {
    id: 'mendicot',
    title: 'Mendicot (Dehla Pakad)',
    subtitle: 'Trick-Taking Indian Classic',
    tagline: 'Capture the four 10s (Dehlas) with your partner in this iconic partnership game.',
    players: '4 Players (2v2)',
    deck: '52 Cards',
    status: 'locked',
    badge: 'Coming Soon',
    description: 'Capture highest rank tricks, seize all four 10s for the ultimate Mendicot victory, and cut suits with trump cards.',
  },
  {
    id: 'teen-do-paanch',
    title: 'Teen Do Paanch (3-2-5)',
    subtitle: '3-Player Trick Game',
    tagline: 'Hit your target quota (3, 2, or 5 hands) and steal cards from opponents.',
    players: '3 Players',
    deck: '30 Cards',
    status: 'locked',
    badge: 'Coming Soon',
    description: 'A fiercely competitive 3-player trick-taking game played with 30 cards. Secure your hands or surrender cards next round.',
  },
  {
    id: 'satte-pe-satta',
    title: 'Satte Pe Satta (7 on 7)',
    subtitle: 'Suit Shedding Strategy',
    tagline: 'Start from the 7 of Hearts and build out suit ladders to empty your hand.',
    players: '3 - 8 Players',
    deck: '52 Cards',
    status: 'locked',
    badge: 'Coming Soon',
    description: 'A classic sequence shedding game where players strategically block opponents while building out full suits from 7.',
  },
];

export default function GamesPage() {
  const { isRulesModalOpen, setRulesModalOpen } = useGameStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#070d09] text-zinc-100 flex flex-col justify-between">
      <Header />

      <div className="max-w-6xl mx-auto px-6 py-10 w-full flex-1">
        {/* Page Title */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-gold/40 text-gold text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Games Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-tight">
            Select Your Game
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl">
            Choose from authentic traditional Indian card games. Create private tables to play with your friends online.
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GAMES.map((game) => {
            const isAvailable = game.status === 'available';

            return (
              <div
                key={game.id}
                className={cn(
                  'relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300',
                  'border backdrop-blur-md shadow-2xl',
                  isAvailable
                    ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 border-gold/70 shadow-gold-glow hover:border-gold'
                    : 'bg-zinc-950/60 border-zinc-800/80 opacity-80'
                )}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider',
                        isAvailable
                          ? 'bg-gold text-black shadow'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      )}
                    >
                      {game.badge}
                    </span>

                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        {game.players}
                      </span>
                      <span>•</span>
                      <span>{game.deck}</span>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-serif">
                    {game.title}
                  </h2>
                  <p className="text-xs font-bold text-gold uppercase tracking-wider mt-1">
                    {game.subtitle}
                  </p>

                  <p className="mt-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {game.description}
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3">
                  {isAvailable ? (
                    <>
                      <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-gold-glow hover:from-amber-400 hover:to-yellow-300 active:scale-95 transition-all"
                      >
                        <Play className="w-4 h-4 fill-black" />
                        <span>Create Table</span>
                      </button>

                      <button
                        onClick={() => setIsJoinOpen(true)}
                        className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 active:scale-95 transition-all"
                      >
                        <Users className="w-4 h-4 text-gold" />
                        <span>Join Table</span>
                      </button>

                      <button
                        onClick={() => setRulesModalOpen(true)}
                        className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-gold/60 text-zinc-300 hover:text-gold transition-all"
                        title="View Official Rules"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-zinc-500" />
                        <span>Game is in development</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
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

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 text-center text-xs text-zinc-500">
        <p>© 2026 Card Games By Madhav. Built for real-time multiplayer traditional card games.</p>
      </footer>

      {/* Modals */}
      <CreateRoomModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinRoomModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      <RulesModal isOpen={isRulesModalOpen} onClose={() => setRulesModalOpen(false)} />
    </main>
  );
}
