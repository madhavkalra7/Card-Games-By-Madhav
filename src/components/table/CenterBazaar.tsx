'use client';

import React from 'react';
import { Card, CenterDeck, Rank, Suit } from '@/lib/types';
import { PlayingCard, SuitIcon } from '../card/PlayingCard';
import { cn } from '@/lib/utils';
import { RANK_ORDER } from '@/lib/validator';
import { Check, Plus } from 'lucide-react';

interface CenterBazaarProps {
  centerDecks?: CenterDeck[];
  baseRank?: Rank | null;
  centerCard?: Card | null;
  floatingCard?: Card | null;
  isMyTurn?: boolean;
  onPlaceCenter?: (targetDeckId?: number) => void;
  cardSize?: 'xxs' | 'xs' | 'sm' | 'md';
  className?: string;
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
  cardSize = 'sm',
  className,
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
      className={cn(
        "relative flex flex-col items-center justify-center p-1 sm:p-1.5 md:p-3 rounded-xl sm:rounded-2xl md:rounded-3xl bg-black/60 backdrop-blur-md border border-gold/30 shadow-2xl transition-all",
        className
      )}
    >
      {/* 4 Center Decks in a clean row */}
      <div className="flex flex-row items-center justify-center gap-1 sm:gap-2 md:gap-3.5">
        {decks.map((deck) => {
          const isOpen = deck.isOpen && !!deck.topCard;
          const isCompleted = deck.isCompleted;
          const count = deck.cards.length;

          return (
            <div
              key={deck.id}
              data-drop-target="center"
              data-deck-id={deck.id}
              onClick={() => onPlaceCenter && onPlaceCenter(deck.id)}
              className={cn(
                'relative flex flex-col items-center transition-all duration-200 p-0.5 sm:p-1 rounded-lg sm:rounded-xl select-none',
                isMyTurn && floatingCard ? 'cursor-pointer hover:scale-105' : ''
              )}
            >
              {/* Suit Title or Deck Number - Aligned on top of cards, clearly visible */}
              <div className="h-4 sm:h-5 flex items-center justify-center mb-0.5 sm:mb-1 z-20">
                {deck.suit ? (
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-black/85 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full border border-white/20 shadow-md">
                    <SuitIcon suit={deck.suit} className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                    <span className="text-[7px] sm:text-[9px] md:text-[10px] font-black text-white uppercase tracking-wider">
                      {SUIT_NAMES[deck.suit]}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center px-1 sm:px-1.5 py-0.2">
                    <span className="text-[7px] sm:text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
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
                      <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-[6px] sm:rounded-[10px] bg-black/60 border border-amber-950/60 pointer-events-none" />
                    )}
                    <PlayingCard
                      card={deck.topCard}
                      size={cardSize}
                      glow={false}
                      className="shadow-xl transition-transform"
                    />

                    {/* Count Badge */}
                    <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[8px] sm:text-[9px] md:text-[10px] font-black px-1 sm:px-1.5 py-0.2 rounded-full border border-amber-300 shadow z-20">
                      {count}
                    </div>

                    {/* Status Ribbon below card (Only if Completed) */}
                    {isCompleted && (
                      <div className="mt-0.5 sm:mt-1 flex items-center justify-center">
                        <span className="flex items-center gap-0.5 bg-emerald-950 text-emerald-300 text-[7px] sm:text-[8px] font-black px-1 sm:px-1.5 py-0.2 rounded-full border border-emerald-500/50">
                          <Check className="w-2 h-2" /> DONE
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty Center Deck Slot waiting for baseRank */
                  <div
                    className={cn(
                      'rounded-[8px] sm:rounded-[12px] border-2 border-dashed flex flex-col items-center justify-center p-0.5 sm:p-1 transition-all',
                      cardSize === 'xs'
                        ? 'w-[38px] h-[53px] sm:w-[44px] sm:h-[62px]'
                        : cardSize === 'xxs'
                        ? 'w-[32px] h-[45px]'
                        : 'w-[44px] h-[62px] sm:w-[54px] sm:h-[76px] md:w-[62px] md:h-[87px]',
                      'border-amber-400/30 bg-black/30 hover:border-amber-400/60',
                      isMyTurn && floatingCard && 'cursor-pointer'
                    )}
                  >
                    <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300/40 mb-0.5" />
                    <span className="text-[6px] sm:text-[7px] text-zinc-400 font-bold uppercase tracking-wider text-center leading-none mb-0.5">
                      Empty
                    </span>
                    <span className="text-[7px] sm:text-[8px] font-black text-gold uppercase text-center leading-tight">
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
