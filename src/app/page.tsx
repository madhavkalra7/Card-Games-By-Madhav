'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CreateRoomModal } from '@/components/modal/CreateRoomModal';
import { JoinRoomModal } from '@/components/modal/JoinRoomModal';
import { PlayingCard } from '@/components/card/PlayingCard';
import { Card } from '@/lib/types';
import { ArrowRight, Flame, Plus, Users, Gamepad2, Shield, Sparkles } from 'lucide-react';

const FLOATING_BG_CARDS: { card: Card; x: string; y: string; rotate: number; delay: number }[] = [
  { card: { id: 'H-A', suit: 'H', rank: 'A' }, x: '8%', y: '15%', rotate: -14, delay: 0 },
  { card: { id: 'S-K', suit: 'S', rank: 'K' }, x: '82%', y: '18%', rotate: 16, delay: 0.4 },
  { card: { id: 'D-2', suit: 'D', rank: '2' }, x: '12%', y: '65%', rotate: 12, delay: 0.8 },
  { card: { id: 'C-J', suit: 'C', rank: 'J' }, x: '78%', y: '70%', rotate: -18, delay: 0.2 },
  { card: { id: 'H-10', suit: 'H', rank: '10' }, x: '48%', y: '82%', rotate: 6, delay: 0.6 },
];

export default function LandingPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  return (
    <main className="relative min-h-screen bg-[#070d09] text-zinc-100 flex flex-col justify-between overflow-hidden selection:bg-gold selection:text-black">
      
      {/* Background Ambience: Deep green felt glow + Radial vignette */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-900/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Animated Background Playing Cards */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {FLOATING_BG_CARDS.map((item, idx) => (
          <motion.div
            key={item.card.id}
            initial={{ y: 0, rotate: item.rotate }}
            animate={{
              y: [-12, 12, -12],
              rotate: [item.rotate - 3, item.rotate + 3, item.rotate - 3],
            }}
            transition={{
              duration: 5 + idx,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: item.delay,
            }}
            className="absolute hidden md:block opacity-25 hover:opacity-40 transition-opacity"
            style={{ left: item.x, top: item.y }}
          >
            <PlayingCard card={item.card} size="lg" />
          </motion.div>
        ))}
      </div>

      {/* Top Navigation */}
      <nav className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-serif text-black font-black text-xl shadow-gold-glow">
            ♠
          </div>
          <div>
            <span className="font-black text-lg tracking-wider text-white">CARD GAMES</span>
            <span className="block text-[10px] text-gold tracking-widest uppercase font-semibold">
              By Madhav
            </span>
          </div>
        </div>

        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all shadow-md"
        >
          <Gamepad2 className="w-4 h-4 text-gold" />
          <span>Games Catalog</span>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-20 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center text-center">
        
        {/* Quality Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-6 backdrop-blur-md shadow-lg"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span>Traditional Indian 52-Card Realtime Platform • Not A Casino</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white font-serif leading-tight max-w-4xl"
        >
          Card Games <br className="hidden sm:inline" />
          <span className="text-gold-gradient">By Madhav</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl font-normal leading-relaxed"
        >
          Gather your friends, create a private table, and play authentic traditional 52-card table games like <strong className="text-gold font-bold">Dukki Bazaar</strong> online with authoritative server fairness.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          {/* Create Room */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-sm uppercase tracking-wider shadow-gold-glow hover:from-amber-400 hover:to-yellow-300 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Create Room</span>
          </button>

          {/* Join Room */}
          <button
            onClick={() => setIsJoinOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-white font-bold text-sm uppercase tracking-wider border border-white/20 hover:border-gold/60 shadow-xl active:scale-95 transition-all"
          >
            <Users className="w-5 h-5 text-gold" />
            <span>Join Room</span>
          </button>

          {/* Games Button */}
          <Link
            href="/games"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-black/40 hover:bg-black/60 text-zinc-300 hover:text-white font-semibold text-sm border border-zinc-800 transition-all"
          >
            <span>Browse Games</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Feature Highlights Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left"
        >
          <div className="bg-zinc-950/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-black text-white">Authoritative Server</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              100% server-managed card dealing and priority rule validation. No card peaking.
            </p>
          </div>

          <div className="bg-zinc-950/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-gold/30 flex items-center justify-center mb-3">
              <Flame className="w-5 h-5 text-gold" />
            </div>
            <h3 className="text-sm font-black text-white">Physical Felt Table</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Walnut wood rail, 5-player circular seating, and authentic SVG playing card physics.
            </p>
          </div>

          <div className="bg-zinc-950/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-sm font-black text-white">Dukki Bazaar Mechanics</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Bazaar Open unlocking, priority miss enforcement, and animated flying penalty cards.
            </p>
          </div>
        </motion.div>

      </section>

      {/* Footer */}
      <footer className="relative z-20 w-full border-t border-white/5 py-6 text-center text-xs text-zinc-500">
        <p>© 2026 Card Games By Madhav. Traditional Indian 52-Card Multiplayer Platform.</p>
      </footer>

      {/* Modals */}
      <CreateRoomModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinRoomModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />

    </main>
  );
}
