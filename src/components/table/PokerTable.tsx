'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GameStateClientView, PlayerClientView } from '@/lib/types';
import { PlayerSeat } from './PlayerSeat';
import { CenterBazaar } from './CenterBazaar';
import { DraggableTurnCard } from '../card/DraggableTurnCard';
import { FlyingPenaltyOverlay } from './FlyingPenaltyOverlay';
import { canPlayOnAnyCenterDeck, canPlayOnOtherRightDeck } from '@/lib/validator';
import { sounds } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';
import { VoiceControls } from '../voice/VoiceControls';
import { BookOpen, Check, Copy, LogOut, Volume2, VolumeX } from 'lucide-react';

interface PokerTableProps {
  state: GameStateClientView;
  onDrawCard: () => void;
  onPlaceCenter: (targetDeckId?: any, fromRightDeck?: boolean) => void;
  onPlaceRightDeck: (targetPlayerId: string, fromRightDeck?: boolean) => void;
  onOpenPenaltyModal?: () => void;
}

export const PokerTable: React.FC<PokerTableProps> = ({
  state,
  onDrawCard,
  onPlaceCenter,
  onPlaceRightDeck,
}) => {
  const {
    roomCode,
    players,
    myPlayerId,
    currentTurnPlayerId,
    centerBaseRank,
    centerDecks,
    centerCard,
    centerCount,
    myFloatingCard,
    turnTimeRemaining,
    activePenaltyAnimation,
  } = state;

  const { setRulesModalOpen, showToast } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  const me = players.find(p => p.id === myPlayerId);
  const isMyTurn = currentTurnPlayerId === myPlayerId;
  const canDraw = isMyTurn && !myFloatingCard && (me?.hiddenCount ?? 0) > 0;

  // Center deck validation for floating card
  const canPlayCenter = myFloatingCard && centerDecks
    ? canPlayOnAnyCenterDeck(myFloatingCard, centerDecks, centerBaseRank).canPlay
    : false;

  // Arrange players relative to current user (so current user is always at bottom center)
  const myIndex = players.findIndex(p => p.id === myPlayerId);
  const reorderedPlayers: { player: PlayerClientView; positionIndex: number }[] = [];

  if (myIndex !== -1) {
    for (let i = 0; i < players.length; i++) {
      const p = players[(myIndex + i) % players.length];
      reorderedPlayers.push({ player: p, positionIndex: i });
    }
  } else {
    players.forEach((p, i) => reorderedPlayers.push({ player: p, positionIndex: i }));
  }

  const totalPlayers = reorderedPlayers.length;

  // Symmetrical seat positioning tailored to actual player count and mobile landscape
  const getSeatPositionClass = (idx: number, count: number): string => {
    if (idx === 0) {
      // Current player (Self) is always at bottom center
      return 'bottom-1 sm:bottom-2 md:bottom-4 left-1/2 -translate-x-1/2';
    }

    if (count === 3) {
      // Symmetrical 3-Player Triangle
      if (idx === 1) return 'top-1 sm:top-4 md:top-8 left-4 sm:left-16 md:left-32 -translate-x-1/2';
      if (idx === 2) return 'top-1 sm:top-4 md:top-8 right-4 sm:right-16 md:right-32 translate-x-1/2';
    }

    if (count === 4) {
      // Symmetrical 4-Player Diamond
      if (idx === 1) return 'top-1/2 -translate-y-1/2 left-1 sm:left-4 md:left-8';
      if (idx === 2) return 'top-1 sm:top-2 md:top-6 left-1/2 -translate-x-1/2';
      if (idx === 3) return 'top-1/2 -translate-y-1/2 right-1 sm:right-4 md:right-8';
    }

    if (count >= 5) {
      // Symmetrical 5-Player Pentagon
      if (idx === 1) return 'top-1/2 -translate-y-1/2 left-1 sm:left-3 md:left-6';
      if (idx === 2) return 'top-1 sm:top-2 md:top-6 left-[28%] -translate-x-1/2';
      if (idx === 3) return 'top-1 sm:top-2 md:top-6 right-[28%] translate-x-1/2';
      if (idx === 4) return 'top-1/2 -translate-y-1/2 right-1 sm:right-3 md:right-6';
    }

    return 'top-1 sm:top-6 left-1/2 -translate-x-1/2';
  };

  const handleCopy = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    showToast(`Room code ${roomCode} copied!`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    showToast(muted ? 'Sound muted' : 'Sound enabled', 'info');
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] flex items-center justify-center p-0.5 sm:p-2 select-none overflow-hidden bg-black">
      
      {/* Outer Walnut Wood Rail Framing Full Screen */}
      <div className="relative w-full h-full rounded-[14px] sm:rounded-[28px] md:rounded-[45px] walnut-rail-border p-1 sm:p-2 flex items-center justify-center bg-[#24160d] overflow-hidden">
        
        {/* Physical Felt Taash Table Inner Area Filling 100% of Screen */}
        <div className="relative w-full h-full rounded-[10px] sm:rounded-[20px] md:rounded-[36px] poker-felt-bg shadow-poker-felt border border-emerald-500/25 flex items-center justify-center overflow-hidden">
          
          {/* Minimal Floating HUD (Top Left: Room Code) */}
          <div className="absolute top-1.5 sm:top-3 left-1.5 sm:left-3 z-30 flex items-center gap-1.5 sm:gap-2 bg-black/65 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gold/40 shadow-lg">
            <span className="text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Room</span>
            <span className="font-mono font-black text-xs sm:text-sm text-gold tracking-widest">{roomCode}</span>
            <button
              onClick={handleCopy}
              title="Copy Room Code"
              className="p-0.5 sm:p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Minimal Floating HUD (Top Right: Voice Controls, Rules, Audio, Exit) */}
          <div className="absolute top-1.5 sm:top-3 right-1.5 sm:right-3 z-30 flex items-center gap-1 sm:gap-1.5">
            {/* Real-Time Voice Chat Controls */}
            <VoiceControls roomCode={roomCode} />

            <button
              onClick={() => setRulesModalOpen(true)}
              title="View Rules"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-[11px] font-bold text-zinc-300 hover:text-gold hover:border-gold/40 shadow transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-gold" />
              <span className="hidden sm:inline">Rules</span>
            </button>
            <button
              onClick={handleToggleSound}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-zinc-300 hover:text-white shadow transition-all"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <Link
              href="/"
              title="Leave Room"
              className="p-1.5 rounded-full bg-red-950/60 backdrop-blur-md border border-red-800/60 text-red-300 hover:text-white shadow transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Center Bazaar with 4 Center Decks */}
          <div className="z-10">
            <CenterBazaar
              centerDecks={centerDecks || []}
              baseRank={centerBaseRank}
              centerCard={centerCard}
              floatingCard={myFloatingCard}
              isMyTurn={isMyTurn}
              onPlaceCenter={onPlaceCenter}
            />
          </div>

          {/* Circular Player Seats - Symmetrically Arranged */}
          {reorderedPlayers.map(({ player, positionIndex }) => {
            const isSelf = player.id === myPlayerId;
            const isTurn = player.id === currentTurnPlayerId;

            // Can active player place on this player's right deck?
            let canPlaceRight = false;
            if (isMyTurn && myFloatingCard) {
              if (isSelf) {
                canPlaceRight = true;
              } else if (me?.isBazaarOpen) {
                canPlaceRight = canPlayOnOtherRightDeck(myFloatingCard, player.rightDeckTop, true).valid;
              }
            }

            const canDragRight = isSelf && isMyTurn && !myFloatingCard && (player.rightDeckCount > 0);

            return (
              <div key={player.id} className={`absolute ${getSeatPositionClass(positionIndex, totalPlayers)}`}>
                <PlayerSeat
                  player={player}
                  isSelf={isSelf}
                  isCurrentTurn={isTurn}
                  canDrawCard={isSelf && canDraw}
                  onDrawCard={onDrawCard}
                  canPlaceOnRightDeck={canPlaceRight}
                  onPlaceRightDeck={() => onPlaceRightDeck(player.id)}
                  canDragRightDeck={canDragRight}
                  onDropCenterFromRightDeck={(deckId) => onPlaceCenter(deckId, true)}
                  onDropRightDeckFromRightDeck={(targetPlayerId) => onPlaceRightDeck(targetPlayerId, true)}
                />
              </div>
            );
          })}

          {/* Pass Turn button when hidden cards are exhausted and player cannot play their right deck */}
          {isMyTurn && !myFloatingCard && (me?.hiddenCount ?? 0) === 0 && (me?.rightDeckCount ?? 0) > 0 && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30">
              <button
                onClick={() => useGameStore.getState().passTurn()}
                className="px-4 py-1.5 rounded-full bg-black/85 hover:bg-black text-amber-300 border border-amber-400/50 text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>Pass Turn</span>
              </button>
            </div>
          )}

          {/* Manual Penalty Button commented out per rules - Auto-penalty automatically handles violations! */}
          {/*
          {me?.isBazaarOpen && state.status === 'PLAYING' && (
            <div className="absolute top-4 right-4 z-30">
              <button
                onClick={onOpenPenaltyModal}
                className="flex items-center gap-2 bg-red-700 text-white font-black px-4 py-2 rounded-full"
              >
                CALL PENALTY
              </button>
            </div>
          )}
          */}

        </div>
      </div>

      {/* Smooth Drag & Drop Draggable Card */}
      {isMyTurn && myFloatingCard && (
        <DraggableTurnCard
          card={myFloatingCard}
          onDropCenter={onPlaceCenter}
          onDropRightDeck={onPlaceRightDeck}
          timeRemaining={turnTimeRemaining}
        />
      )}

      {/* Auto-Penalty Flying Cards Animation Overlay */}
      <FlyingPenaltyOverlay animationData={activePenaltyAnimation || null} />
    </div>
  );
};
