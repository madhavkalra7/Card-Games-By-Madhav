'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MYTHIC_VAULT_CARDS, CollectibleCard } from '@/lib/collectibles';
import { CollectibleCardView } from '@/components/album/CollectibleCardView';
import { CardInspectModal } from '@/components/album/CardInspectModal';
import { useAlbumStore } from '@/store/albumStore';
import { ArrowLeft, Sparkles, Gem, Crown, Shield, BookOpen, Eye } from 'lucide-react';

export default function EditionsShowcasePage() {
  const openInspect = useAlbumStore((s) => s.openInspect);

  // Mythic Vault Cards
  const goldenJoker = MYTHIC_VAULT_CARDS.find((c) => c.id === 'VAULT-GOLDEN-JOKER')!;
  const diamondAce = MYTHIC_VAULT_CARDS.find((c) => c.id === 'VAULT-DIAMOND-ACE')!;
  const silverJack = MYTHIC_VAULT_CARDS.find((c) => c.id === 'VAULT-SILVER-J')!;
  const silverQueen = MYTHIC_VAULT_CARDS.find((c) => c.id === 'VAULT-SILVER-Q')!;
  const silverKing = MYTHIC_VAULT_CARDS.find((c) => c.id === 'VAULT-SILVER-K')!;

  const handleInspect = (card: CollectibleCard) => {
    openInspect(card, true);
  };

  return (
    <div className="min-h-screen bg-[#0d0914] text-stone-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px]" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 border-b border-stone-800/80 bg-black/40 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/album"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/60 transition-all text-xs sm:text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Album</span>
          </Link>
          <div className="h-4 w-px bg-stone-700/60" />
          <h1 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Special Collector Editions
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs text-stone-400 hover:text-stone-200 transition-colors"
          >
            Lobby
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-8">
        {/* Banner */}
        <div className="text-center max-w-2xl mx-auto flex flex-col items-center">
          <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
            Royal Imperial Editions
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-200 via-amber-200 to-cyan-200 bg-clip-text text-transparent font-serif mb-2">
            Silver, Gold & Diamond Editions
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
            Click on any card to open the <strong className="text-stone-200">3D Interactive Tilt & Inspection Modal</strong> with live realistic lighting, metallic reflections, and sound effects.
          </p>
        </div>

        {/* 3 Editions Spotlight Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {/* 1. SILVER EDITION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-700/70 p-5 sm:p-6 flex flex-col items-center justify-between shadow-[0_10px_35px_rgba(148,163,184,0.15)] group hover:border-slate-500 transition-all"
          >
            <div className="w-full flex items-center justify-between text-xs mb-3 text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-600/60 font-semibold text-[11px]">
                <Shield className="w-3.5 h-3.5 text-slate-300" />
                Silver Edition
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                Hallmark 925
              </span>
            </div>

            {/* Card Display */}
            <div className="my-4 flex flex-col items-center">
              <CollectibleCardView
                card={silverQueen}
                isUnlocked={true}
                onClick={() => handleInspect(silverQueen)}
                size="lg"
              />
              <span className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" /> Click to inspect 3D
              </span>
            </div>

            {/* Info */}
            <div className="w-full border-t border-slate-800 pt-4 flex flex-col gap-1.5 text-center">
              <h3 className="text-base font-bold text-slate-100">{silverQueen.name}</h3>
              <p className="text-[11px] text-slate-400 font-hindi">{silverQueen.hindiName}</p>
              <p className="text-xs text-slate-300/80 italic mt-1 line-clamp-2 font-serif">
                &ldquo;{silverQueen.flavorText}&rdquo;
              </p>

              {/* Sub-cards Trio */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2">
                {[silverJack, silverQueen, silverKing].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleInspect(c)}
                    className="px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-700 border border-slate-700/70 text-[10px] text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    {c.rank}♠
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 2. GOLD EDITION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-2xl bg-gradient-to-b from-amber-950/40 via-stone-900/90 to-stone-950/90 border-2 border-amber-500/60 p-5 sm:p-6 flex flex-col items-center justify-between shadow-[0_15px_45px_rgba(245,158,11,0.25)] group hover:border-amber-400 transition-all scale-100 md:-translate-y-2"
          >
            {/* Crown Badge */}
            <div className="w-full flex items-center justify-between text-xs mb-3 text-amber-300">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 font-semibold text-[11px] text-amber-300">
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                24K Gold Edition
              </span>
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-mono font-bold">
                Apex Mythic
              </span>
            </div>

            {/* Card Display */}
            <div className="my-4 flex flex-col items-center">
              <CollectibleCardView
                card={goldenJoker}
                isUnlocked={true}
                onClick={() => handleInspect(goldenJoker)}
                size="lg"
              />
              <span className="text-[10px] text-amber-400 mt-3 flex items-center gap-1">
                <Eye className="w-3 h-3 text-amber-400" /> Click to inspect 3D
              </span>
            </div>

            {/* Info */}
            <div className="w-full border-t border-amber-900/60 pt-4 flex flex-col gap-1.5 text-center">
              <h3 className="text-base font-bold text-amber-200">{goldenJoker.name}</h3>
              <p className="text-[11px] text-amber-300/80 font-hindi">{goldenJoker.hindiName}</p>
              <p className="text-xs text-amber-200/70 italic mt-1 line-clamp-2 font-serif">
                &ldquo;{goldenJoker.flavorText}&rdquo;
              </p>
              <div className="mt-2 inline-flex items-center justify-center gap-2 text-[10px] font-mono text-amber-400 bg-amber-500/10 py-1 px-3 rounded-lg border border-amber-500/20">
                <span>Power: 999</span>
                <span>•</span>
                <span>Drop Rate: ~1%</span>
              </div>
            </div>
          </motion.div>

          {/* 3. DIAMOND EDITION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative rounded-2xl bg-gradient-to-b from-cyan-950/40 via-stone-900/90 to-stone-950/90 border border-cyan-500/60 p-5 sm:p-6 flex flex-col items-center justify-between shadow-[0_15px_45px_rgba(56,189,248,0.25)] group hover:border-cyan-400 transition-all"
          >
            <div className="w-full flex items-center justify-between text-xs mb-3 text-cyan-300">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/60 font-semibold text-[11px] text-cyan-300">
                <Gem className="w-3.5 h-3.5 text-cyan-300 fill-cyan-300" />
                Diamond Edition
              </span>
              <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-mono font-bold">
                Apex Jewel
              </span>
            </div>

            {/* Card Display */}
            <div className="my-4 flex flex-col items-center">
              <CollectibleCardView
                card={diamondAce}
                isUnlocked={true}
                onClick={() => handleInspect(diamondAce)}
                size="lg"
              />
              <span className="text-[10px] text-cyan-400 mt-3 flex items-center gap-1">
                <Eye className="w-3 h-3 text-cyan-400" /> Click to inspect 3D
              </span>
            </div>

            {/* Info */}
            <div className="w-full border-t border-cyan-900/60 pt-4 flex flex-col gap-1.5 text-center">
              <h3 className="text-base font-bold text-cyan-200">{diamondAce.name}</h3>
              <p className="text-[11px] text-cyan-300/80 font-hindi">{diamondAce.hindiName}</p>
              <p className="text-xs text-cyan-200/70 italic mt-1 line-clamp-2 font-serif">
                &ldquo;{diamondAce.flavorText}&rdquo;
              </p>
              <div className="mt-2 inline-flex items-center justify-center gap-2 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 py-1 px-3 rounded-lg border border-cyan-500/20">
                <span>Power: 1000</span>
                <span>•</span>
                <span>Drop Rate: ~0.8%</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Comparison Table */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4 sm:p-6">
          <h4 className="text-sm font-bold text-stone-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" /> Edition Design Architecture
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-800 text-stone-400">
                  <th className="pb-2 font-medium">Edition</th>
                  <th className="pb-2 font-medium">Foundation Vector Card</th>
                  <th className="pb-2 font-medium">Special Layered FX</th>
                  <th className="pb-2 font-medium">Watermark Stamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                <tr>
                  <td className="py-2.5 font-bold text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-300" /> Silver
                  </td>
                  <td className="py-2.5">Authentic Royal Jacks, Queens & Kings</td>
                  <td className="py-2.5">Quicksilver chrome gleam, metallic border</td>
                  <td className="py-2.5 font-mono text-slate-400">SILVER 925</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> Gold
                  </td>
                  <td className="py-2.5">Authentic Smiling Jester Joker</td>
                  <td className="py-2.5">24K Gold particles, radiant gold glitter</td>
                  <td className="py-2.5 font-mono text-amber-400">24K GOLD</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-cyan-300 flex items-center gap-1.5">
                    <Gem className="w-3.5 h-3.5 text-cyan-300" /> Diamond
                  </td>
                  <td className="py-2.5">Authentic Ornate Ace of Spades</td>
                  <td className="py-2.5">Prismatic celestial cyan shine & sparkle</td>
                  <td className="py-2.5 font-mono text-cyan-400">DIAMOND GEM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 3D Interactive Inspection Modal */}
      <CardInspectModal />
    </div>
  );
}
