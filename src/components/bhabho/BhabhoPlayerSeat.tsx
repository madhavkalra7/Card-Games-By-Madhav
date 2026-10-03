'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayerClientView } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Crown, WifiOff, Mic, MicOff, Trophy } from 'lucide-react';
import { useVoiceStore } from '@/store/voiceStore';
import { useGameStore } from '@/store/gameStore';
import { useViewportOrientation } from '@/hooks/useViewportOrientation';
import { ThrowablePicker } from '../table/ThrowablePicker';

interface BhabhoPlayerSeatProps {
  player: PlayerClientView;
  isCurrentTurn: boolean;
  isSelf: boolean;
  isTrickStarter?: boolean;
  isEscaped?: boolean;
  escapeRank?: number | null;
  cardsCount: number;
  positionClass?: string;
  turnTimeRemaining?: number;
  onOpenThrowablePicker?: (playerId: string, playerName: string) => void;
}

export const BhabhoPlayerSeat: React.FC<BhabhoPlayerSeatProps> = ({
  player,
  isCurrentTurn,
  isSelf,
  isTrickStarter = false,
  isEscaped = false,
  escapeRank = null,
  cardsCount,
  positionClass = '',
  turnTimeRemaining = 30,
  onOpenThrowablePicker,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const activeImpacts = useGameStore((s) => s.activeImpacts);
  const throwItem = useGameStore((s) => s.throwItem);
  const currentImpact = activeImpacts[player.id];

  const { isLandscape, isMobile, viewportHeight } = useViewportOrientation();
  const isLandscapeMobile = isLandscape && (viewportHeight <= 520 || isMobile);

  // Voice chat integration
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

  // Seat position detection for zero-cut-off splatter anchoring
  const isTopSeat = (
    positionClass.includes('top-1') ||
    positionClass.includes('top-2') ||
    positionClass.includes('top-3') ||
    positionClass.includes('top-4') ||
    positionClass.includes('top-5') ||
    positionClass.includes('top-6') ||
    positionClass.includes('top-7') ||
    positionClass.includes('top-8') ||
    positionClass.includes('top-12') ||
    positionClass.includes('top-13') ||
    positionClass.includes('top-14') ||
    positionClass.includes('top-15') ||
    positionClass.includes('top-16')
  ) && !positionClass.includes('top-1/2');

  const isLeftFlank = positionClass.includes('left-0') || positionClass.includes('left-1') || positionClass.includes('left-2') || positionClass.includes('left-3');
  const isRightFlank = positionClass.includes('right-0') || positionClass.includes('right-1') || positionClass.includes('right-2') || positionClass.includes('right-3');
  const pickerAlign: 'center' | 'left' | 'right' = isLeftFlank ? 'left' : isRightFlank ? 'right' : 'center';

  return (
    <motion.div
      id={`player-seat-${player.id}`}
      animate={currentImpact ? {
        x: [-10, 10, -6, 6, -3, 3, 0],
        y: [-5, 5, -3, 3, 0],
        rotate: [-5, 5, -2, 2, 0],
      } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'absolute flex flex-col items-center select-none transition-all duration-300 z-20',
        isLandscapeMobile ? 'scale-70 xs:scale-75 sm:scale-85 md:scale-95' : 'scale-85 xs:scale-90 sm:scale-100',
        positionClass,
        isEscaped && 'opacity-70'
      )}
    >
      {/* Real-time Impact Splatters */}
      {currentImpact && (
        <div
          className={cn(
            'absolute pointer-events-none z-50 flex items-center justify-center animate-bounce',
            isTopSeat
              ? 'top-7 xs:top-8 sm:top-10 left-1/2 -translate-x-1/2'
              : '-top-7 sm:-top-8 left-1/2 -translate-x-1/2'
          )}
        >
          {currentImpact.itemType === 'chappal' && (
            <div className="bg-red-600/95 text-white font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border border-yellow-300 shadow-[0_4px_15px_rgba(220,38,38,0.7)] whitespace-nowrap">
              PHATAK! 🩴💥
            </div>
          )}
          {currentImpact.itemType === 'chai' && (
            <div className="bg-amber-700/95 text-white font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border border-amber-300 shadow-[0_4px_15px_rgba(217,119,6,0.7)] whitespace-nowrap">
              GARAM CHAI! ☕♨️
            </div>
          )}
          {currentImpact.itemType === 'tomato' && (
            <div className="bg-red-700/95 text-white font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border border-red-300 shadow-[0_4px_15px_rgba(185,28,28,0.7)] whitespace-nowrap">
              SPLATTER! 🍅💦
            </div>
          )}
          {currentImpact.itemType === 'cash' && (
            <div className="bg-emerald-600/95 text-white font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border border-yellow-200 shadow-[0_4px_15px_rgba(16,185,129,0.7)] whitespace-nowrap">
              PAISA HI PAISA! 💸✨
            </div>
          )}
          {currentImpact.itemType === 'rose' && (
            <div className="bg-pink-600/95 text-white font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border border-pink-200 shadow-[0_4px_15px_rgba(236,72,153,0.7)] whitespace-nowrap">
              PYAAR SE! 🌹💖
            </div>
          )}
        </div>
      )}

      {/* Avatar Container */}
      <div className="relative">
        <div
          onClick={() => {
            if (isSelf) return;
            if (onOpenThrowablePicker) {
              onOpenThrowablePicker(player.id, player.name);
            } else {
              setShowPicker(!showPicker);
            }
          }}
          title={!isSelf ? `Throw items at ${player.name}!` : undefined}
          className={cn(
            'relative w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-white text-xs sm:text-base shadow-xl transition-transform',
            !isSelf && 'cursor-pointer hover:scale-110 active:scale-95 touch-manipulation',
            isCurrentTurn && 'ring-3 sm:ring-4 ring-emerald-400 ring-offset-1 sm:ring-offset-2 ring-offset-black shadow-emerald-glow animate-pulse',
            isSpeaking && 'ring-3 sm:ring-4 ring-cyan-400 animate-pulse',
            isEscaped && 'ring-2 ring-gold/70'
          )}
          style={{ backgroundColor: player.avatarColor }}
        >
          {player.name.charAt(0).toUpperCase()}

          {/* Host Crown */}
          {player.isHost && (
            <Crown className="absolute -top-2 -right-1 w-3 h-3 sm:w-4 sm:h-4 text-gold fill-gold drop-shadow-md" />
          )}

          {/* Voice Indicator */}
          {isInVoice && (
            <div
              className={cn(
                'absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border border-black shadow',
                isMuted ? 'bg-red-600 text-white' : isSpeaking ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400'
              )}
            >
              {isMuted ? <MicOff className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> : <Mic className="w-2 h-2 sm:w-2.5 sm:h-2.5" />}
            </div>
          )}

          {/* Disconnected Indicator */}
          {!player.isConnected && (
            <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
              <WifiOff className="w-3.5 h-3.5 text-red-500" />
            </div>
          )}

          {/* Escaped Trophy Medal Badge */}
          {isEscaped && (
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-white text-black flex items-center justify-center shadow-md">
              <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-black" />
            </div>
          )}

          {/* Quick Throw Button on Opponent Avatar */}
          {!isSelf && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenThrowablePicker) {
                  onOpenThrowablePicker(player.id, player.name);
                } else {
                  setShowPicker(!showPicker);
                }
              }}
              title={`Throw item at ${player.name}`}
              className="absolute -bottom-1 -left-1 w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black flex items-center justify-center text-[9px] xs:text-[10px] sm:text-xs shadow-md border border-white cursor-pointer active:scale-90 transition-transform z-10"
            >
              <span>🩴</span>
            </button>
          )}
        </div>

        {/* Fallback Throwable Picker Popup */}
        {!isSelf && !onOpenThrowablePicker && (
          <ThrowablePicker
            isOpen={showPicker}
            targetPlayerId={player.id}
            targetPlayerName={player.name}
            onClose={() => setShowPicker(false)}
            onSelect={(type) => {
              throwItem(player.id, type);
              setShowPicker(false);
            }}
            align={pickerAlign}
          />
        )}
      </div>

      {/* Name and Status Tag */}
      <div className="flex flex-col items-center mt-0.5 sm:mt-1">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <span className="font-extrabold text-[9px] xs:text-[10px] sm:text-xs text-white max-w-[68px] xs:max-w-[78px] sm:max-w-[95px] truncate drop-shadow">
            {player.name}
          </span>
          {isSelf && (
            <span className="text-[7px] xs:text-[8px] bg-emerald-400 text-black px-1 rounded font-black">
              YOU
            </span>
          )}
        </div>

        {/* Role & Turn Status Badges */}
        <div className="flex items-center gap-1 mt-0.5">
          {isEscaped ? (
            <span className="text-[7px] xs:text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1 py-0.2 rounded font-black uppercase tracking-wider">
              #{escapeRank || 1} Escaped
            </span>
          ) : isTrickStarter ? (
            <span className="text-[7px] xs:text-[8px] bg-amber-500/30 text-amber-300 border border-amber-500/50 px-1 py-0.2 rounded font-black uppercase">
              Leader
            </span>
          ) : null}

          {isCurrentTurn && !isEscaped && (
            <span className="text-[7px] xs:text-[8px] bg-gradient-to-r from-emerald-400 to-green-300 text-black px-1.5 py-0.2 rounded-full font-black animate-pulse uppercase tracking-wider shadow-sm flex items-center gap-0.5">
              <span>TURN</span>
              <span className="font-mono text-[6px]">({turnTimeRemaining}s)</span>
            </span>
          )}
        </div>

        {/* Card Count Visual Pill */}
        {!isSelf && !isEscaped && (
          <div className="mt-0.5 sm:mt-1 flex items-center gap-1 px-1.5 xs:px-2 py-0.2 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-gold text-[8px] xs:text-[9px] sm:text-[10px] font-black shadow">
            <span>🃏</span>
            <span>{cardsCount}</span>
            <span className="hidden xs:inline">Cards</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
