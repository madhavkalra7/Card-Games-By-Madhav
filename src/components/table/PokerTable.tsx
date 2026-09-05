'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameStateClientView, PlayerClientView } from '@/lib/types';
import { PlayerSeat } from './PlayerSeat';
import { CenterBazaar } from './CenterBazaar';
import { DraggableTurnCard } from '../card/DraggableTurnCard';
import { FlyingPenaltyOverlay } from './FlyingPenaltyOverlay';
import { ExitConfirmModal } from '../modal/ExitConfirmModal';
import { canPlayOnAnyCenterDeck, canPlayOnOtherRightDeck } from '@/lib/validator';
import { sounds } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';
import { VoiceControls } from '../voice/VoiceControls';
import { useViewportOrientation } from '@/hooks/useViewportOrientation';
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

  const { setRulesModalOpen, showToast, leaveRoom } = useGameStore();
  const router = useRouter();
  const { isLandscape, isMobile } = useViewportOrientation();
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [showExitModal, setShowExitModal] = useState(false);

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

  // Seat positioning tailored dynamically for Portrait and Landscape orientations
  const getSeatPositionClass = (idx: number, count: number): string => {
    // Current player (Self) is always at bottom center
    if (idx === 0) {
      return 'bottom-1 sm:bottom-2 md:bottom-4 left-1/2 -translate-x-1/2';
    }

    // 2-Player (Self + 1 Opponent)
    if (count === 2) {
      return isLandscape
        ? 'top-1 sm:top-2 left-1/2 -translate-x-1/2'
        : 'top-10 sm:top-12 left-1/2 -translate-x-1/2';
    }

    // 3-Player (Self + 2 Opponents)
    if (count === 3) {
      if (isLandscape) {
        // Landscape: Opponents on Left and Right flanks
        if (idx === 1) return 'top-1/2 -translate-y-1/2 left-1 sm:left-4 md:left-8';
        if (idx === 2) return 'top-1/2 -translate-y-1/2 right-1 sm:right-4 md:right-8';
      } else {
        // Portrait: Opponents arched across the top
        if (idx === 1) return 'top-10 sm:top-14 left-1 sm:left-4 md:left-8';
        if (idx === 2) return 'top-10 sm:top-14 right-1 sm:right-4 md:right-8';
      }
    }

    // 4-Player (Self + 3 Opponents)
    if (count === 4) {
      if (isLandscape) {
        // Landscape: Left flank, Top center (compact), Right flank
        if (idx === 1) return 'top-1/2 -translate-y-1/2 left-1 sm:left-3 md:left-8';
        if (idx === 2) return 'top-1 sm:top-2 left-1/2 -translate-x-1/2';
        if (idx === 3) return 'top-1/2 -translate-y-1/2 right-1 sm:right-3 md:right-8';
      } else {
        // Portrait: 3 opponents arched across the top (zero collision with center bazaar!)
        if (idx === 1) return 'top-14 sm:top-16 left-1 sm:left-3';
        if (idx === 2) return 'top-9 sm:top-11 left-1/2 -translate-x-1/2';
        if (idx === 3) return 'top-14 sm:top-16 right-1 sm:right-3';
      }
    }

    // 5-Player (Self + 4 Opponents)
    if (count >= 5) {
      if (isLandscape) {
        // Landscape: 2 on Left flank (top & bottom), 2 on Right flank (top & bottom)
        // Leaving vertical center channel 100% CLEAR for Center Bazaar!
        if (idx === 1) return 'top-[20%] -translate-y-1/2 left-1 sm:left-3 md:left-6';
        if (idx === 2) return 'top-[74%] -translate-y-1/2 left-1 sm:left-3 md:left-6';
        if (idx === 3) return 'top-[20%] -translate-y-1/2 right-1 sm:right-3 md:right-6';
        if (idx === 4) return 'top-[74%] -translate-y-1/2 right-1 sm:right-3 md:right-6';
      } else {
        // Portrait: 4 opponents in an arched semi-circle across the top
        if (idx === 1) return 'top-[16%] left-0.5 sm:left-2';
        if (idx === 2) return 'top-[9%] left-[27%] -translate-x-1/2';
        if (idx === 3) return 'top-[9%] right-[27%] translate-x-1/2';
        if (idx === 4) return 'top-[16%] right-0.5 sm:right-2';
      }
    }

    return 'top-1 sm:top-6 left-1/2 -translate-x-1/2';
  };

  // Card size calculation per seat
  const getPlayerCardSize = (isSelf: boolean, total: number): 'xxs' | 'xs' | 'sm' | 'md' => {
    if (isSelf) return 'sm';
    if (total >= 5 && isMobile) return 'xxs';
    if (isMobile) return 'xs';
    return 'xs';
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
    <div className="relative w-full h-[100dvh] max-h-[100dvh] flex items-center justify-center p-0.5 sm:p-1.5 md:p-2 select-none overflow-hidden bg-black">
      
      {/* Outer Walnut Wood Rail Framing Full Screen */}
      <div className="relative w-full h-full rounded-[10px] sm:rounded-[24px] md:rounded-[40px] walnut-rail-border p-0.5 sm:p-1 md:p-2 flex items-center justify-center bg-[#24160d] overflow-hidden">
        
        {/* Physical Felt Taash Table Inner Area Filling 100% of Screen */}
        <div className="relative w-full h-full rounded-[8px] sm:rounded-[18px] md:rounded-[32px] poker-felt-bg shadow-poker-felt border border-emerald-500/25 flex items-center justify-center overflow-hidden">
          
          {/* Minimal Floating HUD (Top Left: Room Code) */}
          <div className="absolute top-1 sm:top-2.5 left-1 sm:left-3 z-30 flex items-center gap-1 sm:gap-2 bg-black/75 backdrop-blur-md px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-gold/40 shadow-lg">
            <span className="text-[8px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Room</span>
            <span className="font-mono font-black text-[11px] sm:text-sm text-gold tracking-wider">{roomCode}</span>
            <button
              onClick={handleCopy}
              title="Copy Room Code"
              className="p-0.5 sm:p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              {copied ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" /> : <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
            </button>
          </div>

          {/* Minimal Floating HUD (Top Right: Voice Controls, Rules, Audio, Exit) */}
          <div className="absolute top-1 sm:top-2.5 right-1 sm:right-3 z-30 flex items-center gap-1 sm:gap-1.5">
            {/* Real-Time Voice Chat Controls */}
            <VoiceControls roomCode={roomCode} />

            <button
              onClick={() => setRulesModalOpen(true)}
              title="View Rules"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] font-bold text-zinc-300 hover:text-gold hover:border-gold/40 shadow transition-all"
            >
              <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold" />
              <span className="hidden md:inline">Rules</span>
            </button>
            <button
              onClick={handleToggleSound}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-1 sm:p-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-zinc-300 hover:text-white shadow transition-all"
            >
              {isMuted ? <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" /> : <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={() => setShowExitModal(true)}
              title="Leave Room"
              className="p-1 sm:p-1.5 rounded-full bg-red-950/60 backdrop-blur-md border border-red-800/60 text-red-300 hover:text-white shadow transition-all active:scale-95"
            >
              <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Center Bazaar with 4 Center Decks - Centered in Felt */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto">
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
            const seatCardSize = getPlayerCardSize(isSelf, totalPlayers);

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
                  cardSize={seatCardSize}
                />
              </div>
            );
          })}

          {/* Pass Turn button when hidden cards are exhausted and player cannot play their right deck */}
          {isMyTurn && !myFloatingCard && (me?.hiddenCount ?? 0) === 0 && (me?.rightDeckCount ?? 0) > 0 && (
            <div className="absolute bottom-20 sm:bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 z-30">
              <button
                onClick={() => useGameStore.getState().passTurn()}
                className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-black/85 hover:bg-black text-amber-300 border border-amber-400/50 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>Pass Turn</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Smooth Drag & Drop Draggable Card */}
      {isMyTurn && myFloatingCard && (
        <DraggableTurnCard
          card={myFloatingCard}
          onDropCenter={onPlaceCenter}
          onDropRightDeck={onPlaceRightDeck}
          timeRemaining={turnTimeRemaining}
          isLandscape={isLandscape}
        />
      )}

      {/* Auto-Penalty Flying Cards Animation Overlay */}
      <FlyingPenaltyOverlay animationData={activePenaltyAnimation || null} />

      {/* Clean Exit Confirmation Modal */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => {
          setShowExitModal(false);
          leaveRoom();
          router.push('/');
        }}
        isPlaying={state.status === 'PLAYING'}
      />
    </div>
  );
};
