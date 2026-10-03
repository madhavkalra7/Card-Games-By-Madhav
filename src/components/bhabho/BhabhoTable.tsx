'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameStateClientView, PlayerClientView, Card } from '@/lib/types';
import { BhabhoFanHand } from './BhabhoFanHand';
import { BhabhoPlayerSeat } from './BhabhoPlayerSeat';
import { BhabhoCenterTrick } from './BhabhoCenterTrick';
import { BluffThrowablesOverlay } from '../bluff/BluffThrowablesOverlay';
import { ThrowablePicker } from '../table/ThrowablePicker';
import { ExitConfirmModal } from '../modal/ExitConfirmModal';
import { VoiceControls } from '../voice/VoiceControls';
import { sounds } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';
import { useFriendsStore } from '@/store/friendsStore';
import { useViewportOrientation } from '@/hooks/useViewportOrientation';
import {
  BookOpen,
  Check,
  Copy,
  LogOut,
  Sparkles,
  UserPlus,
  Volume2,
  VolumeX,
  Clock,
  Flame,
  ShieldAlert,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BhabhoTableProps {
  state: GameStateClientView;
  onPlayCard: (cardId: string) => Promise<{ success: boolean; error?: string }>;
}

export const BhabhoTable: React.FC<BhabhoTableProps> = ({
  state,
  onPlayCard,
}) => {
  const {
    roomCode,
    players,
    myPlayerId,
    currentTurnPlayerId,
    bhabhoState,
    turnTimeRemaining,
  } = state;

  const { setRulesModalOpen, setSoundboardOpen, showToast, leaveRoom, throwItem } = useGameStore();
  const { setInviteModalOpen } = useFriendsStore();
  const router = useRouter();
  const { isLandscape, isMobile, viewportHeight } = useViewportOrientation();
  const isLandscapeMobile = isLandscape && (viewportHeight <= 520 || isMobile);

  // Active target for throwable picker
  const [throwableTarget, setThrowableTarget] = useState<{ id: string; name: string } | null>(null);

  // Selected card in player's hand
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'suit' | 'rank'>('suit');

  // HUD & Modals state
  const [copied, setCopied] = useState(false);
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

  // Current client player
  const myPlayer = useMemo(() => players.find((p) => p.id === myPlayerId), [players, myPlayerId]);
  const isMyTurn = currentTurnPlayerId === myPlayerId;
  const isSpectator = state.isSpectator || !myPlayer;

  // Private cards of the current player
  const rawCards: Card[] = bhabhoState?.myHand || [];
  const canPlayCardIds: string[] = bhabhoState?.canPlayCardIds || [];

  const displayCards = useMemo(() => {
    const list = [...rawCards];
    const RANK_VAL: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
      '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
    };
    const SUIT_VAL: Record<string, number> = { 'S': 1, 'H': 2, 'C': 3, 'D': 4 };

    if (sortMode === 'suit') {
      return list.sort((a, b) => {
        const suitDiff = (SUIT_VAL[a.suit] || 0) - (SUIT_VAL[b.suit] || 0);
        if (suitDiff !== 0) return suitDiff;
        return (RANK_VAL[a.rank] || 0) - (RANK_VAL[b.rank] || 0);
      });
    } else {
      return list.sort((a, b) => {
        const rankDiff = (RANK_VAL[b.rank] || 0) - (RANK_VAL[a.rank] || 0);
        if (rankDiff !== 0) return rankDiff;
        return (SUIT_VAL[a.suit] || 0) - (SUIT_VAL[b.suit] || 0);
      });
    }
  }, [rawCards, sortMode]);

  const handleIllegalCardTap = (card: Card) => {
    if (!isMyTurn) return;
    if (bhabhoState?.roundNumber === 1 && !bhabhoState?.leadSuit) {
      showToast('Opening trick: You must play the Ace of Spades (♠ A)!', 'error');
      return;
    }
    if (bhabhoState?.leadSuit) {
      const suitName =
        bhabhoState.leadSuit === 'S'
          ? 'Spades (♠)'
          : bhabhoState.leadSuit === 'H'
          ? 'Hearts (♥)'
          : bhabhoState.leadSuit === 'C'
          ? 'Clubs (♣)'
          : 'Diamonds (♦)';
      showToast(`Lead suit is ${suitName}! You have cards of this suit and must follow suit.`, 'error');
    }
  };

  // Auto-select first legal card if only 1 legal card (e.g. Ace of Spades on trick 1)
  useEffect(() => {
    if (isMyTurn && canPlayCardIds.length === 1 && !selectedCardId) {
      setSelectedCardId(canPlayCardIds[0]);
    }
  }, [isMyTurn, canPlayCardIds, selectedCardId]);

  // Reset selected card when turn ends or hand changes
  useEffect(() => {
    if (!isMyTurn) {
      setSelectedCardId(null);
    }
  }, [isMyTurn]);

  // Arrange players relative to active user (User always at bottom, others rotate clockwise)
  const arrangedPlayers = useMemo(() => {
    if (players.length === 0) return [];
    if (isSpectator) return players;

    const myIndex = players.findIndex((p) => p.id === myPlayerId);
    if (myIndex === -1) return players;

    return [...players.slice(myIndex), ...players.slice(0, myIndex)];
  }, [players, myPlayerId, isSpectator]);

  // Responsive Seat Position Classes
  // Responsive Seat Position Classes
  const getSeatPositionClass = (idx: number, totalPlayers: number): string => {
    const count = totalPlayers;

    if (isSpectator) {
      if (count === 2) {
        return idx === 0
          ? (isLandscape ? 'top-1/2 -translate-y-1/2 left-2 sm:left-8' : 'top-[35%] -translate-y-1/2 left-2 xs:left-4 sm:left-8')
          : (isLandscape ? 'top-1/2 -translate-y-1/2 right-2 sm:right-8' : 'top-[35%] -translate-y-1/2 right-2 xs:right-4 sm:right-8');
      }
      if (count === 3) {
        if (idx === 0) return isLandscape ? 'top-1/2 -translate-y-1/2 left-2 sm:left-4' : 'top-[35%] -translate-y-1/2 left-2 sm:left-4';
        if (idx === 1) return isLandscape ? 'top-7 sm:top-8 left-1/2 -translate-x-1/2' : 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-16 left-1/2 -translate-x-1/2';
        if (idx === 2) return isLandscape ? 'top-1/2 -translate-y-1/2 right-2 sm:right-4' : 'top-[35%] -translate-y-1/2 right-2 sm:right-4';
      }
      if (count === 4) {
        if (idx === 0) return 'top-1/2 -translate-y-1/2 left-2 sm:left-4';
        if (idx === 1) return isLandscape ? 'top-7 sm:top-8 left-[30%] -translate-x-1/2' : 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] left-[28%] -translate-x-1/2';
        if (idx === 2) return isLandscape ? 'top-7 sm:top-8 right-[30%] translate-x-1/2' : 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] right-[28%] translate-x-1/2';
        if (idx === 3) return 'top-1/2 -translate-y-1/2 right-2 sm:right-4';
      }
      if (count >= 5) {
        if (idx === 0) return 'top-[68%] -translate-y-1/2 left-1.5 sm:left-3';
        if (idx === 1) return 'top-[22%] -translate-y-1/2 left-1.5 sm:left-3';
        if (idx === 2) return isLandscape ? 'top-7 sm:top-8 left-1/2 -translate-x-1/2' : 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] left-1/2 -translate-x-1/2';
        if (idx === 3) return 'top-[22%] -translate-y-1/2 right-1.5 sm:right-3';
        if (idx === 4) return 'top-[68%] -translate-y-1/2 right-1.5 sm:right-3';
      }
    }

    if (idx === 0) return 'bottom-1 left-1/2 -translate-x-1/2';

    // 2-Player (Self + 1 Opponent at top center)
    if (count === 2) {
      return isLandscape
        ? 'top-7 sm:top-8 left-1/2 -translate-x-1/2'
        : 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-16 left-1/2 -translate-x-1/2';
    }

    // 3-Player (Self + 2 Opponents)
    if (count === 3) {
      if (isLandscape) {
        if (idx === 1) return 'top-1/2 -translate-y-1/2 left-2 sm:left-4 md:left-6';
        if (idx === 2) return 'top-1/2 -translate-y-1/2 right-2 sm:right-4 md:right-6';
      } else {
        if (idx === 1) return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-16 left-2 xs:left-4 sm:left-8';
        if (idx === 2) return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-16 right-2 xs:right-4 sm:right-8';
      }
    }

    // 4-Player (Self + 3 Opponents) - Oval layout
    if (count === 4) {
      if (isLandscape) {
        if (idx === 1) return 'top-1/2 -translate-y-1/2 left-2 sm:left-4';
        if (idx === 2) return 'top-7 sm:top-8 left-1/2 -translate-x-1/2';
        if (idx === 3) return 'top-1/2 -translate-y-1/2 right-2 sm:right-4';
      } else {
        if (idx === 1) return 'top-[30%] -translate-y-1/2 left-1 xs:left-2 sm:left-4';
        if (idx === 2) return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:top-16 left-1/2 -translate-x-1/2';
        if (idx === 3) return 'top-[30%] -translate-y-1/2 right-1 xs:right-2 sm:right-4';
      }
    }

    // 5-Player (Self + 4 Opponents)
    if (count >= 5) {
      if (isLandscape) {
        if (idx === 1) return 'top-[24%] -translate-y-1/2 left-1.5 sm:left-3';
        if (idx === 2) return 'top-[66%] -translate-y-1/2 left-1.5 sm:left-3';
        if (idx === 3) return 'top-[24%] -translate-y-1/2 right-1.5 sm:right-3';
        if (idx === 4) return 'top-[66%] -translate-y-1/2 right-1.5 sm:right-3';
      } else {
        if (idx === 1) return 'top-[30%] -translate-y-1/2 left-0.5 xs:left-1 sm:left-2';
        if (idx === 2) return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] left-[28%] -translate-x-1/2';
        if (idx === 3) return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] right-[28%] translate-x-1/2';
        if (idx === 4) return 'top-[30%] -translate-y-1/2 right-0.5 xs:right-1 sm:right-2';
      }
    }

    return 'top-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] left-1/2 -translate-x-1/2';
  };

  const handleSelectCard = (cardId: string) => {
    setSelectedCardId(cardId);
  };

  const handlePlaySelectedCard = async () => {
    if (!isMyTurn || !selectedCardId) return;
    const res = await onPlayCard(selectedCardId);
    if (res.success) {
      setSelectedCardId(null);
    }
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

  const activeTrickStarter = players.find(p => p.id === bhabhoState?.currentTrickStarterId);

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] flex items-center justify-center p-0.5 sm:p-1.5 md:p-2 select-none overflow-hidden bg-black">
      {/* Outer Walnut Wood Rail Framing */}
      <div className="relative w-full h-full rounded-[10px] sm:rounded-[24px] md:rounded-[40px] walnut-rail-border p-0.5 sm:p-1 md:p-2 flex items-center justify-center bg-[#24160d] overflow-hidden">
        
        {/* Physical Felt Table Inner Area */}
        <div className="relative w-full h-full rounded-[8px] sm:rounded-[18px] md:rounded-[32px] poker-felt-bg shadow-poker-felt border border-emerald-500/25 overflow-hidden flex flex-col justify-between">
          
          {/* Top Unified Responsive HUD Bar */}
          <div className="absolute top-[max(0.25rem,env(safe-area-inset-top))] left-[max(0.35rem,env(safe-area-inset-left))] right-[max(0.35rem,env(safe-area-inset-right))] sm:top-2 sm:left-3 sm:right-3 z-30 flex items-center justify-between gap-1 pointer-events-none">
            
            {/* Left Section: Room Code & Invite */}
            <div className="flex items-center gap-1 shrink-0 pointer-events-auto">
              <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 xs:px-2.5 py-0.5 sm:py-1 rounded-full border border-gold/40 shadow-lg">
                <span className="text-[8px] xs:text-[9px] sm:text-xs text-gold/80 font-bold uppercase hidden xs:inline">Room</span>
                <span className="font-mono font-black text-[10px] xs:text-xs sm:text-sm text-gold tracking-wider">{roomCode}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors touch-manipulation active:scale-90 cursor-pointer"
                  title="Copy Room Code"
                >
                  {copied ? <Check className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 xs:w-3 xs:h-3" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInviteModalOpen(true)}
                className="flex items-center gap-1 bg-emerald-600/90 hover:bg-emerald-500 text-white font-extrabold text-[10px] xs:text-[11px] sm:text-xs px-2 xs:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md border border-emerald-400/50 transition-all active:scale-95 touch-manipulation cursor-pointer"
                title="Invite Friends"
              >
                <UserPlus className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                <span className="hidden sm:inline">Invite</span>
              </button>
            </div>

            {/* Center Section: Game Title Pill & Soundboard */}
            <div className="flex items-center gap-1 shrink-0 pointer-events-auto">
              <div className="hidden lg:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] sm:text-xs font-black shadow-md">
                <span>♠ BHABHO</span>
                <span className="text-zinc-400 text-[9px]">(GETAWAY)</span>
              </div>

              <VoiceControls roomCode={roomCode} />

              <button
                type="button"
                onClick={() => setSoundboardOpen(true)}
                className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-[10px] xs:text-[11px] sm:text-xs px-2 xs:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md border border-gold/60 transition-all hover:scale-105 active:scale-95 touch-manipulation cursor-pointer"
                title="Desi Meme Soundboard"
              >
                <span>📢</span>
                <span className="hidden sm:inline">Soundboard</span>
              </button>
            </div>

            {/* Right Section: Rules, Mute, Leave Table */}
            <div className="flex items-center gap-1 shrink-0 pointer-events-auto">
              <button
                type="button"
                onClick={() => setRulesModalOpen(true)}
                className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 xs:px-2 py-0.5 sm:py-1 rounded-full border border-white/20 text-zinc-300 hover:text-white text-[10px] xs:text-[11px] font-bold shadow-md transition-all active:scale-95 touch-manipulation cursor-pointer"
                title="Game Rules"
              >
                <BookOpen className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-gold" />
                <span className="hidden sm:inline">Rules</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSound}
                className="p-1 xs:p-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-zinc-300 hover:text-white shadow-md transition-all active:scale-95 touch-manipulation cursor-pointer"
                title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              >
                {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setShowExitModal(true)}
                className="p-1 xs:p-1.5 rounded-full bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-white shadow-md transition-all active:scale-95 touch-manipulation cursor-pointer"
                title="Leave Table"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Auto-Abort Disconnect Banner */}
          {state.autoAbortTimer && abortSeconds !== null && (
            <div className={cn(
              "absolute left-1/2 -translate-x-1/2 z-40 bg-red-900/90 border border-red-500 text-white px-3 py-1 rounded-full text-[10px] xs:text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md animate-pulse pointer-events-none",
              isLandscapeMobile ? "top-8 sm:top-9" : "top-11 xs:top-12 sm:top-14"
            )}>
              <Clock className="w-3 h-3 text-red-300 shrink-0" />
              <span>
                {state.autoAbortTimer.disconnectedPlayerName} disconnected. Match auto-aborts in {formatAbortTime(abortSeconds)}.
              </span>
            </div>
          )}

          {/* Main Felt Play Area: Opponents + Center Trick */}
          <div className={cn(
            "relative w-full flex-1 flex items-center justify-center min-h-0 pb-1 transition-all",
            isLandscapeMobile ? "pt-7 sm:pt-8" : "pt-10 xs:pt-12 sm:pt-14"
          )}>
            
            {/* Center Trick Arena */}
            <BhabhoCenterTrick
              currentTrick={bhabhoState?.currentTrick || []}
              leadSuit={bhabhoState?.leadSuit || null}
              highestLeadCard={bhabhoState?.highestLeadCard || null}
              lastTrickResult={bhabhoState?.lastTrickResult || null}
              wastePileCount={bhabhoState?.wastePileCount || 0}
              isFirstTrickOfGame={!bhabhoState?.leadSuit && (bhabhoState?.roundNumber === 1 || bhabhoState?.roundNumber === undefined)}
              roundNumber={bhabhoState?.roundNumber || 1}
              starterName={activeTrickStarter?.name}
              isResolvingTrick={bhabhoState?.isResolvingTrick}
              isLandscape={isLandscapeMobile}
            />

            {/* Opponents & Players Seats */}
            {arrangedPlayers.map((player, idx) => {
              const isSelf = player.id === myPlayerId;
              if (isSelf && !isSpectator) return null; // Rendered via FanHand at bottom

              const isCurrentTurn = currentTurnPlayerId === player.id;
              const isTrickStarter = bhabhoState?.currentTrickStarterId === player.id;
              const isEscaped = bhabhoState?.escapedPlayerIds?.includes(player.id) || player.isFinished;

              return (
                <BhabhoPlayerSeat
                  key={player.id}
                  player={player}
                  isCurrentTurn={isCurrentTurn}
                  isSelf={isSelf}
                  isTrickStarter={isTrickStarter}
                  isEscaped={isEscaped}
                  escapeRank={player.rank}
                  cardsCount={player.cardsCount ?? player.hiddenCount ?? 0}
                  positionClass={getSeatPositionClass(idx, arrangedPlayers.length)}
                  turnTimeRemaining={turnTimeRemaining}
                  onOpenThrowablePicker={(id, name) => setThrowableTarget({ id, name })}
                />
              );
            })}
          </div>

          {/* Action announcement message ticker */}
          {bhabhoState?.latestActionMessage && (
            <div className="w-full flex justify-center px-4 mb-0.5 z-20 pointer-events-none">
              <div className="px-3 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-zinc-300 text-[10px] xs:text-[11px] font-medium shadow truncate max-w-[90vw]">
                {bhabhoState.latestActionMessage}
              </div>
            </div>
          )}

          {/* Bottom Area: Fan Hand for active player or Spectator Banner */}
          <div className="relative w-full z-20 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
            {isSpectator ? (
              <div className="w-full flex justify-center py-2 select-none pointer-events-none">
                <div className="px-4 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-gold/40 text-gold text-xs font-black flex items-center gap-2 shadow-lg">
                  <Eye className="w-4 h-4" />
                  <span>SPECTATOR MODE: Watching live Bhabho match</span>
                </div>
              </div>
            ) : (
              <BhabhoFanHand
                cards={displayCards}
                selectedCardId={selectedCardId}
                canPlayCardIds={canPlayCardIds}
                isMyTurn={isMyTurn}
                leadSuit={bhabhoState?.leadSuit || null}
                isFirstTrickOfGame={!bhabhoState?.leadSuit && bhabhoState?.roundNumber === 1}
                onSelectCard={handleSelectCard}
                onPlaySelectedCard={handlePlaySelectedCard}
                onSortCards={() => setSortMode((s) => (s === 'suit' ? 'rank' : 'suit'))}
                sortMode={sortMode}
                onIllegalCardTap={handleIllegalCardTap}
                isFinished={myPlayer?.isFinished}
              />
            )}
          </div>

          {/* Floating Throwables Overlay */}
          <BluffThrowablesOverlay />

          {/* Throwable Picker Modal (when clicking an opponent's avatar) */}
          {throwableTarget && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto"
              onClick={() => setThrowableTarget(null)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <ThrowablePicker
                  isOpen={true}
                  targetPlayerId={throwableTarget.id}
                  targetPlayerName={throwableTarget.name}
                  onClose={() => setThrowableTarget(null)}
                  onSelect={(type) => {
                    throwItem(throwableTarget.id, type);
                    setThrowableTarget(null);
                  }}
                  align="center"
                />
              </div>
            </div>
          )}

          {/* Exit Confirmation Modal */}
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
      </div>
    </div>
  );
};
