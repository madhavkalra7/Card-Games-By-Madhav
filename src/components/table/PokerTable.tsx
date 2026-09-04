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
import { BookOpen, Check, Copy, LogOut, Volume2, VolumeX } from 'lucide-react';

interface PokerTableProps {
  state: GameStateClientView;
  onDrawCard: () => void;
  onPlaceCenter: (targetDeckId?: any) => void;
  onPlaceRightDeck: (targetPlayerId: string) => void;
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

  // Symmetrical seat positioning tailored to actual player count
  const getSeatPositionClass = (idx: number, count: number): string => {
    if (idx === 0) {
      // Current player (Self) is always at bottom center
      return 'bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2';
    }

    if (count === 3) {
      // Symmetrical 3-Player Triangle
      if (idx === 1) return 'top-8 sm:top-12 left-10 sm:left-32 -translate-x-1/2';
      if (idx === 2) return 'top-8 sm:top-12 right-10 sm:right-32 translate-x-1/2';
    }

    if (count === 4) {
      // Symmetrical 4-Player Diamond
      if (idx === 1) return 'top-1/2 -translate-y-1/2 left-3 sm:left-12';
      if (idx === 2) return 'top-6 sm:top-8 left-1/2 -translate-x-1/2';
      if (idx === 3) return 'top-1/2 -translate-y-1/2 right-3 sm:right-12';
    }

    if (count >= 5) {
      // Symmetrical 5-Player Pentagon
      if (idx === 1) return 'top-[58%] -translate-y-1/2 left-2 sm:left-10';
      if (idx === 2) return 'top-6 sm:top-8 left-1/4 -translate-x-1/2';
      if (idx === 3) return 'top-6 sm:top-8 right-1/4 translate-x-1/2';
      if (idx === 4) return 'top-[58%] -translate-y-1/2 right-2 sm:right-10';
    }

    return 'top-8 left-1/2 -translate-x-1/2';
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
    <div className="relative w-full h-screen min-h-[600px] flex items-center justify-center p-1 sm:p-2 select-none overflow-hidden bg-black">
      
      {/* Outer Walnut Wood Rail Framing Full Screen */}
      <div className="relative w-full h-full rounded-[24px] sm:rounded-[45px] walnut-rail-border p-2 sm:p-3 flex items-center justify-center bg-[#24160d] overflow-hidden">
        
        {/* Physical Felt Taash Table Inner Area Filling 100% of Screen */}
        <div className="relative w-full h-full rounded-[16px] sm:rounded-[36px] poker-felt-bg shadow-poker-felt border border-emerald-500/25 flex items-center justify-center overflow-hidden">
          
          {/* Minimal Floating HUD (Top Left: Room Code) */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-2 bg-black/65 backdrop-blur-md px-3 py-1.5 rounded-full border border-gold/40 shadow-lg">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Room</span>
            <span className="font-mono font-black text-xs sm:text-sm text-gold tracking-widest">{roomCode}</span>
            <button
              onClick={handleCopy}
              title="Copy Room Code"
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Minimal Floating HUD (Top Right: Rules, Audio, Exit) */}
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
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
                />
              </div>
            );
          })}

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
