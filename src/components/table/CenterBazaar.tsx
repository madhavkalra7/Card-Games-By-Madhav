'use client';

import React from 'react';
import { Card, CenterDeck, Rank, Suit } from '@/lib/types';
import { PlayingCard, SuitIcon } from '../card/PlayingCard';
import { cn } from '@/lib/utils';
import { canPlayOnCenterDeck, RANK_ORDER } from '@/lib/validator';
import { Check, Plus } from 'lucide-react';

interface CenterBazaarProps {
  centerDecks?: CenterDeck[];
  baseRank?: Rank | null;
  centerCard?: Card | null;
  floatingCard?: Card | null;
  isMyTurn?: boolean;
  onPlaceCenter?: (targetDeckId?: number) => void;
}

const SUIT_NAMES: Record<Suit, string> = {
  S: 'Spades',
  H: 'Hearts',
  C: 'Clubs',
  D: 'Diamonds',
};

export const CenterBazaar: React.FC<CenterBazaarProps> = ({
  centerDecks = [],
  baseRank,
  centerCard,
  floatingCard,
  isMyTurn = false,
  onPlaceCenter,
}) => {
  const currentBase = baseRank || centerCard?.rank || '4';

  // Last card of the sequence (the rank right before baseRank in cyclic order)
  const baseIndex = RANK_ORDER.indexOf(currentBase as Rank);
  const endRank = RANK_ORDER[(baseIndex + 12) % 13];

  // Ensure 4 decks exist
  const decks: CenterDeck[] = centerDecks.length === 4 ? centerDecks : [
    { id: 0, suit: centerCard?.suit || null, cards: centerCard ? [centerCard] : [], topCard: centerCard || null, isOpen: !!centerCard, isCompleted: false, nextAcceptedRank: null },
    { id: 1, suit: null, cards: [], topCard: null, isOpen: false, isCompleted: false, nextAcceptedRank: currentBase },
    { id: 2, suit: null, cards: [], topCard: null, isOpen: false, isCompleted: false, nextAcceptedRank: currentBase },
    { id: 3, suit: null, cards: [], topCard: null, isOpen: false, isCompleted: false, nextAcceptedRank: currentBase },
  ];

  return (
    <div
      data-drop-target="center"
      className="relative flex flex-col items-center justify-center p-1 sm:p-2 md:p-3.5 rounded-2xl sm:rounded-3xl bg-black/45 backdrop-blur-md border border-gold/30 shadow-2xl"
    >
      {/* 4 Center Decks in a clean row */}
      <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2.5 md:gap-4">
        {decks.map((deck) => {
          const isOpen = deck.isOpen && !!deck.topCard;
          const isCompleted = deck.isCompleted;
          const count = deck.cards.length;

          // Check if player's floating card is valid on this specific center deck
          let isMatch = false;
          if (isMyTurn && floatingCard && baseRank) {
            isMatch = canPlayOnCenterDeck(floatingCard, deck, baseRank, decks).valid;
          }

          return (
            <div
              key={deck.id}
              data-drop-target="center"
              data-deck-id={deck.id}
              onClick={() => onPlaceCenter && onPlaceCenter(deck.id)}
              className={cn(
                'relative flex flex-col items-center transition-all duration-200 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl select-none',
                isMatch && 'ring-2 ring-gold/90 shadow-gold-glow bg-gold/15 animate-pulse-gold scale-105 cursor-pointer',
                !isMatch && isMyTurn && floatingCard && 'opacity-85 hover:opacity-100 cursor-pointer'
              )}
            >
              {/* Suit Title or Deck Number - Aligned on top of cards, clearly visible */}
              <div className="h-6 sm:h-7 flex items-center justify-center mb-1 sm:mb-1.5 z-20">
                {deck.suit ? (
                  <div className="flex items-center gap-1 bg-black/75 px-2 py-0.5 rounded-full border border-white/20 shadow-md">
                    <SuitIcon suit={deck.suit} className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider">
                      {SUIT_NAMES[deck.suit]}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center px-1.5 py-0.5">
                    <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Deck {deck.id + 1}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Surface or Empty Center Deck Slot */}
              <div className="relative flex flex-col items-center">
                {isOpen && deck.topCard ? (
                  /* Opened Center Deck with Stacked Cards */
                  <div className="relative">
                    {/* Depth shadow layers */}
                    {count > 1 && (
                      <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-[8px] sm:rounded-[12px] bg-black/60 border border-amber-950/60 pointer-events-none" />
                    )}
                    <PlayingCard
                      card={deck.topCard}
                      size="sm"
                      glow={isMatch}
                      className={cn(
                        'shadow-xl transition-transform',
                        isMatch && 'ring-2 ring-gold'
                      )}
                    />

                    {/* Count Badge */}
                    <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[8px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.2 rounded-full border border-amber-300 shadow z-20">
                      {count}
                    </div>

                    {/* Status Ribbon below card (Only if Completed) */}
                    {isCompleted && (
                      <div className="mt-1 flex items-center justify-center">
                        <span className="flex items-center gap-0.5 bg-emerald-950 text-emerald-300 text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-500/50">
                          <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> COMPLETED
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty Center Deck Slot waiting for baseRank */
                  <div
                    className={cn(
                      'w-12 h-16 sm:w-14 sm:h-20 rounded-[8px] sm:rounded-[12px] border-2 border-dashed flex flex-col items-center justify-center p-1 transition-all',
                      isMatch
                        ? 'border-gold bg-gold/20 shadow-gold-glow animate-pulse'
                        : 'border-amber-400/30 bg-black/30 hover:border-amber-400/60'
                    )}
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300/40 mb-0.5" />
                    <span className="text-[7px] sm:text-[8px] text-zinc-400 font-bold uppercase tracking-wider text-center leading-none mb-0.5">
                      Empty
                    </span>
                    <span className="text-[8px] sm:text-[10px] font-black text-gold uppercase text-center leading-tight">
                      Drop {currentBase}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
