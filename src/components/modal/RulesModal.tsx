'use client';

import React, { useState } from 'react';
import { GameType } from '@/lib/types';
import { useGameStore } from '@/store/gameStore';
import { BookOpen, CheckCircle, Flame, ShieldAlert, Sparkles, X, Trophy, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGameType?: GameType;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, defaultGameType }) => {
  const activeGameType = useGameStore((s) => s.gameState?.gameType);
  const [selectedTab, setSelectedTab] = useState<GameType>(defaultGameType || activeGameType || 'DUKKI_BAZAAR');

  // Sync tab if activeGameType or defaultGameType changes
  React.useEffect(() => {
    if (defaultGameType) {
      setSelectedTab(defaultGameType);
    } else if (activeGameType) {
      setSelectedTab(activeGameType);
    }
  }, [defaultGameType, activeGameType, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[92vh] bg-zinc-950 border-2 border-gold/70 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 text-zinc-400 hover:text-white p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3 shrink-0">
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-gold/40 text-gold shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-wide">
              Official Game Rules
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400">
              Select a game below to read comprehensive rules
            </p>
          </div>
        </div>

        {/* Game Tabs */}
        <div className="flex items-center gap-2 mb-4 shrink-0 border-b border-white/10 pb-2">
          <button
            type="button"
            onClick={() => setSelectedTab('DUKKI_BAZAAR')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer',
              selectedTab === 'DUKKI_BAZAAR'
                ? 'bg-amber-500/25 text-gold border border-gold/50 shadow-gold-glow'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            )}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Dukki Bazaar</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab('BLUFF_MASTER')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer',
              selectedTab === 'BLUFF_MASTER'
                ? 'bg-blue-500/25 text-blue-400 border border-blue-400/50 shadow-lg'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            )}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            <span>Bluff Master</span>
          </button>
        </div>

        {/* Scrollable Rules Content */}
        <div className="overflow-y-auto pr-2 space-y-4 text-xs sm:text-sm text-zinc-300">
          {selectedTab === 'BLUFF_MASTER' ? (
            /* ================= BLUFF MASTER RULES ================= */
            <>
              {/* Overview */}
              <div className="bg-blue-950/30 p-4 rounded-2xl border border-blue-500/40 space-y-2">
                <h3 className="font-extrabold text-blue-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  1. Objective & Setup (52 Cards)
                </h3>
                <p className="text-zinc-200 leading-relaxed font-medium">
                  The goal of Bluff Master is to <strong>be the first player to discard all your cards</strong>.
                </p>
                <p className="text-zinc-400">
                  All 52 standard cards are dealt out equally among 2 to 5 players:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li><strong className="text-white">2 Players:</strong> 26 cards each</li>
                  <li><strong className="text-white">3 Players:</strong> 17, 17, 18 cards</li>
                  <li><strong className="text-white">4 Players:</strong> 13 cards each</li>
                  <li><strong className="text-white">5 Players:</strong> 10, 10, 10, 11, 11 cards</li>
                </ul>
              </div>

              {/* Cycle & Claim */}
              <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <h3 className="font-extrabold text-gold flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  2. Cycles & Playing Cards (Face Down)
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  The lead player places <strong>1, 2, 3, or more cards</strong> face-down on the table and declares their rank (e.g. <em>&quot;2 Kings&quot;</em>).
                </p>
                <p className="text-zinc-300 leading-relaxed">
                  You are allowed to tell the truth OR bluff! The declared rank remains locked for the entire cycle. Subsequent players in turn can:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li><strong className="text-white">Add Cards:</strong> Place 1 or more cards face-down contributing to the same claimed rank.</li>
                  <li><strong className="text-white">Show (Challenge):</strong> Call bluff on the previous player.</li>
                  <li><strong className="text-white">Pass:</strong> Skip your turn without placing cards.</li>
                </ul>
              </div>

              {/* Show / Challenge */}
              <div className="bg-red-950/30 p-4 rounded-2xl border border-red-500/40 space-y-2">
                <h3 className="font-extrabold text-red-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  3. Calling &quot;Show&quot; (The Showdown!)
                </h3>
                <p className="text-zinc-200 leading-relaxed">
                  If you suspect the latest player was lying, click <strong className="text-red-400">&quot;Show!&quot;</strong> before adding cards or passing.
                </p>
                <div className="space-y-2 pt-1">
                  <div className="bg-black/50 p-2.5 rounded-xl border border-red-500/30">
                    <span className="text-red-300 font-bold">🚨 Caught Lying:</span> If even 1 card does not match the declared rank, the liar gets caught and must pick up the <strong>ENTIRE table pile</strong>!
                  </div>
                  <div className="bg-black/50 p-2.5 rounded-xl border border-emerald-500/30">
                    <span className="text-emerald-300 font-bold">🛡️ Honest Play:</span> If all cards were strictly the declared rank, the challenger was wrong and must pick up the <strong>ENTIRE table pile</strong>!
                  </div>
                </div>
              </div>

              {/* Table Clear / Sweeping */}
              <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <h3 className="font-extrabold text-gold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  4. Clearing the Table (All Pass)
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  If everyone passes consecutively and turn circles back to the last player who contributed cards, the table pile is <strong>SWEPT AND CLEARED</strong>.
                </p>
                <p className="text-zinc-400">
                  That player starts a <strong>FRESH CYCLE</strong> with any rank of their choice!
                </p>
              </div>

              {/* Winning & Final Card */}
              <div className="bg-amber-500/10 p-4 rounded-2xl border border-gold/40 space-y-2">
                <h3 className="font-extrabold text-gold flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  5. Winning the Match
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  When you play your last card(s), the next player STILL has the right to challenge your final play!
                </p>
                <p className="text-zinc-400">
                  If you were bluffing on your last card and get caught, you pick up the whole pile! If unchallenged or honest, you win first place!
                </p>
              </div>
            </>
          ) : (
            /* ================= DUKKI BAZAAR RULES ================= */
            <>
              {/* Card Visibility */}
              <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <h3 className="font-extrabold text-gold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  1. Two Decks Per Player
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  Every player receives an equal distribution of hidden cards.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li><strong className="text-white">Left Deck (Hidden Stack):</strong> Face-down. Neither you nor other players can see your cards until drawn.</li>
                  <li><strong className="text-white">Right Deck:</strong> Face-up discard/building pile. ONLY the top card is visible to all players.</li>
                </ul>
              </div>

              {/* Center Bazaar */}
              <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <h3 className="font-extrabold text-gold flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  2. Four Center Foundations (By Suit)
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  Before the match starts, 1 random card is drawn to establish the <strong className="text-gold">Base Rank</strong> (e.g. 4♣).
                </p>
                <p className="text-zinc-300 leading-relaxed">
                  There are <strong>4 separate foundations</strong> in the center — one for each suit (♠, ♥, ♣, ♦):
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>Each suit foundation can only be <strong>OPENED</strong> by the Base Rank card of that suit.</li>
                  <li>Once open, cards must be played in ascending order of the <strong>SAME SUIT</strong>.</li>
                  <li>The sequence cycles: <strong className="text-white">Base → ... → K → A → ... → (Base - 1)</strong>.</li>
                </ul>
              </div>

              {/* Priority Rule */}
              <div className="bg-red-950/30 p-4 rounded-2xl border border-red-500/40 space-y-2">
                <h3 className="font-extrabold text-red-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  3. The Priority Rule (Crucial!)
                </h3>
                <p className="text-zinc-200 leading-relaxed font-medium">
                  The Center Bazaar always has <strong>HIGHEST PRIORITY</strong>.
                </p>
                <p className="text-zinc-400">
                  If your drawn card can be played in the center, you <strong>MUST</strong> play it in the center. Placing it on a right deck instead is an illegal move and triggers penalty cards!
                </p>
              </div>

              {/* Winning Condition */}
              <div className="bg-amber-500/10 p-4 rounded-2xl border border-gold/40 space-y-2">
                <h3 className="font-extrabold text-gold flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  4. Winning the Match
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  The first player to completely empty both their Left and Right Decks wins!
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center text-[10px] text-zinc-500">
          Card Games By Madhav • Traditional Indian 52-Card Multiplayer Engine
        </div>
      </div>
    </div>
  );
};
