'use client';

import React from 'react';
import { PlayerClientView, Card } from '@/lib/types';
import { CardStack } from '../card/CardStack';
import { cn } from '@/lib/utils';
import { Crown, Sparkles, WifiOff } from 'lucide-react';

interface PlayerSeatProps {
  player: PlayerClientView;
  isCurrentTurn: boolean;
  isSelf: boolean;
  canDrawCard?: boolean;
  onDrawCard?: () => void;
  canPlaceOnRightDeck?: boolean;
  onPlaceRightDeck?: () => void;
  className?: string;
  positionClass?: string;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isCurrentTurn,
  isSelf,
  canDrawCard = false,
  onDrawCard,
  canPlaceOnRightDeck = false,
  onPlaceRightDeck,
  className,
  positionClass,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center select-none transition-all duration-300 z-20',
        positionClass,
        className
      )}
    >
      {/* Player Header Capsule */}
      <div
        className={cn(
          'relative flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md transition-all duration-300',
          'bg-black/60 border border-white/10 shadow-lg',
          isCurrentTurn && 'ring-2 ring-gold shadow-gold-glow bg-black/80 scale-105',
          !player.isConnected && 'opacity-60 border-red-500/50'
        )}
      >
        {/* Avatar Circle */}
        <div
          className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md border border-white/30"
          style={{ backgroundColor: player.avatarColor || '#3b82f6' }}
        >
          {player.name.charAt(0).toUpperCase()}
          {player.isHost && (
            <span className="absolute -top-2.5 -right-1 text-gold filter drop-shadow">
              <Crown className="w-4 h-4 fill-gold text-amber-900" />
            </span>
          )}
        </div>

        {/* Player Name & Tag */}
        <div className="flex flex-col items-start leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs sm:text-sm text-zinc-100 max-w-[90px] sm:max-w-[110px] truncate">
              {player.name}
            </span>
            {isSelf && (
              <span className="text-[9px] bg-white/20 text-zinc-200 px-1 py-0.2 rounded font-mono">
                YOU
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400">
            {player.hiddenCount} cards left
          </span>
        </div>

        {/* Disconnected Indicator */}
        {!player.isConnected && (
          <div title="Player disconnected (60s reconnect grace)">
            <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          </div>
        )}

        {/* Turn indicator glow pill */}
        {isCurrentTurn && (
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gold text-black text-[9px] font-black px-2 py-0.2 rounded-full uppercase tracking-wider shadow">
            Turn
          </div>
        )}
      </div>

      {/* Golden Glowing Bazaar Open Badge */}
      {player.isBazaarOpen && (
        <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black shadow-gold-glow animate-pulse border border-yellow-200">
          <Sparkles className="w-3 h-3 fill-black" />
          <span>BAZAAR OPEN</span>
        </div>
      )}

      {/* Cards: Left Deck (Hidden Stack) & Right Deck (Face up top card) */}
      <div className="mt-1 sm:mt-2 flex items-center gap-1.5 sm:gap-3">
        {/* Left Deck (Hidden Stack) */}
        <div className="flex flex-col items-center">
          <CardStack
            type="hidden"
            count={player.hiddenCount}
            isClickable={isSelf && canDrawCard}
            onClick={isSelf && canDrawCard ? onDrawCard : undefined}
            isHighlighted={isSelf && canDrawCard}
            size={isSelf ? 'sm' : 'xs'}
            label="Left Deck"
          />
        </div>

        {/* Right Deck (Top visible card) */}
        <div className="flex flex-col items-center">
          <div
            data-drop-target="right-deck"
            data-player-id={player.id}
            onClick={canPlaceOnRightDeck ? onPlaceRightDeck : undefined}
            className={cn(
              'relative transition-transform p-0.5 sm:p-1 rounded-xl',
              canPlaceOnRightDeck && 'cursor-pointer hover:scale-105 active:scale-95 ring-2 ring-gold/60 bg-gold/10'
            )}
          >
            <CardStack
              type="right"
              count={player.rightDeckCount}
              topCard={player.rightDeckTop}
              size={isSelf ? 'sm' : 'xs'}
              isHighlighted={canPlaceOnRightDeck}
              label="Right Deck"
            />
            {canPlaceOnRightDeck && (
              <div className="absolute inset-0 bg-gold/25 rounded-[12px] flex items-center justify-center pointer-events-none">
                <span className="bg-gold text-black text-[8px] sm:text-[9px] font-black px-1 sm:px-1.5 py-0.2 rounded shadow animate-bounce">
                  PLACE
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
