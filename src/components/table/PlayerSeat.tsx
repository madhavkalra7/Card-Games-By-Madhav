'use client';

import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { PlayerClientView, Card } from '@/lib/types';
import { CardStack } from '../card/CardStack';
import { PlayingCard } from '../card/PlayingCard';
import { cn } from '@/lib/utils';
import { Crown, Sparkles, WifiOff, Grab, Mic, MicOff } from 'lucide-react';
import { useVoiceStore } from '@/store/voiceStore';
import { useGameStore } from '@/store/gameStore';
import { ThrowablePicker } from './ThrowablePicker';

interface PlayerSeatProps {
  player: PlayerClientView;
  isCurrentTurn: boolean;
  isSelf: boolean;
  canDrawCard?: boolean;
  onDrawCard?: () => void;
  canPlaceOnRightDeck?: boolean;
  onPlaceRightDeck?: () => void;
  canDragRightDeck?: boolean;
  onDropCenterFromRightDeck?: (targetDeckId?: number) => void;
  onDropRightDeckFromRightDeck?: (targetPlayerId: string) => void;
  className?: string;
  positionClass?: string;
  cardSize?: 'xxs' | 'xs' | 'sm' | 'md';
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isCurrentTurn,
  isSelf,
  canDrawCard = false,
  onDrawCard,
  canPlaceOnRightDeck = false,
  onPlaceRightDeck,
  canDragRightDeck = false,
  onDropCenterFromRightDeck,
  onDropRightDeckFromRightDeck,
  className,
  positionClass = '',
  cardSize,
}) => {
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [showThrowPicker, setShowThrowPicker] = useState(false);
  const activeCardSize = cardSize || (isSelf ? 'sm' : 'xs');

  // Throwables state from gameStore
  const activeImpacts = useGameStore((s) => s.activeImpacts);
  const activeSoundboardDecals = useGameStore((s) => s.activeSoundboardDecals);
  const throwItem = useGameStore((s) => s.throwItem);
  const currentImpact = activeImpacts[player.id];
  const soundboardDecal = activeSoundboardDecals[player.id];

  // Position and alignment awareness for picker popup, impact decals & floating card
  const isTopSeat = (
    positionClass.includes('top-1') ||
    positionClass.includes('top-2') ||
    positionClass.includes('top-6') ||
    positionClass.includes('top-9') ||
    positionClass.includes('top-10') ||
    positionClass.includes('top-11') ||
    positionClass.includes('top-12') ||
    positionClass.includes('top-14') ||
    positionClass.includes('top-16') ||
    positionClass.includes('top-[9%]') ||
    positionClass.includes('top-[16%]') ||
    positionClass.includes('top-[22%]')
  ) && !positionClass.includes('top-1/2');

  const isLeftFlank = positionClass.includes('left-0') || positionClass.includes('left-1') || positionClass.includes('left-2') || positionClass.includes('left-3') || positionClass.includes('left-4') || positionClass.includes('left-[1') || positionClass.includes('left-[2');
  const isRightFlank = positionClass.includes('right-0') || positionClass.includes('right-1') || positionClass.includes('right-2') || positionClass.includes('right-3') || positionClass.includes('right-4') || positionClass.includes('right-[1') || positionClass.includes('right-[2');
  const pickerAlign: 'center' | 'left' | 'right' = isLeftFlank ? 'left' : isRightFlank ? 'right' : 'center';

  // Voice chat speaking & mute status
  const speakingPeers = useVoiceStore((s) => s.speakingPeers);
  const peerStates = useVoiceStore((s) => s.peerStates);
  const isInVoice = useVoiceStore((s) => s.isInVoice);
  const isMicMuted = useVoiceStore((s) => s.isMicMuted);

  const isSpeaking = isSelf
    ? isInVoice && !isMicMuted && !!speakingPeers['me']
    : !!speakingPeers[player.id];

  const isMuted = isSelf
    ? isInVoice && isMicMuted
    : !!peerStates[player.id]?.isMuted;

  const handleRightDeckDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDraggingRight(false);
    const elements = document.elementsFromPoint(info.point.x, info.point.y);
    if (!elements) return;

    for (const el of elements) {
      // 1. Check if dropped over Center Bazaar
      const centerTarget = el.closest('[data-drop-target="center"]');
      if (centerTarget) {
        const deckIdStr = centerTarget.getAttribute('data-deck-id') || el.closest('[data-deck-id]')?.getAttribute('data-deck-id');
        const deckId = deckIdStr !== null && deckIdStr !== undefined && !isNaN(Number(deckIdStr)) ? parseInt(deckIdStr, 10) : undefined;
        onDropCenterFromRightDeck?.(deckId);
        return;
      }

      // 2. Check if dropped over another player's Right Deck
      const rightDeckTarget = el.closest('[data-drop-target="right-deck"]');
      if (rightDeckTarget) {
        const targetPlayerId = rightDeckTarget.getAttribute('data-player-id');
        if (targetPlayerId && targetPlayerId !== player.id) {
          onDropRightDeckFromRightDeck?.(targetPlayerId);
          return;
        }
      }
    }
  };

  return (
    <motion.div
      id={`player-seat-${player.id}`}
      animate={currentImpact ? {
        x: [-12, 12, -8, 8, -4, 4, 0],
        y: [-6, 6, -4, 4, 0],
        rotate: [-6, 6, -3, 3, 0],
      } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'relative flex flex-col items-center select-none transition-all duration-300 z-20',
        positionClass,
        className
      )}
    >
      {/* Real-Time Impact Splatters / Decals when Hit */}
      {currentImpact && (
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 pointer-events-none z-50 flex items-center justify-center animate-bounce",
          isTopSeat ? "top-full mt-1 sm:mt-1.5" : "-top-7 sm:-top-9"
        )}>
          {currentImpact.itemType === 'chappal' && (
            <div className="flex items-center gap-1 bg-red-600/90 text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-yellow-300 shadow-xl animate-pulse whitespace-nowrap">
              <span>PHATAK! 🩴💥</span>
            </div>
          )}
          {currentImpact.itemType === 'chai' && (
            <div className="flex items-center gap-1 bg-amber-700/90 text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-amber-300 shadow-xl whitespace-nowrap">
              <span>GARAM CHAI! ☕♨️</span>
            </div>
          )}
          {currentImpact.itemType === 'tomato' && (
            <div className="flex items-center gap-1 bg-red-700/90 text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-red-300 shadow-xl whitespace-nowrap">
              <span>SPLATTER! 🍅💦</span>
            </div>
          )}
          {currentImpact.itemType === 'cash' && (
            <div className="flex items-center gap-1 bg-emerald-600/90 text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-yellow-200 shadow-xl whitespace-nowrap">
              <span>PAISA HI PAISA! 💸✨</span>
            </div>
          )}
          {currentImpact.itemType === 'rose' && (
            <div className="flex items-center gap-1 bg-pink-600/90 text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-pink-200 shadow-xl whitespace-nowrap">
              <span>PYAAR SE! 🌹💖</span>
            </div>
          )}
        </div>
      )}

      {/* Real-Time Soundboard Speech Bubble Decal */}
      {soundboardDecal && (
        <div className={cn(
          "absolute pointer-events-none z-50 flex items-center justify-center animate-bounce",
          pickerAlign === 'left'
            ? "left-0 translate-x-0"
            : pickerAlign === 'right'
            ? "right-0 translate-x-0"
            : "left-1/2 -translate-x-1/2",
          isTopSeat ? "top-full mt-1 sm:mt-2" : "-top-8 sm:-top-10"
        )}>
          <div className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 text-black font-black text-[9px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border-1.5 sm:border-2 border-white shadow-[0_0_15px_rgba(245,158,11,0.7)] max-w-[140px] xs:max-w-[190px] sm:max-w-[260px]">
            <span className="text-xs sm:text-sm animate-pulse shrink-0">{soundboardDecal.emoji}</span>
            <span className="tracking-tight uppercase font-black truncate">{soundboardDecal.label}</span>
          </div>
        </div>
      )}

      {/* Throwable Target Picker Menu */}
      {!isSelf && (
        <ThrowablePicker
          targetPlayerId={player.id}
          targetPlayerName={player.name}
          isOpen={showThrowPicker}
          onClose={() => setShowThrowPicker(false)}
          onSelect={(type) => throwItem(player.id, type)}
        />
      )}
      {/* Player Header Capsule */}
      <div
        className={cn(
          'relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full backdrop-blur-md transition-all duration-300',
          'bg-black/65 border border-white/10 shadow-lg',
          isCurrentTurn && 'ring-2 ring-gold shadow-gold-glow bg-black/85 scale-105',
          !player.isConnected && 'opacity-60 border-red-500/50'
        )}
      >
        {/* Avatar Circle */}
        <div
          className={cn(
            'relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-white text-[10px] sm:text-xs shadow-md border border-white/30 transition-all duration-200 shrink-0',
            isSpeaking && 'ring-3 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)] scale-110'
          )}
          style={{ backgroundColor: player.avatarColor || '#3b82f6' }}
        >
          {player.name.charAt(0).toUpperCase()}
          {player.isHost && (
            <span className="absolute -top-2 -right-1 text-gold filter drop-shadow">
              <Crown className="w-3.5 h-3.5 fill-gold text-amber-900" />
            </span>
          )}

          {/* Voice Chat Muted Status Badge */}
          {isMuted && (
            <span className="absolute -bottom-1 -right-1 bg-red-600/95 text-white p-0.5 rounded-full shadow border border-black/40 z-10">
              <MicOff className="w-2 h-2" />
            </span>
          )}

          {/* Voice Chat Speaking Audio Wave Badge */}
          {isSpeaking && (
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-0.5 rounded-full shadow border border-black/40 z-10 animate-bounce">
              <Mic className="w-2 h-2" />
            </span>
          )}
        </div>

        {/* Player Name & Tag */}
        <div className="flex flex-col items-start leading-none sm:leading-tight">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="font-semibold text-[10px] sm:text-xs md:text-sm text-zinc-100 max-w-[50px] xs:max-w-[70px] sm:max-w-[85px] md:max-w-[110px] truncate">
              {player.name}
            </span>
            {isSelf && (
              <span className="text-[8px] sm:text-[9px] bg-white/20 text-zinc-200 px-1 py-0.2 rounded font-mono">
                YOU
              </span>
            )}
          </div>
          <span className="text-[8px] sm:text-[9px] md:text-[10px] text-zinc-400 mt-0.5">
            {player.hiddenCount} cards
          </span>
        </div>

        {/* Quick Throw Button (Only on opponents) - Touch Friendly */}
        {!isSelf && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowThrowPicker(!showThrowPicker);
            }}
            title={`Throw item at ${player.name}`}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-amber-500/40 to-yellow-500/40 hover:from-amber-500 hover:to-yellow-400 hover:text-black border border-gold/60 flex items-center justify-center text-xs sm:text-sm transition-all active:scale-90 cursor-pointer shadow-md ml-0.5 sm:ml-1 group touch-manipulation"
          >
            <span className="group-hover:scale-125 transition-transform">🩴</span>
          </button>
        )}

        {/* Disconnected Indicator */}
        {!player.isConnected && (
          <div title="Player disconnected (can reconnect anytime)">
            <WifiOff className="w-3 h-3 text-red-400 animate-pulse" />
          </div>
        )}

        {/* Turn indicator glow pill */}
        {isCurrentTurn && !player.isFinished && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gold text-black text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow">
            Turn
          </div>
        )}

        {/* Finished / Winner Podium Badge */}
        {player.isFinished && player.rank && (
          <div
            className={cn(
              'absolute -top-3 sm:-top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full font-black text-[8px] sm:text-[10px] tracking-wider uppercase shadow-xl whitespace-nowrap border',
              player.rank === 1 && 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black border-yellow-100 shadow-gold-glow animate-pulse',
              player.rank === 2 && 'bg-gradient-to-r from-slate-200 via-zinc-100 to-slate-300 text-zinc-900 border-white shadow-lg',
              player.rank === 3 && 'bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 text-amber-100 border-amber-400/60 shadow-lg',
              player.rank > 3 && 'bg-zinc-800 text-zinc-300 border-zinc-600'
            )}
          >
            <span>
              {player.rank === 1 ? '🥇 1st Place' : player.rank === 2 ? '🥈 2nd Place' : player.rank === 3 ? '🥉 3rd Place' : `${player.rank}th Place`}
            </span>
          </div>
        )}
      </div>

      {/* Golden Glowing Bazaar Open Badge */}
      {player.isBazaarOpen && (
        <div className="mt-0.5 sm:mt-1 flex items-center gap-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[8px] sm:text-[9px] font-black shadow-gold-glow animate-pulse border border-yellow-200">
          <Sparkles className="w-2.5 h-2.5 fill-black" />
          <span>BAZAAR OPEN</span>
        </div>
      )}

      {/* Opponent's Floating Drawn Card (Visible to All Players in Real Time - Mobile Responsive) */}
      {!isSelf && player.floatingCard && (
        <motion.div
          initial={{ scale: 0.2, y: 15, rotateY: 180, opacity: 0 }}
          animate={{ scale: 1, y: 0, rotateY: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 20 }}
          className="absolute z-40 flex flex-col items-center pointer-events-none filter drop-shadow-2xl top-full mt-1.5 sm:mt-2 left-1/2 -translate-x-1/2"
        >
          {/* Glowing Animated Drawn Card */}
          <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="relative rounded-[8px] sm:rounded-[10px] ring-2 sm:ring-3 ring-gold shadow-[0_0_18px_rgba(212,175,55,0.75)] animate-pulse-gold"
          >
            <PlayingCard card={player.floatingCard} size={activeCardSize === 'xxs' ? 'xs' : activeCardSize} glow={true} />

            {/* Picked Status Badge */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[7px] sm:text-[8px] font-black px-1.5 sm:px-2 py-0.2 rounded-full shadow-lg border border-yellow-200 flex items-center gap-0.5 whitespace-nowrap animate-bounce">
              <span>PICKED</span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Cards: Left Deck (Hidden Stack) & Right Deck (Face up top card) */}
      <div className="mt-0.5 sm:mt-1.5 flex items-center gap-1 sm:gap-2 relative">
        {/* Left Deck (Hidden Stack) */}
        <div className="flex flex-col items-center">
          <CardStack
            type="hidden"
            count={player.hiddenCount}
            isClickable={isSelf && canDrawCard}
            onClick={isSelf && canDrawCard ? onDrawCard : undefined}
            isHighlighted={isSelf && canDrawCard}
            size={activeCardSize}
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
              'relative transition-transform p-0.5 rounded-lg sm:rounded-xl',
              canPlaceOnRightDeck && 'cursor-pointer hover:scale-105 active:scale-95 ring-2 ring-gold/60 bg-gold/10'
            )}
          >
            {canDragRightDeck && player.rightDeckTop ? (
              <motion.div
                drag
                dragSnapToOrigin={true}
                dragElastic={0.08}
                whileHover={{ scale: 1.06, cursor: 'grab' }}
                whileDrag={{ scale: 1.15, zIndex: 100, cursor: 'grabbing', rotate: 0 }}
                onDragStart={() => setIsDraggingRight(true)}
                onDragEnd={handleRightDeckDragEnd}
                className="touch-none relative"
              >
                <CardStack
                  type="right"
                  count={player.rightDeckCount}
                  topCard={player.rightDeckTop}
                  size={activeCardSize}
                  isHighlighted={true}
                  label="Right Deck"
                />
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[7px] sm:text-[8px] font-black px-1 sm:px-1.5 py-0.2 rounded-full shadow border border-yellow-200 flex items-center gap-0.5 pointer-events-none whitespace-nowrap animate-pulse">
                  <Grab className="w-2 h-2" />
                  <span>DRAG</span>
                </div>
              </motion.div>
            ) : (
              <CardStack
                type="right"
                count={player.rightDeckCount}
                topCard={player.rightDeckTop}
                size={activeCardSize}
                isHighlighted={false}
                label="Right Deck"
              />
            )}
            {canPlaceOnRightDeck && isSelf && (
              <div className="absolute inset-0 bg-gold/15 rounded-[8px] sm:rounded-[12px] flex items-center justify-center pointer-events-none">
                <span className="bg-gold text-black text-[7px] sm:text-[8px] font-black px-1 sm:px-1.5 py-0.2 rounded shadow">
                  DISCARD
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
