'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayerClientView } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Crown, WifiOff, Mic, MicOff } from 'lucide-react';
import { useVoiceStore } from '@/store/voiceStore';
import { useGameStore } from '@/store/gameStore';
import { ThrowablePicker } from '../table/ThrowablePicker';

interface BluffPlayerSeatProps {
  player: PlayerClientView;
  isCurrentTurn: boolean;
  isSelf: boolean;
  isLeader?: boolean;
  hasPassed?: boolean;
  cardsCount: number;
  positionClass?: string;
  turnTimeRemaining?: number;
}

export const BluffPlayerSeat: React.FC<BluffPlayerSeatProps> = ({
  player,
  isCurrentTurn,
  isSelf,
  isLeader = false,
  hasPassed = false,
  cardsCount,
  positionClass = '',
  turnTimeRemaining = 30,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const activeImpacts = useGameStore((s) => s.activeImpacts);
  const throwItem = useGameStore((s) => s.throwItem);
  const currentImpact = activeImpacts[player.id];

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
        positionClass
      )}
    >
      {/* Real-time Impact Splatters */}
      {currentImpact && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex items-center justify-center animate-bounce">
          {currentImpact.itemType === 'chappal' && (
            <div className="bg-red-600/95 text-white font-black text-xs px-2.5 py-0.5 rounded-full border border-yellow-300 shadow-lg whitespace-nowrap">
              PHATAK! 🩴💥
            </div>
          )}
          {currentImpact.itemType === 'chai' && (
            <div className="bg-amber-700/95 text-white font-black text-xs px-2.5 py-0.5 rounded-full border border-amber-300 shadow-lg whitespace-nowrap">
              GARAM CHAI! ☕♨️
            </div>
          )}
          {currentImpact.itemType === 'tomato' && (
            <div className="bg-red-700/95 text-white font-black text-xs px-2.5 py-0.5 rounded-full border border-red-300 shadow-lg whitespace-nowrap">
              SPLATTER! 🍅💦
            </div>
          )}
          {currentImpact.itemType === 'cash' && (
            <div className="bg-emerald-600/95 text-white font-black text-xs px-2.5 py-0.5 rounded-full border border-yellow-200 shadow-lg whitespace-nowrap">
              PAISA HI PAISA! 💸✨
            </div>
          )}
          {currentImpact.itemType === 'rose' && (
            <div className="bg-pink-600/95 text-white font-black text-xs px-2.5 py-0.5 rounded-full border border-pink-200 shadow-lg whitespace-nowrap">
              PYAAR SE! 🌹💖
            </div>
          )}
        </div>
      )}

      {/* Avatar Container */}
      <div className="relative">
        <div
          onClick={() => !isSelf && setShowPicker(!showPicker)}
          title={!isSelf ? "Click to throw items at this player!" : undefined}
          className={cn(
            'relative w-9 h-9 xs:w-11 xs:h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center font-black text-white text-xs sm:text-base shadow-xl transition-transform',
            !isSelf && 'cursor-pointer hover:scale-110 active:scale-95',
            isCurrentTurn && 'ring-4 ring-amber-400 ring-offset-2 ring-offset-black shadow-gold-glow animate-pulse',
            isSpeaking && 'ring-4 ring-emerald-400 animate-pulse'
          )}
          style={{ backgroundColor: player.avatarColor }}
        >
          {player.name.charAt(0).toUpperCase()}

          {/* Host Crown */}
          {player.isHost && (
            <Crown className="absolute -top-2.5 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold fill-gold drop-shadow-md" />
          )}

          {/* Voice Indicator */}
          {isInVoice && (
            <div
              className={cn(
                'absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border border-black shadow',
                isMuted ? 'bg-red-600 text-white' : isSpeaking ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400'
              )}
            >
              {isMuted ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
            </div>
          )}

          {/* Disconnected Indicator */}
          {!player.isConnected && (
            <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
              <WifiOff className="w-4 h-4 text-red-500" />
            </div>
          )}
        </div>

        {/* Throwable Picker Popup */}
        {!isSelf && (
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
      <div className="flex flex-col items-center mt-1">
        <div className="flex items-center gap-1">
          <span className="font-extrabold text-[10px] xs:text-xs text-white max-w-[85px] truncate drop-shadow">
            {player.name}
          </span>
          {isSelf && (
            <span className="text-[8px] bg-amber-400 text-black px-1 rounded font-black">
              YOU
            </span>
          )}
        </div>

        {/* Role & Turn Status Badges */}
        <div className="flex items-center gap-1 mt-0.5">
          {isLeader && (
            <span className="text-[8px] bg-amber-500/30 text-amber-300 border border-amber-500/50 px-1 py-0.2 rounded font-black uppercase">
              Leader
            </span>
          )}
          {hasPassed && (
            <span className="text-[8px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-1 py-0.2 rounded font-bold uppercase">
              Passed
            </span>
          )}
          {isCurrentTurn && (
            <span className="text-[8px] bg-amber-400 text-black px-1.5 py-0.2 rounded-full font-black animate-pulse flex items-center gap-0.5">
              <span>{turnTimeRemaining}s</span>
            </span>
          )}
        </div>

        {/* Card Count Visual Pill */}
        {!isSelf && (
          <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-gold text-[9px] xs:text-[10px] font-black shadow">
            <span>🃏</span>
            <span>{cardsCount} Cards</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
