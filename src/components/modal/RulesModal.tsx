'use client';

import React, { useState, useEffect } from 'react';
import { GameType } from '@/lib/types';
import { useGameStore } from '@/store/gameStore';
import {
  BookOpen,
  CheckCircle2,
  Flame,
  ShieldAlert,
  X,
  Trophy,
  AlertTriangle,
  Users,
  Layers,
  Target,
  ArrowRight,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ExtendedGameType = GameType | 'DOCTOR';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGameType?: GameType;
}

interface GameThemeInfo {
  title: string;
  hindi: string;
  tagline: string;
  color: string;
  panelColor: string;
  glowColor: string;
  heroImage: string;
  players: string;
  deck: string;
  styleBadge: string;
  objective: string;
}

const GAME_THEMES: Record<ExtendedGameType, GameThemeInfo> = {
  DUKKI_BAZAAR: {
    title: 'DUKKI BAZAAR',
    hindi: 'दुक्की बाज़ार',
    tagline: 'Classic Indian 52-Card Rail Game',
    color: '#F4845F',
    panelColor: '#F79B7F',
    glowColor: 'rgba(244, 132, 95, 0.35)',
    heroImage:
      'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png',
    players: '2 - 5 Players',
    deck: '52 Standard Cards',
    styleBadge: 'Authentic Rail Building',
    objective:
      'Establish the 4 center suit foundations, trigger Bazaar Open, and be the first player to empty both your Left (Hidden) and Right (Open) card decks!',
  },
  BHABHO: {
    title: 'BHABHO',
    hindi: 'भाभो / ठुल्ला / गेटअवे',
    tagline: 'Classic Indian Get-Away Card Game',
    color: '#6BBF7A',
    panelColor: '#85CC92',
    glowColor: 'rgba(107, 191, 122, 0.35)',
    heroImage:
      'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png',
    players: '2 - 5 Players',
    deck: '52 Standard Cards',
    styleBadge: 'Trick Shedding & Escape',
    objective:
      'Follow lead suit, avoid getting slapped with a Thulla penalty pile, and discard your entire hand to escape. The last remaining player is the Bhabho loser!',
  },
  BLUFF_MASTER: {
    title: 'BLUFF MASTER',
    hindi: 'ब्लाफ़ मास्टर / 420',
    tagline: 'High-Stakes Deception & Card Shedding',
    color: '#6EB5FF',
    panelColor: '#8DC4FF',
    glowColor: 'rgba(110, 181, 255, 0.35)',
    heroImage:
      'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.4457fbce.png',
    players: '2 - 5 Players',
    deck: '52 Standard Cards',
    styleBadge: 'Bluff & Challenge',
    objective:
      'Play cards face-down declaring rank convincingly. Tell the truth or bluff, challenge suspected liars on "Show!", and empty your hand to win!',
  },
  DOCTOR: {
    title: 'DOCTOR',
    hindi: 'डॉक्टर / लो सम (Low Sum)',
    tagline: 'Shed Matching Sets, Minimize Hand Sum & Declare Show!',
    color: '#E882B4',
    panelColor: '#ED9DC4',
    glowColor: 'rgba(232, 130, 180, 0.35)',
    heroImage:
      'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png',
    players: '2 - 5 Players',
    deck: '55-Card Deck (52 Cards + 3 Jokers)',
    styleBadge: 'Low-Sum Discard & Show',
    objective:
      'Minimize your hand sum below the Show Limit. Discard matching rank sets (pairs, triples, quads), avoid 50-pt Jokers, and declare "SHOW!". The lowest hand sum scores 0 PTS; wrong show incurs a +50 PTS penalty per player!',
  },
};

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  defaultGameType,
}) => {
  const activeGameType = useGameStore((s) => s.gameState?.gameType);
  const [selectedTab, setSelectedTab] = useState<ExtendedGameType>(
    defaultGameType || activeGameType || 'DUKKI_BAZAAR'
  );

  useEffect(() => {
    if (defaultGameType) {
      setSelectedTab(defaultGameType);
    } else if (activeGameType) {
      setSelectedTab(activeGameType);
    }
  }, [defaultGameType, activeGameType, isOpen]);

  if (!isOpen) return null;

  const currentTheme = GAME_THEMES[selectedTab] || GAME_THEMES.DUKKI_BAZAAR;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92vh] bg-zinc-950 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300"
        style={{
          border: `2px solid ${currentTheme.color}80`,
          boxShadow: `0 0 50px -10px ${currentTheme.glowColor}`,
        }}
      >
        {/* Subtle Ambient Background Gradient matching Active Game */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-500"
          style={{ backgroundColor: currentTheme.color }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-15 transition-all duration-500"
          style={{ backgroundColor: currentTheme.color }}
        />

        {/* 1. Modal Top Header */}
        <div className="relative z-10 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-white/10 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className="p-2 sm:p-2.5 rounded-xl border shrink-0 transition-colors duration-300 shadow-sm"
              style={{
                backgroundColor: `${currentTheme.color}20`,
                borderColor: `${currentTheme.color}60`,
                color: currentTheme.color,
              }}
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.25]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-black text-white uppercase tracking-wider">
                  Game Rules Handbook
                </h2>
                <span
                  className="hidden xs:inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors duration-300"
                  style={{
                    backgroundColor: `${currentTheme.color}25`,
                    color: currentTheme.color,
                    border: `1px solid ${currentTheme.color}50`,
                  }}
                >
                  {currentTheme.styleBadge}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-400">
                Official traditional table mechanics &amp; fair-play guide
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Close Rules Handbook"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Synced Tabs matching Home Screen Colours */}
        <div className="relative z-10 px-4 sm:px-6 pt-3 pb-2.5 shrink-0 bg-black/40 border-b border-white/5">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* Dukki Bazaar Tab */}
            <button
              type="button"
              onClick={() => setSelectedTab('DUKKI_BAZAAR')}
              className={cn(
                'px-3 sm:px-4 py-1.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 select-none',
                selectedTab === 'DUKKI_BAZAAR'
                  ? 'bg-[#F4845F] text-black shadow-[0_2px_12px_rgba(244,132,95,0.4)] scale-[1.02]'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10'
              )}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Dukki Bazaar</span>
            </button>

            {/* Bhabho Tab */}
            <button
              type="button"
              onClick={() => setSelectedTab('BHABHO')}
              className={cn(
                'px-3 sm:px-4 py-1.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 select-none',
                selectedTab === 'BHABHO'
                  ? 'bg-[#6BBF7A] text-black shadow-[0_2px_12px_rgba(107,191,122,0.4)] scale-[1.02]'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10'
              )}
            >
              <span className="text-sm leading-none">♠</span>
              <span>Bhabho</span>
            </button>

            {/* Bluff Master Tab */}
            <button
              type="button"
              onClick={() => setSelectedTab('BLUFF_MASTER')}
              className={cn(
                'px-3 sm:px-4 py-1.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 select-none',
                selectedTab === 'BLUFF_MASTER'
                  ? 'bg-[#6EB5FF] text-black shadow-[0_2px_12px_rgba(110,181,255,0.4)] scale-[1.02]'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10'
              )}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Bluff Master</span>
            </button>

            {/* Doctor Tab */}
            <button
              type="button"
              onClick={() => setSelectedTab('DOCTOR')}
              className={cn(
                'px-3 sm:px-4 py-1.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 select-none',
                selectedTab === 'DOCTOR'
                  ? 'bg-[#E882B4] text-black shadow-[0_2px_12px_rgba(232,130,180,0.4)] scale-[1.02]'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10'
              )}
            >
              <span className="text-xs">🩺</span>
              <span>Doctor</span>
            </button>
          </div>
        </div>

        {/* 3. Scrollable Rules Content */}
        <div className="relative z-10 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 text-xs sm:text-sm text-zinc-300 flex-1">
          {/* Game Showcase Hero Card */}
          <div
            className="rounded-2xl p-3.5 sm:p-5 border transition-all duration-300 flex flex-col xs:flex-row items-center justify-between gap-3 overflow-hidden relative shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.color}25 0%, rgba(20, 20, 25, 0.85) 60%, rgba(10, 10, 15, 0.95) 100%)`,
              borderColor: `${currentTheme.color}50`,
            }}
          >
            {/* Left Content */}
            <div className="flex-1 min-w-0 z-10 text-center xs:text-left">
              <div className="flex items-center justify-center xs:justify-start gap-2 mb-1">
                <span
                  className="font-bold text-[10px] sm:text-xs tracking-wider uppercase"
                  style={{ color: currentTheme.color }}
                >
                  {currentTheme.hindi}
                </span>
                <span className="text-zinc-500 text-xs">•</span>
                <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">
                  {currentTheme.tagline}
                </span>
              </div>

              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide uppercase leading-tight mb-2"
                style={{ fontFamily: "'Anton', sans-serif" }}
              >
                {currentTheme.title}
              </h1>

              {/* Specs Row */}
              <div className="flex flex-wrap items-center justify-center xs:justify-start gap-1.5 sm:gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 border border-white/10 text-white/90 text-[10px] sm:text-[11px] font-bold">
                  <Users className="w-3 h-3" style={{ color: currentTheme.color }} />
                  <span>{currentTheme.players}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 border border-white/10 text-white/90 text-[10px] sm:text-[11px] font-bold">
                  <Layers className="w-3 h-3" style={{ color: currentTheme.color }} />
                  <span>{currentTheme.deck}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 border border-white/10 text-white/90 text-[10px] sm:text-[11px] font-bold">
                  <Target className="w-3 h-3" style={{ color: currentTheme.color }} />
                  <span>Objective Game</span>
                </span>
              </div>

              {/* Objective Banner */}
              <div
                className="rounded-xl p-2.5 text-xs text-zinc-200 border text-left"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderColor: `${currentTheme.color}35`,
                }}
              >
                <div className="flex items-start gap-2">
                  <Target
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: currentTheme.color }}
                  />
                  <div>
                    <strong className="text-white">Match Objective:</strong>{' '}
                    <span>{currentTheme.objective}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Character Figurine (From Home Screen) */}
            <div className="shrink-0 w-24 h-28 sm:w-28 sm:h-32 flex items-center justify-center z-10 pointer-events-none select-none">
              <img
                src={currentTheme.heroImage}
                alt={currentTheme.title}
                className="w-full h-full object-contain filter drop-shadow-2xl hover:scale-105 transition-transform"
                draggable={false}
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: DUKKI BAZAAR STRUCTURED RULES                           */}
          {/* ============================================================== */}
          {selectedTab === 'DUKKI_BAZAAR' && (
            <div className="space-y-3.5">
              {/* Step 1: Table & Player Setup */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#F4845F]/20 text-[#F4845F] border border-[#F4845F]/40 flex items-center justify-center font-mono font-black text-xs">
                      01
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                      Player Decks &amp; Table Setup
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Equal Deal</span>
                </div>

                <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm">
                  The standard 52-card deck is dealt equally among active players. Each player has two separate decks:
                </p>

                {/* 2 Deck Visual Representation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-start gap-2.5">
                    <div className="w-8 h-10 rounded-md bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xs shrink-0 font-bold text-zinc-400 shadow-sm">
                      🎴
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">Left Deck (Hidden Stack)</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                        Face-down draw stack. Neither you nor opponents can inspect cards until drawn on your turn.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-[#F4845F]/30 flex items-start gap-2.5">
                    <div className="w-8 h-10 rounded-md bg-[#F4845F]/20 border-2 border-[#F4845F] flex items-center justify-center text-xs shrink-0 font-bold text-[#F4845F] shadow-sm">
                      🃏
                    </div>
                    <div>
                      <h4 className="font-bold text-[#F4845F] text-xs">Right Deck (Open Pile)</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                        Face-up building pile. Only the top card is exposed to the table. Open for sequential building once Bazaar is open!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: The 4 Center Foundations */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#F4845F]/20 text-[#F4845F] border border-[#F4845F]/40 flex items-center justify-center font-mono font-black text-xs">
                      02
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                      The 4 Center Foundations (Bazaar)
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#F4845F] font-bold font-mono">By Suit</span>
                </div>

                <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm">
                  At the beginning of each match, 1 card is drawn to establish the <strong className="text-[#F4845F]">Base Rank</strong> (for example: <code className="px-1.5 py-0.5 rounded bg-black/60 text-[#F4845F] font-bold">4♣</code>).
                </p>

                {/* 4 Center Suits Diagram */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-base text-zinc-200">♠ Spades</span>
                    <span className="block text-[10px] text-zinc-400 mt-0.5">Base ➔ Rail</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-base text-red-400">♥ Hearts</span>
                    <span className="block text-[10px] text-zinc-400 mt-0.5">Base ➔ Rail</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-base text-zinc-200">♣ Clubs</span>
                    <span className="block text-[10px] text-zinc-400 mt-0.5">Base ➔ Rail</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-base text-red-400">♦ Diamonds</span>
                    <span className="block text-[10px] text-zinc-400 mt-0.5">Base ➔ Rail</span>
                  </div>
                </div>

                {/* Rail Cycling Formula */}
                <div className="p-2.5 rounded-xl bg-black/60 border border-[#F4845F]/30 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-zinc-300">
                  <span className="text-zinc-400 font-sans font-bold">Ascending Sequence:</span>
                  <div className="flex items-center gap-1 font-bold text-[#F4845F] flex-wrap">
                    <span>Base Rank</span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    <span>Next Rank</span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    <span>K</span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    <span>A</span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    <span>2...</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Crucial Priority Rule */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-red-950/30 border border-red-500/50 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-red-500/20 text-red-400 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-red-400 uppercase tracking-wide">
                    03 • The Absolute Priority Rule (Strict Penalty!)
                  </h3>
                </div>

                <p className="text-zinc-200 leading-relaxed text-xs sm:text-sm">
                  <strong>The Center Bazaar ALWAYS takes 100% absolute priority over player decks.</strong>
                </p>

                <div className="p-3 rounded-xl bg-black/60 border border-red-500/30 space-y-1.5 text-xs">
                  <div className="flex items-start gap-2 text-red-200">
                    <span className="font-bold text-red-400">🚨 Center Placement:</span>
                    <span>If your drawn card can fit onto any open center foundation rail, you <strong>MUST</strong> play it in the center.</span>
                  </div>
                  <div className="flex items-start gap-2 text-zinc-300">
                    <span className="font-bold text-red-400">⚠️ Penalty:</span>
                    <span>Placing a card on your right deck when it belonged in the center is an <strong>illegal move</strong>. You collect penalty cards and immediately lose your turn!</span>
                  </div>
                </div>
              </div>

              {/* Step 4: Victory Condition */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F4845F]/10 border border-[#F4845F]/40 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#F4845F]/20 text-[#F4845F] shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                    04 • Winning the Match
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm mt-0.5 leading-relaxed">
                    The very first player to completely empty <strong>BOTH</strong> their Left (Hidden) and Right (Open) decks triggers an immediate match victory! Other active players continue fighting for 2nd, 3rd, and 4th place.
                  </p>
                </div>
              </div>

              {/* Pro Strategy Tip */}
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-start gap-2.5 text-xs text-zinc-400">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Pro Khiladi Tip:</strong> Watch opponents&apos; open right decks closely. Once your own Bazaar is open, you can play matching sequential cards directly onto your opponents&apos; piles to slow them down!
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: BHABHO STRUCTURED RULES                                 */}
          {/* ============================================================== */}
          {selectedTab === 'BHABHO' && (
            <div className="space-y-3.5">
              {/* Step 1: Core Goal */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#6BBF7A]/20 text-[#6BBF7A] border border-[#6BBF7A]/40 flex items-center justify-center font-mono font-black text-xs">
                      01
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                      Objective: Shed Your Cards &amp; Escape!
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#6BBF7A] font-bold font-mono">Survival Game</span>
                </div>

                <p className="text-zinc-200 leading-relaxed text-xs sm:text-sm">
                  Bhabho (also known as <em>Getaway</em> or <em>Thulla</em>) is <strong>NOT</strong> a point-collection game. Your sole mission is to shed all your cards safely and escape the table.
                </p>
                <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-200">
                  <span className="font-bold text-red-400">The Sole Loser:</span> The game continues until only <strong>one lone player</strong> remains holding cards. That final player is crowned the <strong className="text-red-400">BHABHO</strong>!
                </div>
              </div>

              {/* Step 2: Opening Move */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#6BBF7A]/20 text-[#6BBF7A] border border-[#6BBF7A]/40 flex items-center justify-center font-mono font-black text-xs">
                      02
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                      Mandatory Opening Rule: Ace of Spades
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Round 1</span>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-[#6BBF7A]/30 flex items-center gap-3">
                  <div className="w-9 h-12 rounded-lg bg-zinc-900 border-2 border-white/80 text-white flex flex-col items-center justify-center shrink-0 shadow-md font-bold">
                    <span className="text-xs leading-none">A</span>
                    <span className="text-sm leading-none">♠</span>
                  </div>
                  <div className="text-xs leading-relaxed text-zinc-300">
                    The player holding the legendary <strong className="text-white">Ace of Spades (हुकुम का इक्का)</strong> <strong className="text-[#6BBF7A]">MUST</strong> start the very first trick of the match by leading the Ace of Spades face-up!
                  </div>
                </div>
              </div>

              {/* Step 3: Following Suit & Rank */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#6BBF7A]/20 text-[#6BBF7A] border border-[#6BBF7A]/40 flex items-center justify-center font-mono font-black text-xs">
                      03
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                      Strict Rule: Must Follow Suit
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#6BBF7A] font-bold font-mono">Clockwise Play</span>
                </div>

                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                  Turn passes clockwise. If you hold even a single card matching the original lead suit, you <strong className="text-[#6BBF7A]">MUST</strong> follow suit. Playing an off-suit card while holding lead suit is strictly illegal.
                </p>

                <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] flex items-center justify-between">
                  <span className="text-zinc-400">Card Rank:</span>
                  <span className="text-[#6BBF7A] font-bold">A (Highest) &gt; K &gt; Q &gt; J &gt; 10 &gt; ... &gt; 2 (Lowest)</span>
                </div>
              </div>

              {/* Step 4: The THULLA Penalty */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-red-950/30 border border-red-500/50 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center font-mono font-black text-xs">
                    04
                  </span>
                  <h3 className="font-black text-sm sm:text-base text-red-400 uppercase tracking-wide">
                    Throwing a THULLA (Penalty Pile Pickup!)
                  </h3>
                </div>

                <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed">
                  When a player has <strong>NO cards of the lead suit</strong>, they are legally permitted to throw <strong>ANY card of their choice</strong>. This action is the famous <strong className="text-red-400">THULLA</strong>!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/60 border border-red-500/30 text-zinc-300 space-y-1">
                    <strong className="text-red-400 block font-bold">1. Concludes the Trick:</strong>
                    The trick immediately stops once an off-suit Thulla card is thrown.
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-red-500/30 text-zinc-300 space-y-1">
                    <strong className="text-red-400 block font-bold">2. Highest Lead Picks Up:</strong>
                    The player who threw the highest card of the original lead suit must collect <strong>ALL table cards</strong> into their hand!
                  </div>
                </div>
              </div>

              {/* Step 5: Clean Tricks vs Escaping */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#6BBF7A]/10 border border-[#6BBF7A]/40 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#6BBF7A]/20 text-[#6BBF7A] shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                    05 • Clean Tricks &amp; Escaping
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm mt-0.5 leading-relaxed">
                    If all players follow suit with no Thulla, the trick is <strong>Clean</strong>! Cards are swept cleanly to the <strong>Waste Pile</strong>. When you throw your final card (without getting a Thulla penalty), you have <strong className="text-[#6BBF7A]">ESCAPED</strong> and won your rank!
                  </p>
                </div>
              </div>

              {/* Pro Strategy Tip */}
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-start gap-2.5 text-xs text-zinc-400">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Pro Khiladi Tip:</strong> Notice which suits other players are void of. Save your highest cards for when you have the lead, and discard heavy high cards as Thulla when opponents lead suits you lack!
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: BLUFF MASTER STRUCTURED RULES                           */}
          {/* ============================================================== */}
          {selectedTab === 'BLUFF_MASTER' && (
            <div className="space-y-3.5">
              {/* Step 1: Deal & Setup */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#6EB5FF]/20 text-[#6EB5FF] border border-[#6EB5FF]/40 flex items-center justify-center font-mono font-black text-xs">
                      01
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                      Equal Deal &amp; Face-Down Discards
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#6EB5FF] font-bold font-mono">Deception Engine</span>
                </div>

                <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed">
                  All 52 standard cards are dealt out equally. The objective is to be the first player to discard your entire hand.
                </p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  The lead player places <strong>1 to 4 cards FACE DOWN</strong> on the table and declares their rank out loud (e.g. <em>&quot;2 Kings&quot;</em>). You may tell the pure truth OR bluff with any completely different cards!
                </p>
              </div>

              {/* Step 2: The 3 Choices */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#6EB5FF]/20 text-[#6EB5FF] border border-[#6EB5FF]/40 flex items-center justify-center font-mono font-black text-xs">
                      02
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                      Your Turn: The 3 Available Actions
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Current Cycle</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
                    <strong className="text-[#6EB5FF] block mb-1 font-bold">1. Play Cards 🃏</strong>
                    <span>Place 1 or more cards face down, matching the established rank.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-red-500/30">
                    <strong className="text-red-400 block mb-1 font-bold">2. Call &quot;Show!&quot; 🚨</strong>
                    <span>Challenge the last player if you believe they are bluffing!</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
                    <strong className="text-zinc-300 block mb-1 font-bold">3. Pass ⏭️</strong>
                    <span>Skip your turn without placing cards or challenging.</span>
                  </div>
                </div>
              </div>

              {/* Step 3: The Showdown */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-950/30 border border-blue-500/50 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center justify-center font-mono font-black text-xs">
                    03
                  </span>
                  <h3 className="font-black text-sm sm:text-base text-blue-300 uppercase tracking-wide">
                    Calling &quot;Show!&quot; (The High-Stakes Challenge)
                  </h3>
                </div>

                <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed">
                  Before adding cards or passing, any active player can challenge the previous discard by tapping <strong className="text-red-400">&quot;SHOW!&quot;</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-3 rounded-xl bg-black/60 border border-red-500/30 space-y-1">
                    <span className="text-red-400 font-bold block">🚨 Liar Caught:</span>
                    <span className="text-zinc-300">
                      If even 1 single card doesn&apos;t match the declared rank, the liar gets caught and must pick up the <strong>ENTIRE table pile</strong>!
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 space-y-1">
                    <span className="text-emerald-400 font-bold block">🛡️ Honest Play:</span>
                    <span className="text-zinc-300">
                      If all cards strictly match the declared rank, the challenger was wrong and must collect the <strong>ENTIRE table pile</strong>!
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 4: Table Sweeping & Victory */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#6EB5FF]/10 border border-[#6EB5FF]/40 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#6EB5FF]/20 text-[#6EB5FF] shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                    04 • Sweeping &amp; Final Victory
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm mt-0.5 leading-relaxed">
                    If all players pass consecutively, the table pile is swept away into the discard graveyard. The last player who contributed cards starts a <strong>Fresh Cycle</strong> with any rank of their choice! The first player to shed all cards wins first place.
                  </p>
                </div>
              </div>

              {/* Pro Strategy Tip */}
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-start gap-2.5 text-xs text-zinc-400">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Pro Khiladi Tip:</strong> Never bluff on your final card unless you have tracked the other cards perfectly — rivals almost always call &quot;Show!&quot; when you claim you are going out!
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: DOCTOR (LOW SUM CARD GAME)                              */}
          {/* ============================================================== */}
          {selectedTab === 'DOCTOR' && (
            <div className="space-y-3.5">
              {/* Step 1: Game Custom Settings & Input Window */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#E882B4]/20 text-[#E882B4] border border-[#E882B4]/40 flex items-center justify-center font-mono font-black text-xs">
                      01
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                      Custom Room Settings (Game Input Window)
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#E882B4] font-bold font-mono">Room Setup</span>
                </div>

                <p className="text-zinc-200 leading-relaxed text-xs sm:text-sm">
                  Upon creating a Doctor table, the host and players configure custom table parameters before starting the match:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/60 border border-[#E882B4]/30">
                    <strong className="text-[#E882B4] block mb-1 font-bold">1. Cards Dealt 🎴</strong>
                    <span className="text-zinc-300">Choose between <strong>8, 10, or 12</strong> cards dealt per player at the start of each round.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/30">
                    <strong className="text-amber-400 block mb-1 font-bold">2. Show Limit 🎯</strong>
                    <span className="text-zinc-300">Minimum <strong>10</strong> to maximum <strong>15</strong> points inclusive. You can only call Show if your sum is ≤ limit!</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-emerald-500/30">
                    <strong className="text-emerald-400 block mb-1 font-bold">3. Total Rounds 🏆</strong>
                    <span className="text-zinc-300">Set match length from <strong>1 to 10</strong> rounds. Scores accumulate across all rounds on the whiteboard!</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Card Point Values & The Dangerous Joker */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#E882B4]/20 text-[#E882B4] border border-[#E882B4]/40 flex items-center justify-center font-mono font-black text-xs">
                      02
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                      Card Point Values &amp; The 50-Point Joker!
                    </h3>
                  </div>
                  <span className="text-[10px] text-red-400 font-bold font-mono">Points Scale</span>
                </div>

                <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm">
                  Your core mission is to <strong>minimize your hand total</strong>. Lower is always better!
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono text-xs">
                  <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-white font-bold block">Aces</span>
                    <span className="text-emerald-400 text-[11px] font-black">1 POINT</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-white font-bold block">2 to 10</span>
                    <span className="text-blue-300 text-[11px] font-black">FACE VALUE</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-white font-bold block">J, Q, K</span>
                    <span className="text-amber-400 text-[11px] font-black">11, 12, 13 PTS</span>
                  </div>
                  <div className="p-2 rounded-xl bg-red-950/40 border border-red-500/50">
                    <span className="text-red-300 font-bold block">JOKER 🃏</span>
                    <span className="text-red-400 text-[11px] font-black">50 POINTS!</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/40 text-xs text-red-200">
                  <strong className="text-red-400">⚠️ Joker Warning:</strong> A single Joker adds 50 points to your total! If you draw a Joker, your highest priority is to discard it immediately or pair it up to shed it safely!
                </div>
              </div>

              {/* Step 3: Turn Flow: Draw Phase & Group Discards */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#E882B4]/20 text-[#E882B4] border border-[#E882B4]/40 flex items-center justify-center font-mono font-black text-xs">
                      03
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                      Turn Flow: Draw &amp; Shedding Matching Sets
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Clockwise Play</span>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-zinc-300">
                  <p>
                    Each turn consists of two sequential phases: <strong className="text-white">1. Draw Phase</strong> followed by <strong className="text-white">2. Discard Phase</strong>.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
                      <strong className="text-[#E882B4] block font-bold">Phase 1: Draw Options</strong>
                      <ul className="list-disc list-inside space-y-1 text-zinc-300">
                        <li>Draw 1 blind card from the center face-down deck.</li>
                        <li><strong>OR</strong> Pick from the open Discard Pile!</li>
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
                      <strong className="text-emerald-400 block font-bold">Phase 2: Discard Sets</strong>
                      <ul className="list-disc list-inside space-y-1 text-zinc-300">
                        <li>Discard any single high card.</li>
                        <li><strong>OR</strong> Discard a <strong>matching rank set</strong> (pair, triple, or quad of same rank, e.g. three 4s = shed 12 pts at once, or a <strong>pair/triple of Jokers</strong> = shed 100 or 150 pts at once!).</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200">
                    <strong className="text-amber-400">🔥 All-or-Nothing Discard Pickup Rule:</strong> If the previous player discarded a set of 2, 3, or 4 matching cards together, and you choose to draw from the discard pile instead of the deck, you <strong>MUST pick up ALL cards of that group together</strong>! You cannot selectively take only one.
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-400">
                    <strong className="text-white">🔄 Auto-Reshuffle Rule:</strong> If the center draw deck is emptied, all cards previously thrown into the graveyard (except the active discard group) are automatically reshuffled face-down. The round never ends until a player calls Show!
                  </div>
                </div>
              </div>

              {/* Step 4: Calling "SHOW!" & Penalty Calculation */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-red-950/30 border border-red-500/50 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center font-mono font-black text-xs">
                    04
                  </span>
                  <h3 className="font-black text-sm sm:text-base text-red-400 uppercase tracking-wide">
                    Declaring &quot;SHOW!&quot; &amp; The 50-Pt Penalty
                  </h3>
                </div>

                <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed">
                  On your turn (before drawing), if your current hand sum is <strong>less than or equal to the room&apos;s Show Limit (10-15)</strong>, you can declare <strong className="text-amber-400">&quot;SHOW!&quot;</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/40 space-y-1">
                    <span className="text-emerald-400 font-bold block">🏆 Successful Show (Lowest Sum):</span>
                    <span className="text-zinc-300">
                      If you have strictly the lowest hand sum, you <strong>WIN THE ROUND</strong> and score <strong className="text-emerald-400">0 POINTS</strong>! Every opponent gets their actual hand sum added to their board score.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-red-500/40 space-y-1">
                    <span className="text-red-400 font-bold block">🚨 Wrong Show (Penalty Slam!):</span>
                    <span className="text-zinc-300">
                      If ANY opponent has a hand sum lower than or equal to yours, you suffered a <strong>Wrong Show</strong>! You incur a penalty of <strong className="text-red-400">+50 POINTS PER PLAYER</strong> who beat or tied you, plus your hand sum! The true lowest player scores 0 PTS.
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 5: Crazy Animated Whiteboard Scoreboard & Tournament Champion */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#E882B4]/10 border border-[#E882B4]/40 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#E882B4]/20 text-[#E882B4] shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                    05 • Crazy Animated Marker Scoreboard &amp; Champion
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm mt-0.5 leading-relaxed">
                    At the end of each round, a whiteboard clipboard slides into the center. Round scores are drawn with realistic <strong>thick black marker handwriting</strong> and squeaky sound effects! Round winners get circled with 0 PTS.
                  </p>
                  <p className="text-zinc-300 text-xs sm:text-sm mt-1 leading-relaxed">
                    After all rounds conclude, cumulative totals are calculated. The player with the <strong className="text-emerald-400">LOWEST CUMULATIVE SCORE</strong> across the entire match is crowned the ultimate <strong className="text-[#E882B4]">Doctor Champion</strong>!
                  </p>
                </div>
              </div>

              {/* Pro Strategy Tip */}
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-start gap-2.5 text-xs text-zinc-400">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Pro Khiladi Tip:</strong> Don&apos;t rush to show right at the limit (e.g. 10 or 12) if you suspect someone has a 2-card hand of low numbers. Discard pairs or quads to push your sum down to 3, 2, or 1 before calling Show to ensure a guaranteed 0 PTS!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4. Footer Brand Strip */}
        <div className="relative z-10 px-4 sm:px-6 py-2.5 border-t border-white/10 bg-black/60 flex items-center justify-between text-[10px] text-zinc-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full transition-colors duration-300"
              style={{ backgroundColor: currentTheme.color }}
            />
            <span className="text-zinc-400 font-bold uppercase tracking-wider">
              {currentTheme.title} Engine
            </span>
          </span>
          <span className="font-mono flex items-center gap-1.5 text-zinc-400">
            <img src="/logo.png" alt="Card Games Logo" className="w-3.5 h-3.5 rounded object-cover" />
            <span>Card Games By Madhav</span>
          </span>
        </div>
      </div>
    </div>
  );
};
