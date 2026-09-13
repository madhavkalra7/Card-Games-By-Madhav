'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameStateClientView, PlayerClientView } from '@/lib/types';
import { PlayerSeat } from './PlayerSeat';
import { CenterBazaar } from './CenterBazaar';
import { DraggableTurnCard } from '../card/DraggableTurnCard';
import { FlyingPenaltyOverlay } from './FlyingPenaltyOverlay';
import { CardFlightOverlay } from './CardFlightOverlay';
import { ThrowablesOverlay } from './ThrowablesOverlay';
import { ExitConfirmModal } from '../modal/ExitConfirmModal';
import { canPlayOnAnyCenterDeck, canPlayOnOtherRightDeck } from '@/lib/validator';
import { sounds } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';
import { VoiceControls } from '../voice/VoiceControls';
import { useViewportOrientation } from '@/hooks/useViewportOrientation';
import { useFriendsStore } from '@/store/friendsStore';
import { BookOpen, Check, Copy, LogOut, Volume2, VolumeX, UserPlus, ShieldAlert, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const { setRulesModalOpen, setSoundboardOpen, showToast, leaveRoom } = useGameStore();
  const { setInviteModalOpen } = useFriendsStore();
  const router = useRouter();
  const { isLandscape, isMobile } = useViewportOrientation();
  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [showExitModal, setShowExitModal] = useState(false);

  // Auto-abort countdown timer tracking (120 seconds countdown)
  const [abortSeconds, setAbortSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!state.autoAbortTimer) {
      setAbortSeconds(null);
      return;
    }
    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((state.autoAbortTimer!.deadline - Date.now()) / 1000));
      setAbortSeconds(remaining);
    };
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [state.autoAbortTimer]);

  const formatAbortTime = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  const me = players.find(p => p.id === myPlayerId);
  const isMyTurn = currentTurnPlayerId === myPlayerId;
  const canDraw = isMyTurn && !myFloatingCard && ((me?.hiddenCount ?? 0) > 0 || (me?.rightDeckCount ?? 0) > 0);

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
    // Spectator view layout: Symmetrically arrange all seated players across top, left, and right flanks
    if (state.isSpectator) {
      if (count === 2) {
        return idx === 0
          ? (isLandscape ? 'top-1/2 -translate-y-1/2 left-1.5 sm:left-6 md:left-12' : 'top-[35%] -translate-y-1/2 left-1.5 xs:left-3 sm:left-6')
          : (isLandscape ? 'top-1/2 -translate-y-1/2 right-1.5 sm:right-6 md:right-12' : 'top-[35%] -translate-y-1/2 right-1.5 xs:right-3 sm:right-6');
      }
      if (count === 3) {
        if (idx === 0) return isLandscape ? 'top-1/2 -translate-y-1/2 left-1.5 sm:left-4 md:left-8' : 'top-[35%] -translate-y-1/2 left-1.5 sm:left-4';
        if (idx === 1) return isLandscape ? 'top-1 sm:top-2 left-1/2 -translate-x-1/2' : 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-14 left-1/2 -translate-x-1/2';
        if (idx === 2) return isLandscape ? 'top-1/2 -translate-y-1/2 right-1.5 sm:right-4 md:right-8' : 'top-[35%] -translate-y-1/2 right-1.5 sm:right-4';
      }
      if (count === 4) {
        if (idx === 0) return 'top-1/2 -translate-y-1/2 left-1.5 sm:left-4';
        if (idx === 1) return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-14 left-[28%] -translate-x-1/2';
        if (idx === 2) return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-14 right-[28%] translate-x-1/2';
        if (idx === 3) return 'top-1/2 -translate-y-1/2 right-1.5 sm:right-4';
      }
      if (count >= 5) {
        if (idx === 0) return 'top-[68%] -translate-y-1/2 left-1.5 sm:left-4';
        if (idx === 1) return 'top-[22%] -translate-y-1/2 left-1.5 sm:left-4';
        if (idx === 2) return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-14 left-1/2 -translate-x-1/2';
        if (idx === 3) return 'top-[22%] -translate-y-1/2 right-1.5 sm:right-4';
        if (idx === 4) return 'top-[68%] -translate-y-1/2 right-1.5 sm:right-4';
      }
    }

    // Current player (Self) is always at bottom center
    if (idx === 0) {
      return isLandscape
        ? 'bottom-[max(0.25rem,env(safe-area-inset-bottom))] sm:bottom-1 md:bottom-3 left-1/2 -translate-x-1/2'
        : 'bottom-[max(0.35rem,env(safe-area-inset-bottom))] sm:bottom-2 md:bottom-4 left-1/2 -translate-x-1/2';
    }

    // 2-Player (Self + 1 Opponent)
    if (count === 2) {
      return isLandscape
        ? 'top-1 sm:top-2 left-1/2 -translate-x-1/2 scale-90 sm:scale-100'
        : 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-14 left-1/2 -translate-x-1/2';
    }

    // 3-Player (Self + 2 Opponents)
    if (count === 3) {
      if (isLandscape) {
        // Landscape: Opponents on Left and Right flanks
        if (idx === 1) return 'top-1/2 -translate-y-1/2 left-1.5 sm:left-4 md:left-8';
        if (idx === 2) return 'top-1/2 -translate-y-1/2 right-1.5 sm:right-4 md:right-8';
      } else {
        // Portrait: Opponents spaced cleanly across top-left and top-right
        if (idx === 1) return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-14 left-1.5 xs:left-3 sm:left-6';
        if (idx === 2) return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-14 right-1.5 xs:right-3 sm:right-6';
      }
    }

    // 4-Player (Self + 3 Opponents)
    if (count === 4) {
      if (isLandscape) {
        // Landscape: Left flank, Top center (compact), Right flank
        if (idx === 1) return 'top-1/2 -translate-y-1/2 left-1.5 sm:left-3 md:left-8';
        if (idx === 2) return 'top-1 sm:top-2 left-1/2 -translate-x-1/2';
        if (idx === 3) return 'top-1/2 -translate-y-1/2 right-1.5 sm:right-3 md:right-8';
      } else {
        // Portrait: Oval table layout (West flank, North center, East flank)
        // Eliminates 3-in-a-row crowding at the top on mobile phones!
        if (idx === 1) return 'top-[27%] -translate-y-1/2 left-1 xs:left-2 sm:left-4';
        if (idx === 2) return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-15 left-1/2 -translate-x-1/2';
        if (idx === 3) return 'top-[27%] -translate-y-1/2 right-1 xs:right-2 sm:right-4';
      }
    }

    // 5-Player (Self + 4 Opponents)
    if (count >= 5) {
      if (isLandscape) {
        // Landscape: 2 on Left flank (top & bottom), 2 on Right flank (top & bottom)
        if (idx === 1) return 'top-[22%] -translate-y-1/2 left-1.5 sm:left-3 md:left-6';
        if (idx === 2) return 'top-[72%] -translate-y-1/2 left-1.5 sm:left-3 md:left-6';
        if (idx === 3) return 'top-[22%] -translate-y-1/2 right-1.5 sm:right-3 md:right-6';
        if (idx === 4) return 'top-[72%] -translate-y-1/2 right-1.5 sm:right-3 md:right-6';
      } else {
        // Portrait: 4 opponents in an arched semi-circle across the top
        if (idx === 1) return 'top-[28%] -translate-y-1/2 left-0.5 xs:left-1 sm:left-2';
        if (idx === 2) return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-14 left-[28%] -translate-x-1/2';
        if (idx === 3) return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-14 right-[28%] translate-x-1/2';
        if (idx === 4) return 'top-[28%] -translate-y-1/2 right-0.5 xs:right-1 sm:right-2';
      }
    }

    return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-6 left-1/2 -translate-x-1/2';
  };

  // Card size calculation per seat
  const getPlayerCardSize = (isSelf: boolean, total: number): 'xxs' | 'xs' | 'sm' | 'md' => {
    if (isSelf) {
      if (isLandscape && isMobile) return 'xs';
      return 'sm';
    }
    if (total >= 5 && isMobile) return 'xxs';
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
          
          {/* Minimal Floating HUD (Top Left: Room Code & Invite) - Non-Intrusive Mobile Sizing */}
          <div className="absolute top-[max(0.25rem,env(safe-area-inset-top))] left-[max(0.25rem,env(safe-area-inset-left))] sm:top-2.5 sm:left-3 z-30 flex items-center gap-1 sm:gap-2 pointer-events-auto">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-black/80 backdrop-blur-md px-1.5 xs:px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-gold/40 shadow-lg">
              <span className="text-[7.5px] xs:text-[8px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-wider hidden xs:inline">Room</span>
              <span className="font-mono font-black text-[10px] xs:text-[11px] sm:text-sm text-gold tracking-wider">{roomCode}</span>
              <button
                onClick={handleCopy}
                title="Copy Room Code"
                className="p-0.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" /> : <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
              </button>
            </div>

            <button
              onClick={() => setInviteModalOpen(true)}
              title="Direct Invite Friends"
              className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-auto sm:px-2.5 sm:py-1 rounded-full bg-black/80 hover:bg-gold/20 backdrop-blur-md border border-gold/50 text-gold text-[9px] sm:text-[11px] font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
              <span className="hidden sm:inline sm:ml-1">Invite</span>
            </button>

            {/* Spectator Mode Pill */}
            {state.isSpectator && (
              <div className="flex items-center gap-1.5 px-2 xs:px-2.5 py-0.5 sm:py-1 rounded-full bg-purple-900/80 border border-purple-400/60 text-purple-200 text-[9px] xs:text-[10px] sm:text-xs font-black shadow-lg animate-pulse">
                <Eye className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-purple-300" />
                <span>Spectating</span>
              </div>
            )}
          </div>

          {/* Floating Disconnect Auto-Abort Warning Banner */}
          {state.autoAbortTimer && abortSeconds !== null && (
            <div
              className={cn(
                "absolute left-1/2 -translate-x-1/2 z-40 max-w-[94vw] px-2.5 xs:px-3.5 py-1 sm:py-1.5 rounded-2xl bg-amber-950/95 border-2 border-amber-500/90 shadow-2xl backdrop-blur-md flex items-center gap-2 text-amber-200 animate-pulse text-[10.5px] xs:text-xs sm:text-sm font-bold pointer-events-auto touch-manipulation select-none",
                isLandscape ? "top-[15%] sm:top-[16%]" : "top-[18%] xs:top-[19%] sm:top-[20%]"
              )}
            >
              <ShieldAlert className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-amber-400 shrink-0" />
              <span>
                ⚠️ <span className="text-white font-extrabold">{state.autoAbortTimer.disconnectedPlayerName}</span> disconnected! Auto-abort in{' '}
                <span className="text-amber-300 font-mono font-black">{formatAbortTime(abortSeconds)}</span>
              </span>
            </div>
          )}

          {/* Minimal Floating HUD (Top Right: Voice Controls, Soundboard, Rules, Audio, Exit) */}
          <div className="absolute top-[max(0.25rem,env(safe-area-inset-top))] right-[max(0.25rem,env(safe-area-inset-right))] sm:top-2.5 sm:right-3 z-30 flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
            {/* Real-Time Voice Chat Controls */}
            <VoiceControls roomCode={roomCode} />

            {/* Real-Time Desi Soundboard Button */}
            <button
              onClick={() => setSoundboardOpen(true)}
              title="Real-Time Desi Meme Soundboard"
              className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-600/30 via-orange-600/30 to-amber-600/30 hover:from-amber-600/50 hover:to-orange-600/50 backdrop-blur-md border border-amber-500/50 text-[10px] sm:text-[11px] font-extrabold text-amber-300 hover:text-white shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline sm:ml-1">Sounds</span>
            </button>

            <button
              onClick={() => setRulesModalOpen(true)}
              title="View Rules"
              className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] font-bold text-zinc-300 hover:text-gold hover:border-gold/40 shadow transition-all active:scale-95"
            >
              <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold" />
              <span className="hidden md:inline md:ml-1">Rules</span>
            </button>
            <button
              onClick={handleToggleSound}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-zinc-300 hover:text-white shadow transition-all active:scale-95"
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
            </button>
            <button
              onClick={() => setShowExitModal(true)}
              title="Leave Room"
              className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-red-950/70 backdrop-blur-md border border-red-800/60 text-red-300 hover:text-white shadow transition-all active:scale-95"
            >
              <LogOut className="w-3 h-3 text-red-400" />
            </button>
          </div>

          {/* Center Bazaar with 4 Center Decks - Centered in Felt */}
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 z-10 pointer-events-auto transition-all",
              isLandscape
                ? totalPlayers === 2
                  ? "top-[44%] -translate-y-1/2 scale-[0.84] sm:scale-95"
                  : "top-[36%] -translate-y-1/2 scale-[0.88] sm:scale-100"
                : "top-[50%] -translate-y-1/2 scale-100"
            )}
          >
            <CenterBazaar
              centerDecks={centerDecks || []}
              baseRank={centerBaseRank}
              centerCard={centerCard}
              floatingCard={myFloatingCard}
              isMyTurn={isMyTurn}
              onPlaceCenter={onPlaceCenter}
              cardSize={'sm'}
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
                canPlaceRight = canPlayOnOtherRightDeck(myFloatingCard, player.rightDeckTop, me.isBazaarOpen).valid;
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

          {/* Spectator Bottom Status Card */}
          {state.isSpectator && (
            <div className="absolute bottom-[max(0.4rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-3 pointer-events-auto">
              <div
                className={cn(
                  "w-full rounded-2xl sm:rounded-3xl bg-black/90 border border-purple-500/50 shadow-2xl backdrop-blur-md flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300 touch-manipulation select-none",
                  isLandscape ? "p-2 sm:p-2.5 max-w-sm mx-auto" : "p-2.5 xs:p-3.5 sm:p-4"
                )}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 text-purple-300 font-black text-xs sm:text-sm uppercase tracking-wider">
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 animate-pulse" />
                  <span>Spectator Mode Active</span>
                </div>
                <p
                  className={cn(
                    "text-zinc-300 font-medium leading-tight",
                    isLandscape ? "text-[9.5px] sm:text-[10.5px] mt-0.5" : "text-[11px] xs:text-xs sm:text-sm mt-1"
                  )}
                >
                  Watching Dukki Bazaar live. You will automatically take a seat when the next round starts!
                </p>
                <div
                  className={cn(
                    "text-amber-400 font-semibold flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 px-2.5 sm:px-3 py-0.5 rounded-full",
                    isLandscape ? "mt-1 text-[8.5px] sm:text-[9.5px]" : "mt-1.5 text-[9.5px] xs:text-[10.5px]"
                  )}
                >
                  <span>🎙️ Voice chat and Desi soundboard are fully active!</span>
                </div>
              </div>
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

      {/* Real-Time Card Traveling Flight Animation Overlay */}
      <CardFlightOverlay />

      {/* Interactive Desi Throwables Flying Overlay */}
      <ThrowablesOverlay />

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
