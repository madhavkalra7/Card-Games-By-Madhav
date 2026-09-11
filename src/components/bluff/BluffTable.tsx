'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GameStateClientView, PlayerClientView, Rank } from '@/lib/types';
import { FanHand } from './FanHand';
import { BluffPlayerSeat } from './BluffPlayerSeat';
import { ChallengeRevealModal } from './ChallengeRevealModal';
import { ThrowablesOverlay } from '../table/ThrowablesOverlay';
import { ExitConfirmModal } from '../modal/ExitConfirmModal';
import { VoiceControls } from '../voice/VoiceControls';
import { PlayingCard } from '../card/PlayingCard';
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
  ShieldAlert,
  Flame,
  Clock,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ALL_RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface BluffTableProps {
  state: GameStateClientView;
  onPlayCards: (cardIds: string[], declaredRank: Rank) => void;
  onChallenge: () => void;
  onPass: () => void;
}

export const BluffTable: React.FC<BluffTableProps> = ({
  state,
  onPlayCards,
  onChallenge,
  onPass,
}) => {
  const {
    roomCode,
    players,
    myPlayerId,
    currentTurnPlayerId,
    turnTimeRemaining,
    bluffState,
  } = state;

  const { setRulesModalOpen, setSoundboardOpen, showToast, leaveRoom } = useGameStore();
  const { setInviteModalOpen } = useFriendsStore();
  const router = useRouter();
  const { isLandscape, isMobile } = useViewportOrientation();

  // Local card selection state
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [selectedRank, setSelectedRank] = useState<Rank>('A');
  const [isSorted, setIsSorted] = useState(false);

  // HUD & Modals state
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [showExitModal, setShowExitModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(true);

  const me = players.find((p) => p.id === myPlayerId);
  const isMyTurn = currentTurnPlayerId === myPlayerId;
  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);

  // Player's hand
  const rawCards = bluffState?.myHand || [];

  // Sort cards option (Rank order 2 to A)
  const cards = useMemo(() => {
    if (!isSorted) return rawCards;
    const rankOrder: Record<Rank, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14,
    };
    return [...rawCards].sort((a, b) => (rankOrder[a.rank] || 0) - (rankOrder[b.rank] || 0));
  }, [rawCards, isSorted]);

  // Table Discard Stack count
  const pileCount = bluffState?.centerPileCount ?? 0;
  const declaredRank = bluffState?.currentDeclaredRank ?? null;
  const cycleLeaderId = bluffState?.cycleLeaderId;
  const isCycleFresh = !declaredRank;
  const lastPlayedPlayer = players.find((p) => p.id === bluffState?.latestPlayerId);

  // Reorder players relative to current user (self is always index 0 at bottom)
  const myIndex = players.findIndex((p) => p.id === myPlayerId);
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

  // Seat positioning for 2-5 players
  const getSeatPositionClass = (idx: number, count: number): string => {
    if (idx === 0) return 'bottom-1 left-1/2 -translate-x-1/2';

    // 2-Player
    if (count === 2) {
      return isLandscape
        ? 'top-1 sm:top-2 left-1/2 -translate-x-1/2 scale-90 sm:scale-100'
        : 'top-12 sm:top-14 left-1/2 -translate-x-1/2';
    }

    // 3-Player
    if (count === 3) {
      if (isLandscape) {
        if (idx === 1) return 'top-1/2 -translate-y-1/2 left-2 sm:left-6';
        if (idx === 2) return 'top-1/2 -translate-y-1/2 right-2 sm:right-6';
      } else {
        if (idx === 1) return 'top-12 sm:top-14 left-2 sm:left-6';
        if (idx === 2) return 'top-12 sm:top-14 right-2 sm:right-6';
      }
    }

    // 4-Player
    if (count === 4) {
      if (isLandscape) {
        if (idx === 1) return 'top-1/2 -translate-y-1/2 left-2 sm:left-6';
        if (idx === 2) return 'top-1 sm:top-2 left-1/2 -translate-x-1/2';
        if (idx === 3) return 'top-1/2 -translate-y-1/2 right-2 sm:right-6';
      } else {
        if (idx === 1) return 'top-[26%] -translate-y-1/2 left-1 sm:left-3';
        if (idx === 2) return 'top-12 sm:top-14 left-1/2 -translate-x-1/2';
        if (idx === 3) return 'top-[26%] -translate-y-1/2 right-1 sm:right-3';
      }
    }

    // 5-Player
    if (count >= 5) {
      if (isLandscape) {
        if (idx === 1) return 'top-[24%] -translate-y-1/2 left-2 sm:left-5';
        if (idx === 2) return 'top-[68%] -translate-y-1/2 left-2 sm:left-5';
        if (idx === 3) return 'top-[24%] -translate-y-1/2 right-2 sm:right-5';
        if (idx === 4) return 'top-[68%] -translate-y-1/2 right-2 sm:right-5';
      } else {
        if (idx === 1) return 'top-[28%] -translate-y-1/2 left-0.5 sm:left-2';
        if (idx === 2) return 'top-12 sm:top-13 left-[28%] -translate-x-1/2';
        if (idx === 3) return 'top-12 sm:top-13 right-[28%] translate-x-1/2';
        if (idx === 4) return 'top-[28%] -translate-y-1/2 right-0.5 sm:right-2';
      }
    }

    return 'top-12 left-1/2 -translate-x-1/2';
  };

  // Card selection handlers
  const handleToggleCard = (cardId: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
        // If fresh cycle, smart-default selectedRank to rank of newly selected card
        if (isCycleFresh) {
          const card = rawCards.find((c) => c.id === cardId);
          if (card) setSelectedRank(card.rank);
        }
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedCardIds(new Set());
  };

  // Actions
  const handlePlayCards = () => {
    if (!isMyTurn || selectedCardIds.size === 0) return;
    const rankToPlay = declaredRank || selectedRank;
    onPlayCards(Array.from(selectedCardIds), rankToPlay);
    setSelectedCardIds(new Set());
  };

  const handleCallShow = () => {
    if (!isMyTurn) return;
    onChallenge();
  };

  const handlePass = () => {
    if (!isMyTurn) return;
    onPass();
    setSelectedCardIds(new Set());
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

  // Can the player call Show right now?
  const canShow = isMyTurn && !!bluffState?.canChallenge;

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] flex items-center justify-center p-0.5 sm:p-1.5 md:p-2 select-none overflow-hidden bg-black">
      {/* Outer Walnut Wood Rail Framing */}
      <div className="relative w-full h-full rounded-[10px] sm:rounded-[24px] md:rounded-[40px] walnut-rail-border p-0.5 sm:p-1 md:p-2 flex items-center justify-center bg-[#24160d] overflow-hidden">
        {/* Physical Felt Table Inner Area */}
        <div className="relative w-full h-full rounded-[8px] sm:rounded-[18px] md:rounded-[32px] poker-felt-bg shadow-poker-felt border border-emerald-500/25 flex flex-col items-center justify-between overflow-hidden">
          {/* Top Left HUD: Room Code & Invite */}
          <div className="absolute top-1 sm:top-2.5 left-1 sm:left-3 z-30 flex items-center gap-1 sm:gap-2 pointer-events-auto">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-black/80 backdrop-blur-md px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-gold/40 shadow-lg">
              <span className="text-[8px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-wider hidden xs:inline">
                BLUFF
              </span>
              <span className="font-mono font-black text-[11px] sm:text-sm text-gold tracking-wider">
                {roomCode}
              </span>
              <button
                onClick={handleCopy}
                title="Copy Room Code"
                className="p-0.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <button
              onClick={() => setInviteModalOpen(true)}
              title="Direct Invite Friends"
              className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-auto sm:px-2.5 sm:py-1 rounded-full bg-black/80 hover:bg-gold/20 backdrop-blur-md border border-gold/50 text-gold text-[9px] sm:text-[11px] font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-3 h-3" />
              <span className="hidden sm:inline sm:ml-1">Invite</span>
            </button>
          </div>

          {/* Top Right HUD: Voice Controls, Soundboard, Rules, Audio, Exit */}
          <div className="absolute top-1 sm:top-2.5 right-1 sm:right-3 z-30 flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
            <VoiceControls roomCode={roomCode} />

            <button
              onClick={() => setSoundboardOpen(true)}
              title="Real-Time Desi Meme Soundboard"
              className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-600/30 via-orange-600/30 to-amber-600/30 hover:from-amber-600/50 hover:to-orange-600/50 backdrop-blur-md border border-amber-500/50 text-[10px] sm:text-[11px] font-extrabold text-amber-300 hover:text-white shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline sm:ml-1">Sounds</span>
            </button>

            <button
              onClick={() => setRulesModalOpen(true)}
              title="View Rules"
              className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] font-bold text-zinc-300 hover:text-gold hover:border-gold/40 shadow transition-all active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-gold" />
              <span className="hidden md:inline md:ml-1">Rules</span>
            </button>

            <button
              onClick={handleToggleSound}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-zinc-300 hover:text-white shadow transition-all active:scale-95 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
            </button>

            <button
              onClick={() => setShowExitModal(true)}
              title="Leave Room"
              className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-red-950/70 backdrop-blur-md border border-red-800/60 text-red-300 hover:text-white shadow transition-all active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3 h-3 text-red-400" />
            </button>
          </div>

          {/* Opponent Seats Positioned Around Table */}
          {reorderedPlayers.map(({ player, positionIndex }) => {
            if (positionIndex === 0) return null; // Self is rendered at bottom
            const posClass = getSeatPositionClass(positionIndex, totalPlayers);
            const isTurn = player.id === currentTurnPlayerId;
            const isLeader = player.id === cycleLeaderId;
            const hasPassed = bluffState?.passedPlayerIds?.includes(player.id) ?? false;
            const count = player.cardsCount ?? 0;

            return (
              <BluffPlayerSeat
                key={player.id}
                player={player}
                isCurrentTurn={isTurn}
                isSelf={false}
                isLeader={isLeader}
                hasPassed={hasPassed}
                cardsCount={count}
                positionClass={posClass}
                turnTimeRemaining={turnTimeRemaining}
              />
            );
          })}

          {/* ================= CENTER TABLE FELT AREA ================= */}
          <div className="relative flex-1 w-full flex flex-col items-center justify-center z-10 pointer-events-auto mt-6 sm:mt-8">
            {/* Cycle Claim / Status Announcement Banner */}
            <div className="mb-2 sm:mb-4 flex flex-col items-center">
              {declaredRank ? (
                <div className="flex flex-col items-center bg-black/85 backdrop-blur-md px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl border-2 border-gold/70 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-black uppercase text-amber-400 tracking-wider">
                      Current Claim:
                    </span>
                    <span className="text-sm sm:text-lg font-black text-white font-serif tracking-wide">
                      {bluffState?.currentClaimCount} × Rank &apos;{declaredRank}&apos;
                    </span>
                  </div>
                  {lastPlayedPlayer && (
                    <span className="text-[9px] sm:text-[11px] text-zinc-300 mt-0.5">
                      Claimed by <strong className="text-gold font-bold">{lastPlayedPlayer.name}</strong>
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-gold/50 text-gold text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fresh Cycle • Leader Chooses Rank & Cards</span>
                </div>
              )}

              {/* Turn Tracker Pill */}
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] sm:text-xs font-bold">
                {isMyTurn ? (
                  <span className="px-3 py-0.5 rounded-full bg-amber-400 text-black font-black uppercase tracking-wider shadow-gold-glow animate-pulse">
                    ⭐ Your Turn ({turnTimeRemaining}s)
                  </span>
                ) : (
                  <span className="px-3 py-0.5 rounded-full bg-black/60 text-zinc-300 border border-white/10 font-medium">
                    Turn: <strong className="text-white">{currentTurnPlayer?.name}</strong> ({turnTimeRemaining}s)
                  </span>
                )}
              </div>
            </div>

            {/* 3D Discard Pile (Table Stack) */}
            <div className="relative flex items-center justify-center my-1 sm:my-2">
              <div className="relative w-20 h-28 sm:w-24 sm:h-32 flex items-center justify-center">
                {pileCount > 0 ? (
                  <>
                    {/* Visual cards stacked with slight rotations for authentic depth */}
                    {Array.from({ length: Math.min(5, pileCount) }).map((_, i) => {
                      const rot = (i - 2) * 5;
                      const offX = (i - 2) * 3;
                      const offY = -i * 2;
                      return (
                        <div
                          key={i}
                          className="absolute pointer-events-none transition-transform"
                          style={{
                            transform: `translateX(${offX}px) translateY(${offY}px) rotate(${rot}deg)`,
                            zIndex: i,
                          }}
                        >
                          <PlayingCard faceDown size={isMobile ? 'sm' : 'md'} className="shadow-2xl" />
                        </div>
                      );
                    })}

                    {/* Table Stack Counter Badge */}
                    <div className="absolute z-20 -bottom-2.5 px-3 py-1 rounded-full bg-black/90 backdrop-blur-md border-2 border-gold text-gold font-mono font-black text-xs sm:text-sm shadow-xl flex items-center gap-1 whitespace-nowrap">
                      <span>🃏</span>
                      <span>{pileCount} on Table</span>
                    </div>
                  </>
                ) : (
                  /* Empty Felt Ring Placeholder */
                  <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl border-2 border-dashed border-emerald-400/40 bg-black/20 flex flex-col items-center justify-center text-center p-2">
                    <span className="text-2xl opacity-40">🂠</span>
                    <span className="text-[9px] text-emerald-300/60 font-bold uppercase mt-1">
                      Table Empty
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= BOTTOM AREA: ACTION BAR & FAN HAND ================= */}
          <div className="relative w-full flex flex-col items-center z-30 pointer-events-auto pb-1">
            {/* Rank Selector (Only shown if Fresh Cycle & It's My Turn) */}
            {isMyTurn && isCycleFresh && (
              <div className="w-full max-w-xl px-2 mb-2 flex flex-col items-center animate-in slide-in-from-bottom-2 duration-200">
                <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300 mb-1 flex items-center gap-1">
                  <span>Select Rank to Claim (Truth or Bluff!):</span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1 px-2 scrollbar-none bg-black/70 rounded-2xl border border-white/10 backdrop-blur-md">
                  {ALL_RANKS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRank(r)}
                      className={cn(
                        'px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer shrink-0',
                        selectedRank === r
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black scale-110 shadow-gold-glow'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Action Buttons */}
            {isMyTurn ? (
              <div className="flex items-center gap-2 sm:gap-3 mb-2 animate-in fade-in zoom-in-95 duration-200">
                {/* 1. SHOW (CALL BLUFF) BUTTON */}
                {canShow && (
                  <button
                    type="button"
                    onClick={handleCallShow}
                    className="flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-red-950/50 active:scale-95 transition-all cursor-pointer animate-pulse"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Show! (Call Bluff)</span>
                  </button>
                )}

                {/* 2. PLAY / ADD CARDS BUTTON */}
                <button
                  type="button"
                  onClick={handlePlayCards}
                  disabled={selectedCardIds.size === 0}
                  className={cn(
                    'flex items-center gap-1.5 px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-gold-glow cursor-pointer',
                    selectedCardIds.size > 0
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black active:scale-95'
                      : 'bg-zinc-800/80 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                  )}
                >
                  <Flame className="w-4 h-4" />
                  <span>
                    {isCycleFresh
                      ? `Lead ${selectedCardIds.size || 0} × '${selectedRank}'`
                      : `Play ${selectedCardIds.size || 0} × '${declaredRank}'`}
                  </span>
                </button>

                {/* 3. PASS BUTTON (Only if cycle already started) */}
                {!isCycleFresh && (
                  <button
                    type="button"
                    onClick={handlePass}
                    className="flex items-center gap-1 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Pass</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="mb-2 px-4 py-1 rounded-full bg-black/60 border border-white/10 text-[11px] text-zinc-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gold animate-spin" />
                <span>
                  Waiting for <strong className="text-white">{currentTurnPlayer?.name}</strong> to make a move...
                </span>
              </div>
            )}

            {/* Authentic Fan Hand of Cards */}
            <FanHand
              cards={cards}
              selectedCardIds={selectedCardIds}
              onToggleCard={handleToggleCard}
              onClearSelection={handleClearSelection}
              onSortCards={() => setIsSorted(!isSorted)}
              isMyTurn={isMyTurn}
            />
          </div>
        </div>
      </div>

      {/* Challenge Showdown Verdict Modal */}
      <ChallengeRevealModal
        result={bluffState?.lastChallengeResult || null}
        onClose={() => {
          // Handled inside modal or server update
        }}
      />

      {/* Throwables Animation Overlay */}
      <ThrowablesOverlay />

      {/* Leave Room Modal */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onConfirm={() => {
          leaveRoom();
          router.push('/');
        }}
        onClose={() => setShowExitModal(false)}
      />
    </div>
  );
};
