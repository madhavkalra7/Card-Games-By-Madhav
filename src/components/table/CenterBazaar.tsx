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
      className="relative flex flex-col items-center justify-center p-2 sm:p-4 rounded-3xl bg-black/40 backdrop-blur-md border border-gold/30 shadow-2xl"
    >
      {/* 4 Center Decks in a clean row */}
      <div className="flex flex-row items-center justify-center gap-2 sm:gap-3.5 md:gap-5">
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
                'relative flex flex-col items-center transition-all duration-200 p-1 sm:p-1.5 rounded-2xl select-none',
                isMatch && 'ring-2 ring-gold/90 shadow-gold-glow bg-gold/15 animate-pulse-gold scale-105 cursor-pointer',
                !isMatch && isMyTurn && floatingCard && 'opacity-85 hover:opacity-100 cursor-pointer'
              )}
            >
              {/* Suit Title or Deck Number */}
              <div className="flex items-center gap-1 mb-1">
                {deck.suit ? (
                  <>
                    <SuitIcon suit={deck.suit} className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                      {SUIT_NAMES[deck.suit]}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Deck {deck.id + 1}
                  </span>
                )}
              </div>

              {/* Card Surface or Empty Center Deck Slot */}
              <div className="relative">
                {isOpen && deck.topCard ? (
                  /* Opened Center Deck with Stacked Cards */
                  <div className="relative">
                    {/* Depth shadow layers */}
                    {count > 1 && (
                      <div className="absolute -bottom-1 -right-1 w-16 h-24 sm:w-20 sm:h-28 rounded-[12px] bg-red-950/70 border border-amber-900/40 pointer-events-none" />
                    )}
                    <PlayingCard
                      card={deck.topCard}
                      size="md"
                      glow={isMatch}
                      className={cn(
                        'shadow-xl transition-transform',
                        isMatch && 'ring-2 ring-gold'
                      )}
                    />

                    {/* Count Badge */}
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full border border-amber-300 shadow">
                      {count}
                    </div>

                    {/* Status Ribbon below card */}
                    <div className="mt-1 flex items-center justify-center">
                      {isCompleted ? (
                        <span className="flex items-center gap-0.5 bg-emerald-950 text-emerald-300 text-[9px] font-black px-2 py-0.2 rounded-full border border-emerald-500/50">
                          <Check className="w-2.5 h-2.5" /> COMPLETED
                        </span>
                      ) : (
                        <span className="bg-black/80 text-gold-light text-[9px] sm:text-[10px] font-extrabold px-2 py-0.2 rounded-full border border-gold/40 whitespace-nowrap shadow">
                          Needs: {deck.nextAcceptedRank}
                          {deck.suit && <SuitIcon suit={deck.suit} className="w-2.5 h-2.5 inline ml-0.5" />}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty Center Deck Slot waiting for baseRank */
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-16 h-24 sm:w-20 sm:h-28 rounded-[12px] border-2 border-dashed flex flex-col items-center justify-center p-2 transition-all',
                        isMatch
                          ? 'border-gold bg-gold/20 shadow-gold-glow animate-pulse'
                          : 'border-amber-400/30 bg-black/30 hover:border-amber-400/60'
                      )}
                    >
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300/40 mb-1" />
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider text-center leading-none mb-1">
                        Empty Deck
                      </span>
                      <span className="text-[10px] sm:text-xs font-black text-gold uppercase text-center leading-tight">
                        Drop {currentBase}
                      </span>
                    </div>

                    <div className="mt-1">
                      <span className="text-[9px] text-zinc-500 font-medium whitespace-nowrap">
                        Empty
                      </span>
                    </div>
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
