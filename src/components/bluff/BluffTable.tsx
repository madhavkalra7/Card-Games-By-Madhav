'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GameStateClientView, PlayerClientView, Rank } from '@/lib/types';
import { FanHand } from './FanHand';
import { BluffPlayerSeat } from './BluffPlayerSeat';
import { ChallengeRevealModal } from './ChallengeRevealModal';
import { BluffThrowablesOverlay } from './BluffThrowablesOverlay';
import { ThrowablePicker } from '../table/ThrowablePicker';
import { ExitConfirmModal } from '../modal/ExitConfirmModal';
import { VoiceControls } from '../voice/VoiceControls';
import { PlayingCard } from '../card/PlayingCard';
import { sounds } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';
import { useFriendsStore } from '@/store/friendsStore';
import { useViewportOrientation } from '@/hooks/useViewportOrientation';
import {
  announceBluffPlay,
  initBluffAnnouncer,
  getStoredVoiceLanguage,
  setStoredVoiceLanguage,
  VoiceLanguage,
} from '@/lib/bluffAnnouncer';
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
    bluffState,
  } = state;

  const { setRulesModalOpen, setSoundboardOpen, showToast, leaveRoom, throwItem } = useGameStore();
  const { setInviteModalOpen } = useFriendsStore();
  const router = useRouter();
  const { isLandscape, isMobile } = useViewportOrientation();

  // Active target for throwable picker (managed at table level to avoid container transform issues)
  const [throwableTarget, setThrowableTarget] = useState<{ id: string; name: string } | null>(null);

  // Local card selection state
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [selectedRank, setSelectedRank] = useState<Rank>('A');
  const [isSorted, setIsSorted] = useState(false);

  // Challenge modal dismissal tracking so Continue button closes it instantly
  const [dismissedChallengeId, setDismissedChallengeId] = useState<string | null>(null);

  // HUD & Modals state
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [showExitModal, setShowExitModal] = useState(false);

  // Card voice announcer language preference (English vs Hindi with Indian Female Accent)
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>('EN');

  useEffect(() => {
    setVoiceLanguage(getStoredVoiceLanguage());
    initBluffAnnouncer();
  }, []);

  const handleSetVoiceLanguage = (lang: VoiceLanguage) => {
    setStoredVoiceLanguage(lang);
    setVoiceLanguage(lang);
    showToast(lang === 'HI' ? 'हिंदी आवाज़ चालू (Hindi Voice)' : 'English Voice Enabled', 'info');
  };

  // Track latest card plays to speak claim out loud
  const lastAnnouncedPlaySeq = useRef<number | undefined>(bluffState?.playSeq);
  const prevPileCount = useRef<number>(bluffState?.centerPileCount || 0);

  useEffect(() => {
    if (!bluffState) return;

    const playSeq = bluffState.playSeq;
    const currentPileCount = bluffState.centerPileCount || 0;
    const claimCount = bluffState.currentClaimCount;
    const rank = bluffState.currentDeclaredRank;

    let shouldAnnounce = false;

    if (typeof playSeq === 'number' && playSeq > 0) {
      if (playSeq !== lastAnnouncedPlaySeq.current) {
        lastAnnouncedPlaySeq.current = playSeq;
        shouldAnnounce = true;
      }
    } else if (currentPileCount > prevPileCount.current && claimCount > 0) {
      shouldAnnounce = true;
    }

    prevPileCount.current = currentPileCount;

    if (shouldAnnounce && rank && claimCount > 0 && !isMuted) {
      announceBluffPlay(claimCount, rank, voiceLanguage);
    }
  }, [bluffState?.playSeq, bluffState?.centerPileCount, bluffState?.currentClaimCount, bluffState?.currentDeclaredRank, voiceLanguage, isMuted]);

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

  // Active challenge result (null if user already dismissed it via Continue or Close)
  const currentChallenge = bluffState?.lastChallengeResult;
  const activeChallenge = currentChallenge && currentChallenge.id !== dismissedChallengeId
    ? currentChallenge
    : null;

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

  // Seat positioning tailored dynamically for Desktop and Mobile orientations
  const getSeatPositionClass = (idx: number, count: number): string => {
    if (idx === 0) return 'bottom-1 left-1/2 -translate-x-1/2';

    // 2-Player (Self + 1 Opponent at top center with safe margin from walnut rail)
    if (count === 2) {
      return isLandscape
        ? 'top-3.5 sm:top-5 md:top-6 left-1/2 -translate-x-1/2'
        : 'top-12 xs:top-14 sm:top-16 left-1/2 -translate-x-1/2';
    }

    // 3-Player (Self + 2 Opponents)
    if (count === 3) {
      if (isLandscape) {
        if (idx === 1) return 'top-1/2 -translate-y-1/2 left-3 sm:left-8 md:left-12';
        if (idx === 2) return 'top-1/2 -translate-y-1/2 right-3 sm:right-8 md:right-12';
      } else {
        if (idx === 1) return 'top-12 xs:top-14 sm:top-16 left-2 xs:left-4 sm:left-8';
        if (idx === 2) return 'top-12 xs:top-14 sm:top-16 right-2 xs:right-4 sm:right-8';
      }
    }

    // 4-Player (Self + 3 Opponents) - Oval layout
    if (count === 4) {
      if (isLandscape) {
        if (idx === 1) return 'top-1/2 -translate-y-1/2 left-3 sm:left-8';
        if (idx === 2) return 'top-3.5 sm:top-5 left-1/2 -translate-x-1/2';
        if (idx === 3) return 'top-1/2 -translate-y-1/2 right-3 sm:right-8';
      } else {
        if (idx === 1) return 'top-[28%] -translate-y-1/2 left-1 xs:left-2 sm:left-4';
        if (idx === 2) return 'top-12 xs:top-14 sm:top-16 left-1/2 -translate-x-1/2';
        if (idx === 3) return 'top-[28%] -translate-y-1/2 right-1 xs:right-2 sm:right-4';
      }
    }

    // 5-Player (Self + 4 Opponents)
    if (count >= 5) {
      if (isLandscape) {
        if (idx === 1) return 'top-[22%] -translate-y-1/2 left-2 sm:left-6';
        if (idx === 2) return 'top-[68%] -translate-y-1/2 left-2 sm:left-6';
        if (idx === 3) return 'top-[22%] -translate-y-1/2 right-2 sm:right-6';
        if (idx === 4) return 'top-[68%] -translate-y-1/2 right-2 sm:right-6';
      } else {
        if (idx === 1) return 'top-[28%] -translate-y-1/2 left-0.5 xs:left-1 sm:left-2';
        if (idx === 2) return 'top-12 xs:top-14 left-[28%] -translate-x-1/2';
        if (idx === 3) return 'top-12 xs:top-14 right-[28%] translate-x-1/2';
        if (idx === 4) return 'top-[28%] -translate-y-1/2 right-0.5 xs:right-1 sm:right-2';
      }
    }

    return 'top-12 xs:top-14 left-1/2 -translate-x-1/2';
  };

  // Card selection handlers (Enforces maximum 4 cards limit per play)
  const handleToggleCard = (cardId: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        if (next.size >= 4) {
          showToast('Ek baar mein maximum 4 cards hi khel sakte hain! (Max 4 cards)', 'info');
          return prev;
        }
        next.add(cardId);
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
    if (selectedCardIds.size > 4) {
      showToast('Maximum 4 cards can be played at once!', 'error');
      return;
    }
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

  const canShow = isMyTurn && !!bluffState?.canChallenge;

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] flex items-center justify-center p-0.5 sm:p-1.5 md:p-2 select-none overflow-hidden bg-black">
      {/* Outer Walnut Wood Rail Framing */}
      <div className="relative w-full h-full rounded-[10px] sm:rounded-[24px] md:rounded-[40px] walnut-rail-border p-0.5 sm:p-1 md:p-2 flex items-center justify-center bg-[#24160d] overflow-hidden">
        
        {/* Physical Felt Table Inner Area */}
        <div className="relative w-full h-full rounded-[8px] sm:rounded-[18px] md:rounded-[32px] poker-felt-bg shadow-poker-felt border border-emerald-500/25 overflow-hidden">
          
          {/* Top Unified Responsive HUD Bar: Single flex container to guarantee ZERO overlapping on mobile */}
          <div className="absolute top-1 sm:top-2 left-1 right-1 sm:left-3 sm:right-3 z-30 flex items-center justify-between gap-1 pointer-events-none">
            
            {/* Left Section: Room Code & Invite */}
            <div className="flex items-center gap-1 shrink-0 pointer-events-auto">
              <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 xs:px-2.5 py-0.5 sm:py-1 rounded-full border border-gold/40 shadow-lg">
                <span className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-wider hidden xs:inline">
                  BLUFF
                </span>
                <span className="font-mono font-black text-[10px] xs:text-[11px] sm:text-sm text-gold tracking-wider">
                  {roomCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy Room Code"
                  className="p-0.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" /> : <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInviteModalOpen(true)}
                title="Direct Invite Friends"
                className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-auto sm:px-2.5 sm:py-1 rounded-full bg-black/80 hover:bg-gold/20 backdrop-blur-md border border-gold/50 text-gold text-[9px] sm:text-[11px] font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                <span className="hidden sm:inline sm:ml-1">Invite</span>
              </button>
            </div>

            {/* Right Section: Language Toggle, Voice Chat, Sounds, Rules, Audio, Exit */}
            <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 shrink-0 pointer-events-auto justify-end">
              {/* Voice Announcer Language Selector (English / Hindi Indian Accent) */}
              <div
                className="flex items-center bg-black/80 backdrop-blur-md rounded-full border border-gold/40 p-0.5 shadow-lg shrink-0"
                title="Card Announcer Language"
              >
                <button
                  type="button"
                  onClick={() => handleSetVoiceLanguage('EN')}
                  className={cn(
                    'px-1.5 xs:px-2 py-0.5 rounded-full text-[8.5px] xs:text-[9.5px] sm:text-[11px] font-black transition-all cursor-pointer',
                    voiceLanguage === 'EN'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-sm font-extrabold'
                      : 'text-zinc-400 hover:text-white'
                  )}
                  title="English Voice"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => handleSetVoiceLanguage('HI')}
                  className={cn(
                    'px-1.5 xs:px-2 py-0.5 rounded-full text-[8.5px] xs:text-[9.5px] sm:text-[11px] font-black transition-all cursor-pointer',
                    voiceLanguage === 'HI'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-sm font-extrabold'
                      : 'text-zinc-400 hover:text-white'
                  )}
                  title="हिंदी आवाज़"
                >
                  HI
                </button>
              </div>

              <VoiceControls roomCode={roomCode} />

              <button
                type="button"
                onClick={() => setSoundboardOpen(true)}
                title="Real-Time Desi Meme Soundboard"
                className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-600/30 via-orange-600/30 to-amber-600/30 hover:from-amber-600/50 hover:to-orange-600/50 backdrop-blur-md border border-amber-500/50 text-[10px] sm:text-[11px] font-extrabold text-amber-300 hover:text-white shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden md:inline md:ml-1">Sounds</span>
              </button>

              <button
                type="button"
                onClick={() => setRulesModalOpen(true)}
                title="View Rules"
                className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] font-bold text-zinc-300 hover:text-gold hover:border-gold/40 shadow transition-all active:scale-95 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                <span className="hidden md:inline md:ml-1">Rules</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSound}
                title={isMuted ? 'Unmute' : 'Mute'}
                className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-zinc-300 hover:text-white shadow transition-all active:scale-95 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setShowExitModal(true)}
                title="Leave Room"
                className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-red-950/70 backdrop-blur-md border border-red-800/60 text-red-300 hover:text-white shadow transition-all active:scale-95 cursor-pointer"
              >
                <LogOut className="w-3 h-3 text-red-400" />
              </button>
            </div>
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
                onOpenThrowablePicker={(playerId, playerName) => setThrowableTarget({ id: playerId, name: playerName })}
              />
            );
          })}

          {/* ================= TRUE CENTER TABLE FELT AREA ================= */}
          {/* Positioned at exact 38%-42% height of table felt, perfectly distanced from both top opponents and bottom cards */}
          <div className="absolute top-[36%] xs:top-[38%] sm:top-[40%] md:top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-auto transition-all max-w-[92vw]">
            
            {/* Cycle Claim / Status Announcement Banner */}
            <div className="mb-2 flex flex-col items-center">
              {declaredRank ? (
                <div className="flex flex-col items-center bg-black/85 backdrop-blur-md px-3.5 sm:px-6 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border-2 border-gold/70 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[9px] xs:text-[10px] sm:text-xs font-black uppercase text-amber-400 tracking-wider">
                      Current Claim:
                    </span>
                    <span className="text-xs xs:text-sm sm:text-lg font-black text-white font-serif tracking-wide">
                      {bluffState?.currentClaimCount} × Rank &apos;{declaredRank}&apos;
                    </span>
                  </div>
                  {lastPlayedPlayer && (
                    <span className="text-[8.5px] xs:text-[9.5px] sm:text-xs text-zinc-300 mt-0.5">
                      Claimed by <strong className="text-gold font-bold">{lastPlayedPlayer.name}</strong>
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-md px-3 sm:px-5 py-1 rounded-full border border-gold/50 text-gold text-[10px] xs:text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
                  <span>Fresh Cycle • Lead with any rank!</span>
                </div>
              )}

              {/* Turn Tracker Pill */}
              <div className="mt-1 flex items-center gap-1">
                {isMyTurn ? (
                  <span className="px-3 sm:px-4 py-0.5 rounded-full bg-amber-400 text-black text-[9px] xs:text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-gold-glow animate-pulse">
                    ⭐ Your Turn
                  </span>
                ) : (
                  <span className="px-2.5 sm:px-3.5 py-0.5 rounded-full bg-black/65 text-zinc-300 border border-white/10 text-[9px] xs:text-[10px] sm:text-xs font-medium">
                    Turn: <strong className="text-white">{currentTurnPlayer?.name}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* 3D Discard Pile (Table Stack) */}
            <div className="relative flex items-center justify-center my-0.5">
              <div className="relative w-18 h-24 xs:w-20 xs:h-28 sm:w-24 sm:h-32 flex items-center justify-center">
                {pileCount > 0 ? (
                  <>
                    {Array.from({ length: Math.min(6, pileCount) }).map((_, i) => {
                      const rot = (i - 2.5) * 6;
                      const offX = (i - 2.5) * 3;
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
                          <PlayingCard faceDown size={isMobile ? 'xs' : 'sm'} className="shadow-2xl" />
                        </div>
                      );
                    })}

                    {/* Table Stack Counter Badge */}
                    <div className="absolute z-20 -bottom-2.5 sm:-bottom-3 px-2.5 xs:px-3 py-0.5 sm:py-1 rounded-full bg-black/95 backdrop-blur-md border-1.5 sm:border-2 border-gold text-gold font-mono font-black text-[10px] xs:text-[11px] sm:text-sm shadow-2xl flex items-center gap-1 whitespace-nowrap">
                      <span>🃏</span>
                      <span>{pileCount} on Table</span>
                    </div>
                  </>
                ) : (
                  <div className="w-18 h-24 xs:w-20 xs:h-28 sm:w-24 sm:h-32 rounded-2xl border-1.5 sm:border-2 border-dashed border-emerald-400/35 bg-black/25 flex flex-col items-center justify-center text-center p-2">
                    <span className="text-xl sm:text-2xl opacity-40">🂠</span>
                    <span className="text-[8px] sm:text-[9px] text-emerald-300/70 font-bold uppercase mt-1">
                      Table Empty
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ================= BOTTOM AREA: ACTION CONTROLS & FAN HAND ================= */}
          {/* Firmly anchored at the bottom edge with clean hierarchy and zero card cutoff */}
          <div className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 z-20 w-full max-w-5xl px-2 flex flex-col items-center pointer-events-auto">
            
            {/* Rank Selector (Only shown if Fresh Cycle & It's My Turn) */}
            {isMyTurn && isCycleFresh && (
              <div className="mb-1.5 flex flex-col items-center animate-in slide-in-from-bottom-2 duration-200">
                <span className="text-[9px] xs:text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300 mb-0.5">
                  Select Claim Rank:
                </span>
                <div className="flex items-center gap-1 max-w-[92vw] overflow-x-auto py-1 px-2 no-scrollbar scrollbar-none bg-black/85 rounded-2xl border border-white/15 backdrop-blur-md shadow-lg">
                  {ALL_RANKS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRank(r)}
                      className={cn(
                        'w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center shrink-0 touch-manipulation',
                        selectedRank === r
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black scale-105 shadow-gold-glow'
                          : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-1.5 z-30">
              {isMyTurn ? (
                <>
                  {/* 1. SHOW (CALL BLUFF) BUTTON */}
                  {canShow && (
                    <button
                      type="button"
                      onClick={handleCallShow}
                      className="flex items-center gap-1 sm:gap-1.5 px-3 xs:px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-[11px] xs:text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-red-950/50 active:scale-95 transition-all cursor-pointer animate-pulse touch-manipulation"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Show! (Call Bluff)</span>
                    </button>
                  )}

                  {/* 2. PLAY / ADD CARDS BUTTON */}
                  <button
                    type="button"
                    onClick={handlePlayCards}
                    disabled={selectedCardIds.size === 0}
                    className={cn(
                      'flex items-center gap-1 sm:gap-1.5 px-4 xs:px-5 sm:px-7 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[11px] xs:text-xs sm:text-sm uppercase tracking-wider transition-all shadow-gold-glow cursor-pointer touch-manipulation',
                      selectedCardIds.size > 0
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black active:scale-95'
                        : 'bg-zinc-800/80 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                    )}
                  >
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>
                      {isCycleFresh
                        ? `Lead ${selectedCardIds.size || 0} × '${selectedRank}'`
                        : `Play ${selectedCardIds.size || 0} × '${declaredRank}'`}
                    </span>
                  </button>

                  {/* 3. PASS BUTTON */}
                  {!isCycleFresh && (
                    <button
                      type="button"
                      onClick={handlePass}
                      className="flex items-center gap-1 px-3 xs:px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-bold text-[11px] xs:text-xs sm:text-sm uppercase tracking-wider active:scale-95 transition-all cursor-pointer touch-manipulation"
                    >
                      <span>Pass</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <div className="px-3 sm:px-4 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-[10px] xs:text-xs text-zinc-300 flex items-center gap-2 shadow">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>
                    Waiting for <strong className="text-white">{currentTurnPlayer?.name}</strong> to make a move...
                  </span>
                </div>
              )}
            </div>

            {/* The Authentic Fan Hand of Cards */}
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

      {/* Challenge Showdown Verdict Modal with Instant Dismissal on Continue Button */}
      <ChallengeRevealModal
        result={activeChallenge}
        voiceLanguage={voiceLanguage}
        isMuted={isMuted}
        onClose={() => {
          if (currentChallenge?.id) {
            setDismissedChallengeId(currentChallenge.id);
          }
        }}
      />

      {/* Dedicated Bluff Throwables Animation Overlay */}
      <BluffThrowablesOverlay />

      {/* Top-Level Fullscreen Centered Throwable Picker (Zero clipping, zero parent transform issues) */}
      <ThrowablePicker
        targetPlayerId={throwableTarget?.id || ''}
        targetPlayerName={throwableTarget?.name || ''}
        isOpen={!!throwableTarget}
        onClose={() => setThrowableTarget(null)}
        onSelect={(type) => {
          if (throwableTarget) {
            throwItem(throwableTarget.id, type);
            setThrowableTarget(null);
          }
        }}
      />

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
