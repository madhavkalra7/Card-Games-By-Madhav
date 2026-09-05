'use client';

import React from 'react';
import { BookOpen, CheckCircle, Flame, ShieldAlert, Sparkles, X } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-zinc-950 border-2 border-gold/70 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 text-zinc-400 hover:text-white p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 shrink-0">
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-gold/40 text-gold shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-wide">
              Dukki Bazaar - Official Rules
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400">Traditional Indian 52-Card Table Game</p>
          </div>
        </div>

        {/* Scrollable Rules Content */}
        <div className="overflow-y-auto pr-2 space-y-4 text-xs sm:text-sm text-zinc-300">
          
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
              <li>Each suit foundation can only be <strong>OPENED</strong> by the Base Rank card of that suit (e.g. 4♠, 4♥, 4♦, 4♣).</li>
              <li>Once open, cards must be played in ascending order of the <strong>SAME SUIT</strong> (e.g. 5♣ on 4♣, then 6♣, etc.).</li>
              <li>The sequence cycles: <strong className="text-white">Base → ... → K → A → ... → (Base - 1)</strong>. For example, if Base is 4, each foundation finishes on 3!</li>
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
              If your drawn card can be played in the center, you <strong>MUST</strong> play it in the center. Placing it on a right deck instead is an illegal move and makes you eligible for a penalty!
            </p>
          </div>

          {/* Bazaar Open & Opponent Placement */}
          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-2">
            <h3 className="font-extrabold text-gold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              4. Bazaar Open & Opponent Right Decks
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              When you place your first valid card in the center, your Bazaar is unlocked and you receive the glowing golden <strong className="text-gold">BAZAAR OPEN</strong> badge.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Once open, you can drag your drawn card onto <strong>ANY player&apos;s right deck</strong> if the card is exactly <strong className="text-white">top card rank + 1</strong> (e.g. 6 on 5, Q on J).</li>
            </ul>
          </div>

          {/* Automatic Penalty System */}
          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-2">
            <h3 className="font-extrabold text-red-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              5. The Automatic Penalty System
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              The table automatically monitors and enforces all gameplay rules on every card drag:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li><strong className="text-white">Missed Center:</strong> If your card was playable on Center, but you placed it on a right deck instead, you are automatically penalized!</li>
              <li><strong className="text-white">Wrong Placement:</strong> If you drag onto Center or an opponent where it does not belong, you are automatically penalized!</li>
              <li><strong className="text-red-400">Penalty Effect:</strong> The wrongly placed card automatically goes to YOUR right deck, and you receive <strong className="text-white">1 penalty card from EACH player who has OPENED their Bazaar</strong>!</li>
            </ul>
          </div>

          {/* Win Condition & Turn Flow */}
          <div className="bg-amber-950/20 p-4 rounded-2xl border border-gold/30 space-y-2">
            <h3 className="font-extrabold text-gold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              6. Turn Continuity & Winning
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-xs leading-relaxed">
              <li><strong className="text-white">Continuous Turns:</strong> Whenever your card is placed on the <strong className="text-gold">Center</strong> or on an <strong className="text-gold">Opponent&apos;s Right Deck</strong>, your turn CONTINUES! You can draw again or play from your Right Deck.</li>
              <li><strong className="text-white">Turn Ends:</strong> Your turn ONLY ends when your card is placed on your <strong className="text-amber-400">OWN Right Deck</strong> (or upon penalty/timeout).</li>
              <li><strong className="text-white">Draggable Right Deck:</strong> The top card of your Right Deck can be dragged directly to the Center or opponent right decks! Dragging to an illegal spot triggers an automatic penalty.</li>
              <li><strong className="text-gold">Winning:</strong> The first player to shed all cards (both hidden stack and right deck) wins the game!</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-800 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gold text-black font-extrabold text-xs uppercase tracking-wider shadow-gold-glow hover:bg-gold-light active:scale-95 transition-all"
          >
            Got It, Let&apos;s Play
          </button>
        </div>

      </div>
    </div>
  );
};
