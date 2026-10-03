'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { GameStateClientView, Card, DoctorConfig, PlayerClientView } from '@/lib/types';
import { useGameStore } from '@/store/gameStore';
import { useFriendsStore } from '@/store/friendsStore';
import { useRouter } from 'next/navigation';
import { sounds } from '@/lib/sound';
import { getDoctorCardValue, calculateDoctorHandSum, isDoctorJoker } from '@/lib/doctorUtils';
import { PlayingCard } from '@/components/card/PlayingCard';
import { DoctorSettingsModal } from './DoctorSettingsModal';
import { DoctorScoreboardModal } from './DoctorScoreboardModal';
import { useViewportOrientation } from '@/hooks/useViewportOrientation';
import { cn } from '@/lib/utils';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  BookOpen,
  LogOut,
  UserPlus,
  MessageSquare,
  Sparkles,
  Flame,
  Trophy,
  Layers,
  Settings,
  HelpCircle,
  Crown,
  AlertTriangle,
  Play,
} from 'lucide-react';

interface DoctorTableProps {
  state: GameStateClientView;
}

export const DoctorTable: React.FC<DoctorTableProps> = ({ state }) => {
  const {
    roomCode,
    players,
    myPlayerId,
    currentTurnPlayerId,
    doctorState,
    turnTimeRemaining,
    status,
  } = state;

  const {
    setRulesModalOpen,
    setSoundboardOpen,
    showToast,
    leaveRoom,
    setTableChatOpen,
    unreadTableChatCount,
    updateDoctorConfig,
    doctorDrawCard,
    doctorPickDiscard,
    doctorDiscardCards,
    doctorCallShow,
    doctorNextRound,
  } = useGameStore();

  const { setInviteModalOpen } = useFriendsStore();
  const router = useRouter();
  const { isLandscape, isMobile, viewportHeight } = useViewportOrientation();
  const isLandscapeMobile = isLandscape && (viewportHeight <= 520 || isMobile);

  // Modals & local controls
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [isActionPending, setIsActionPending] = useState(false);

  // Active client player
  const myPlayer = useMemo(() => players.find((p) => p.id === myPlayerId), [players, myPlayerId]);
  const isHost = !!myPlayer?.isHost;
  const isMyTurn = currentTurnPlayerId === myPlayerId;
  const isSpectator = state.isSpectator || !myPlayer;

  // Doctor state shortcuts
  const config = doctorState?.config || { cardsPerPlayer: 8, showLimit: 10, totalRounds: 3 };
  const currentRound = doctorState?.currentRound || 1;
  const totalRounds = doctorState?.totalRounds || config.totalRounds;
  const myHand = doctorState?.myHand || [];
  const myHandSum = doctorState?.myHandSum ?? calculateDoctorHandSum(myHand);
  const turnPhase = doctorState?.turnPhase || 'DRAW';
  const lastDiscardGroup = doctorState?.lastDiscardGroup || [];
  const canCallShow = !!doctorState?.canCallShow;
  const isRoundOver = !!doctorState?.isRoundOver;
  const roundResult = doctorState?.roundResult || null;
  const scoresHistory = doctorState?.scoresHistory || [];
  const cumulativeScores = doctorState?.cumulativeScores || {};
  const drawDeckCount = doctorState?.drawDeckCount || 0;
  const discardPileCount = doctorState?.discardPileCount || 0;

  // Clear selections when turn changes or round resets
  useEffect(() => {
    setSelectedCardIds([]);
  }, [currentTurnPlayerId, isRoundOver]);

  // Copy room invite link / code
  const handleCopyCode = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      showToast('Room Code copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    showToast(muted ? 'Audio Muted' : 'Audio Unmuted', 'info');
  };

  const handleLeaveConfirm = () => {
    leaveRoom();
    router.push('/');
  };

  // Sort hand cards by rank ascending or pairs
  const sortedHand = useMemo(() => {
    const list = [...myHand];
    return list.sort((a, b) => {
      const vA = getDoctorCardValue(a);
      const vB = getDoctorCardValue(b);
      if (vA !== vB) return vA - vB;
      return a.suit.localeCompare(b.suit);
    });
  }, [myHand]);

  // Toggle card selection with smart pairing constraint:
  // Must be single card OR cards of the EXACT SAME RANK
  const handleCardClick = (card: Card) => {
    if (!isMyTurn || turnPhase !== 'DISCARD' || isRoundOver) {
      // Just toggle view
      setSelectedCardIds((prev) => (prev.includes(card.id) ? prev.filter((id) => id !== card.id) : [...prev, card.id]));
      sounds.playCardSlide();
      return;
    }

    sounds.playCardFlip();

    if (selectedCardIds.includes(card.id)) {
      // Deselect
      setSelectedCardIds((prev) => prev.filter((id) => id !== card.id));
      return;
    }

    if (selectedCardIds.length === 0) {
      setSelectedCardIds([card.id]);
      return;
    }

    // Check rank of currently selected cards
    const firstSelected = myHand.find((c) => c.id === selectedCardIds[0]);
    if (!firstSelected) {
      setSelectedCardIds([card.id]);
      return;
    }

    const isFirstJoker = isDoctorJoker(firstSelected);
    const isCardJoker = isDoctorJoker(card);
    const isSameRank = isFirstJoker
      ? isCardJoker
      : (!isCardJoker && card.rank === firstSelected.rank);

    if (isSameRank) {
      // Add to pair/triple/quad
      setSelectedCardIds((prev) => [...prev, card.id]);
    } else {
      // Different rank selected: switch selection to the new card
      setSelectedCardIds([card.id]);
    }
  };

  // Selected cards sum and count
  const selectedCards = useMemo(() => {
    return myHand.filter((c) => selectedCardIds.includes(c.id));
  }, [myHand, selectedCardIds]);

  const selectedCardsSum = useMemo(() => {
    return calculateDoctorHandSum(selectedCards);
  }, [selectedCards]);

  // Action: Draw card from center deck
  const handleDrawCard = async () => {
    if (!isMyTurn || turnPhase !== 'DRAW' || isActionPending) return;
    setIsActionPending(true);
    await doctorDrawCard();
    setIsActionPending(false);
  };

  // Action: Pick last discard group
  const handlePickDiscard = async () => {
    if (!isMyTurn || turnPhase !== 'DRAW' || isActionPending || lastDiscardGroup.length === 0) return;
    setIsActionPending(true);
    await doctorPickDiscard();
    setIsActionPending(false);
  };

  // Action: Discard selected cards
  const handleDiscard = async () => {
    if (!isMyTurn || turnPhase !== 'DISCARD' || selectedCardIds.length === 0 || isActionPending) return;
    setIsActionPending(true);
    const res = await doctorDiscardCards(selectedCardIds);
    setIsActionPending(false);
    if (res.success) {
      setSelectedCardIds([]);
    }
  };

  // Action: Call SHOW
  const handleCallShow = async () => {
    if (!canCallShow || isActionPending) return;
    sounds.playShowChime();
    setIsActionPending(true);
    await doctorCallShow();
    setIsActionPending(false);
  };

  // Quick auto-select highest pair or highest card to discard
  const handleAutoSelectHighest = () => {
    if (myHand.length === 0) return;
    sounds.playCardSlide();

    // Look for pairs/triples/quads (including Joker pairs/triples)
    const rankGroups: Record<string, Card[]> = {};
    for (const c of myHand) {
      const key = isDoctorJoker(c) ? 'JKR' : c.rank;
      rankGroups[key] = rankGroups[key] || [];
      rankGroups[key].push(c);
    }

    let bestGroup: Card[] = [];
    let maxThrowSum = -1;

    for (const cards of Object.values(rankGroups)) {
      const sum = calculateDoctorHandSum(cards);
      if (sum > maxThrowSum) {
        maxThrowSum = sum;
        bestGroup = cards;
      }
    }

    if (bestGroup.length > 0) {
      setSelectedCardIds(bestGroup.map((c) => c.id));
    }
  };

  // Arrange players relative to active user (User at index 0, others rotate clockwise)
  const arrangedPlayers = useMemo(() => {
    if (players.length === 0) return [];
    if (isSpectator) return players;

    const myIndex = players.findIndex((p) => p.id === myPlayerId);
    if (myIndex === -1) return players;

    return [...players.slice(myIndex), ...players.slice(0, myIndex)];
  }, [players, myPlayerId, isSpectator]);

  // Opponents seated around the table
  const opponents = useMemo<PlayerClientView[]>(() => arrangedPlayers.slice(1), [arrangedPlayers]);

  const getOpponentPositionClass = (idx: number, totalOpponents: number): string => {
    if (totalOpponents === 1) {
      return 'top-1.5 left-1/2 -translate-x-1/2';
    }
    if (totalOpponents === 2) {
      if (idx === 0) return 'top-1/2 -translate-y-1/2 left-1.5 sm:left-3';
      return 'top-1/2 -translate-y-1/2 right-1.5 sm:right-3';
    }
    if (totalOpponents === 3) {
      if (idx === 0) return 'top-1/2 -translate-y-1/2 left-1.5 sm:left-3';
      if (idx === 1) return 'top-1.5 left-1/2 -translate-x-1/2';
      return 'top-1/2 -translate-y-1/2 right-1.5 sm:right-3';
    }
    if (totalOpponents === 4) {
      if (idx === 0) return 'top-1/2 -translate-y-1/2 left-1.5 sm:left-3';
      if (idx === 1) return 'top-1.5 left-[35%] -translate-x-1/2';
      if (idx === 2) return 'top-1.5 right-[35%] translate-x-1/2';
      return 'top-1/2 -translate-y-1/2 right-1.5 sm:right-3';
    }
    if (totalOpponents === 5) {
      if (idx === 0) return 'top-1/2 -translate-y-1/2 left-1.5 sm:left-3';
      if (idx === 1) return 'top-1.5 left-[28%] -translate-x-1/2';
      if (idx === 2) return 'top-1.5 left-1/2 -translate-x-1/2';
      if (idx === 3) return 'top-1.5 right-[28%] translate-x-1/2';
      return 'top-1/2 -translate-y-1/2 right-1.5 sm:right-3';
    }
    // 6 or more opponents: perimeter flank distribution
    if (idx === 0) return 'top-[30%] -translate-y-1/2 left-1.5 sm:left-3';
    if (idx === 1) return 'top-[70%] -translate-y-1/2 left-1.5 sm:left-3';
    if (idx === 2) return 'top-1.5 left-[35%] -translate-x-1/2';
    if (idx === 3) return 'top-1.5 right-[35%] translate-x-1/2';
    if (idx === 4) return 'top-[30%] -translate-y-1/2 right-1.5 sm:right-3';
    return 'top-[70%] -translate-y-1/2 right-1.5 sm:right-3';
  };

  const renderOpponentSeat = (opponent: PlayerClientView, isAbsolute = false, posClass = '') => {
    const isOpponentTurn = currentTurnPlayerId === opponent.id;
    const oppTotalScore = cumulativeScores[opponent.id] ?? 0;
    const cardCount = opponent.hiddenCount || opponent.cardsCount || 0;

    return (
      <div
        key={opponent.id}
        className={cn(
          'flex flex-col items-center rounded-2xl transition-all border shadow-lg shrink-0',
          isLandscapeMobile ? 'p-1' : 'p-1.5 sm:p-2',
          isOpponentTurn
            ? 'bg-amber-500/20 border-amber-400 shadow-gold-glow scale-105 ring-2 ring-amber-400/50'
            : 'bg-black/60 border-white/10',
          isAbsolute && `absolute z-20 ${posClass}`
        )}
      >
        <div className="relative">
          <div
            className={cn(
              'rounded-full border-2 border-white/30 flex items-center justify-center font-black text-white shadow',
              isLandscapeMobile ? 'w-7 h-7 sm:w-8 sm:h-8 text-xs' : 'w-9 h-9 sm:w-11 sm:h-11 text-xs sm:text-sm'
            )}
            style={{ backgroundColor: opponent.avatarColor || '#3b82f6' }}
          >
            {opponent.name.charAt(0).toUpperCase()}
          </div>
          {isOpponentTurn && (
            <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full text-[7px] sm:text-[8px] font-black uppercase bg-amber-400 text-black shadow">
              Turn
            </span>
          )}
        </div>

        <span className={cn(
          'font-bold text-white mt-0.5 truncate',
          isLandscapeMobile ? 'max-w-[60px] text-[9px]' : 'max-w-[75px] sm:max-w-[100px] text-xs'
        )}>
          {opponent.name}
        </span>

        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[8px] sm:text-[9px] font-mono font-bold text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded">
            🂠 {cardCount}
          </span>
          <span className="text-[8px] sm:text-[9px] font-mono text-zinc-400">
            {oppTotalScore}P
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-[#070b09] select-none overflow-hidden font-sans pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)]">
      
      {/* Dynamic Background Casino Table Felt Texture with Gold Border */}
      <div className="absolute inset-0 bg-radial-vignette opacity-90 pointer-events-none" />
      <div className="absolute inset-2 sm:inset-4 rounded-3xl border-4 border-[#1c2c22] pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />

      {/* TOP BAR: Room Code, Round Indicator, Limits & Controls */}
      <div className={cn(
        'relative z-30 flex items-center justify-between border-b border-white/10 bg-black/60 backdrop-blur-md',
        isLandscapeMobile ? 'px-2 sm:px-4 py-1' : 'px-3 sm:px-6 py-2 sm:py-3'
      )}>
        
        {/* Left: Room & Host Info */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono font-bold text-[11px] sm:text-xs uppercase transition-all active:scale-95 cursor-pointer"
            title="Click to copy Room Code"
          >
            <span>#{roomCode}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
          </button>

          {/* Tournament Round Indicator */}
          <div className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-transparent border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-black uppercase">
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400 shrink-0" />
            <span>
              R{currentRound}/{totalRounds}
            </span>
          </div>
        </div>

        {/* Center: Hand Show Limit Badge & Turn Status */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-red-950/60 border border-red-500/50 text-red-300 text-[10px] sm:text-xs font-black shadow-sm">
            <Flame className="w-3 h-3 text-red-400 animate-pulse" />
            <span>Show: ≤{config.showLimit} PTS</span>
          </div>

          {turnTimeRemaining > 0 && (
            <div
              className={cn(
                'px-2 py-0.2 sm:py-0.5 rounded-full font-mono text-[10px] sm:text-xs font-black border',
                turnTimeRemaining <= 5
                  ? 'bg-red-600/30 text-red-300 border-red-500 animate-ping'
                  : 'bg-zinc-800/80 text-zinc-300 border-zinc-700'
              )}
            >
              ⏱ {turnTimeRemaining}s
            </div>
          )}
        </div>

        {/* Right: Sound, Settings, Chat, Rules, Exit */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Settings button */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Doctor Match Settings"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Soundboard Button */}
          <button
            type="button"
            onClick={() => setSoundboardOpen(true)}
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 cursor-pointer"
            title="Open Soundboard"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
          </button>

          {/* In-Game Table Chat Button */}
          <button
            type="button"
            onClick={() => setTableChatOpen(true)}
            className="relative p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 cursor-pointer"
            title="Table Chat"
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
            {unreadTableChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white font-bold text-[8px] flex items-center justify-center animate-pulse shadow">
                {unreadTableChatCount}
              </span>
            )}
          </button>

          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
          </button>

          {/* Rules Button */}
          <button
            type="button"
            onClick={() => setRulesModalOpen(true)}
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 cursor-pointer"
            title="Doctor Rules"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </button>

          {/* Leave Button */}
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 transition-all active:scale-95 cursor-pointer"
            title="Leave Match"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Action Banner / Message Bar */}
      {doctorState?.latestActionMessage && (
        <div className="relative z-20 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent py-0.5 sm:py-1 px-4 text-center border-b border-amber-500/20">
          <p className="text-[10px] sm:text-xs font-bold text-amber-200 truncate">
            {doctorState.latestActionMessage}
          </p>
        </div>
      )}

      {/* MAIN TABLE FELT AREA */}
      <div className="relative flex-1 flex flex-col justify-between p-1 sm:p-3 overflow-hidden">
        
        {/* OPPONENTS AREA */}
        {isLandscape ? (
          // Landscape: Perimeter Seats
          opponents.map((opponent: PlayerClientView, idx: number) =>
            renderOpponentSeat(opponent, true, getOpponentPositionClass(idx, opponents.length))
          )
        ) : (
          // Portrait: Top row strip
          <div className="flex items-center justify-around gap-1 sm:gap-2 pt-0.5 pb-1 z-10 w-full max-w-xl mx-auto overflow-x-auto no-scrollbar px-1">
            {opponents.map((opponent: PlayerClientView) => renderOpponentSeat(opponent))}
          </div>
        )}

        {/* CENTER TABLE AREA: Draw Deck + Discard Area */}
        <div className={cn(
          'relative flex-1 flex items-center justify-center my-auto z-10',
          isLandscapeMobile ? 'gap-3 sm:gap-6 py-0.5' : 'gap-4 sm:gap-10 py-2'
        )}>
          
          {/* 1. DRAW DECK (Face-Down Center Stock Pile) */}
          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <div className="relative group">
              <PlayingCard
                faceDown
                size={isLandscapeMobile ? 'xs' : 'sm'}
                className={cn(
                  'shadow-2xl transition-all',
                  isMyTurn && turnPhase === 'DRAW' && 'ring-4 ring-amber-400 shadow-gold-glow animate-pulse cursor-pointer'
                )}
                onClick={handleDrawCard}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className={cn(
                  "font-black font-mono text-amber-300 filter drop-shadow",
                  isLandscapeMobile ? "text-xs" : "text-sm sm:text-base"
                )}>
                  {drawDeckCount}
                </span>
                <span className="text-[7px] sm:text-[8px] font-bold uppercase text-white/80">Cards</span>
              </div>
            </div>

            {/* Draw Button */}
            {isMyTurn && turnPhase === 'DRAW' ? (
              <button
                type="button"
                onClick={handleDrawCard}
                disabled={isActionPending}
                className="px-2.5 py-0.5 sm:py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-gold-glow active:scale-95 transition-all cursor-pointer animate-bounce"
              >
                + Draw
              </button>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400 font-bold uppercase">
                Deck
              </span>
            )}
          </div>

          {/* CENTER VS / INFO DIVIDER */}
          <div className="flex flex-col items-center justify-center gap-0.5 px-1">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-amber-300 font-mono">
              VS
            </div>
            <span className="text-[8px] font-bold text-zinc-500 uppercase">
              Table
            </span>
          </div>

          {/* 2. DISCARD TABLE PILE (Open Throw Area) */}
          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <div className="relative group">
              {lastDiscardGroup.length > 0 ? (
                <div className="relative flex items-center">
                  {lastDiscardGroup.map((card, idx) => (
                    <div
                      key={`center-discard-${card.id}-${idx}`}
                      style={{
                        transform: `translateX(${idx * (isLandscapeMobile ? 10 : 14)}px) rotate(${(idx - 1) * 5}deg)`,
                        zIndex: idx + 1,
                      }}
                      className="transition-all"
                    >
                      <PlayingCard
                        card={card}
                        size={isLandscapeMobile ? 'xs' : 'sm'}
                        showIndexBadge={true}
                        className={cn(
                          'shadow-2xl transition-all',
                          isMyTurn && turnPhase === 'DRAW' && 'ring-2 ring-emerald-400 cursor-pointer'
                        )}
                        onClick={handlePickDiscard}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={cn(
                  "rounded-xl border-2 border-dashed border-white/20 bg-black/40 flex flex-col items-center justify-center text-center p-1 text-zinc-500 text-xs",
                  isLandscapeMobile ? "w-[54px] h-[76px]" : "w-[66px] h-[92px]"
                )}>
                  <span className="text-[10px]">Empty</span>
                </div>
              )}
            </div>

            {/* Pick Discard Button */}
            {isMyTurn && turnPhase === 'DRAW' && lastDiscardGroup.length > 0 ? (
              <button
                type="button"
                onClick={handlePickDiscard}
                disabled={isActionPending}
                className="px-2.5 py-0.5 sm:py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
                title={`Pick all ${lastDiscardGroup.length} card(s) from previous discard`}
              >
                Pick ({lastDiscardGroup.length})
              </button>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400 font-bold uppercase truncate max-w-[100px]">
                {lastDiscardGroup.length > 0 ? `Discard (${discardPileCount})` : 'Discard'}
              </span>
            )}
          </div>

        </div>

        {/* BOTTOM: USER'S HAND & CONTROLS */}
        <div className="relative z-20 flex flex-col items-center gap-1 sm:gap-2 pb-0.5 sm:pb-2 w-full">
          
          {/* HAND SUM METER & SHOW CALL BUTTON */}
          <div className={cn(
            'flex items-center justify-between w-full max-w-4xl px-2',
            isLandscapeMobile ? 'py-0.5' : 'py-1'
          )}>
            
            {/* Hand Sum Meter */}
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 rounded-xl sm:rounded-2xl border transition-all shadow-md',
                myHandSum <= config.showLimit
                  ? 'bg-emerald-950/85 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50 animate-pulse'
                  : 'bg-black/75 border-white/15 text-white'
              )}
            >
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                  Your Sum
                </span>
                <span className="font-mono font-black text-xs sm:text-sm leading-none">
                  {myHandSum} PTS {myHandSum <= config.showLimit && '🔥'}
                </span>
              </div>
            </div>

            {/* Middle Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Show Button (Active when hand sum <= showLimit) */}
              {canCallShow && (
                <button
                  type="button"
                  onClick={handleCallShow}
                  disabled={isActionPending}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-red-500 hover:from-yellow-300 hover:to-red-400 text-black font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(234,179,8,0.7)] active:scale-95 transition-all cursor-pointer animate-bounce flex items-center gap-1"
                >
                  <Flame className="w-3.5 h-3.5 fill-black stroke-black" />
                  <span>SHOW!</span>
                </button>
              )}

              {/* Discard Button (Active in DISCARD phase with selection) */}
              {isMyTurn && turnPhase === 'DISCARD' && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <button
                    type="button"
                    onClick={handleAutoSelectHighest}
                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all"
                    title="Quick select highest card or pair"
                  >
                    High
                  </button>

                  <button
                    type="button"
                    onClick={handleDiscard}
                    disabled={selectedCardIds.length === 0 || isActionPending}
                    className={cn(
                      'px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-1',
                      selectedCardIds.length > 0
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-gold-glow active:scale-95 cursor-pointer'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                    )}
                  >
                    <span>
                      Discard {selectedCardIds.length > 0 ? `(${selectedCardIds.length})` : ''}
                    </span>
                    {selectedCardsSum > 0 && (
                      <span className="font-mono font-bold text-[9px] bg-black/20 px-1 rounded">
                        -{selectedCardsSum}P
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Turn Phase Helper Text */}
            <div className="flex flex-col items-end text-right">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase text-zinc-400">
                Phase
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-300">
                {isMyTurn ? (turnPhase === 'DRAW' ? '1. Draw' : '2. Discard') : 'Waiting'}
              </span>
            </div>
          </div>

          {/* PLAYING CARDS RACK (Horizontal Fan with Touch Scrolling) */}
          <div className="relative w-full max-w-5xl overflow-x-auto pb-1 px-1 sm:px-2 flex items-center justify-start xs:justify-center -space-x-2 xs:-space-x-1 sm:space-x-1 touch-pan-x no-scrollbar">
            {sortedHand.map((card, idx) => {
              const isSelected = selectedCardIds.includes(card.id);
              const cardVal = getDoctorCardValue(card);
              const isJoker = isDoctorJoker(card);

              return (
                <div
                  key={`hand-card-${card.id}-${idx}`}
                  onClick={() => handleCardClick(card)}
                  className={cn(
                    'relative transition-all duration-200 cursor-pointer transform shrink-0',
                    isSelected
                      ? '-translate-y-3.5 sm:-translate-y-5 scale-105 z-20'
                      : 'hover:-translate-y-1.5 z-10'
                  )}
                >
                  <PlayingCard
                    card={card}
                    size={isLandscapeMobile ? (myHand.length > 8 ? 'xxs' : 'xs') : (myHand.length > 8 ? 'xs' : 'sm')}
                    showIndexBadge={true}
                    className={cn(
                      'shadow-xl transition-all',
                      isSelected && 'ring-3 sm:ring-4 ring-amber-400 shadow-gold-glow',
                      isJoker && 'ring-2 ring-red-500'
                    )}
                  />

                  {/* Card Value Badge */}
                  <div
                    className={cn(
                      'absolute -top-1.5 left-1/2 -translate-x-1/2 px-1 py-0.1 rounded-full font-mono font-black text-[8px] sm:text-[9px] shadow-sm pointer-events-none',
                      isJoker
                        ? 'bg-red-600 text-white'
                        : isSelected
                        ? 'bg-amber-400 text-black'
                        : 'bg-black/85 text-zinc-200 border border-white/10'
                    )}
                  >
                    {cardVal}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* DOCTOR SETTINGS MODAL (Custom Game Input Window) */}
      <DoctorSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onSave={(newCfg) => updateDoctorConfig(newCfg)}
        isHost={isHost}
      />

      {/* DOCTOR ROUND SCOREBOARD MODAL (Crazy Animated Whiteboard & Thick Marker) */}
      <DoctorScoreboardModal
        isOpen={isRoundOver && !!roundResult}
        roundResult={roundResult}
        scoresHistory={scoresHistory}
        cumulativeScores={cumulativeScores}
        players={players}
        myPlayerId={myPlayerId}
        isHost={isHost}
        currentRound={currentRound}
        totalRounds={totalRounds}
        onNextRound={() => doctorNextRound()}
        onClose={() => {}}
      />

      {/* EXIT MATCH CONFIRMATION MODAL */}
      {showExitModal && (
        <div
          onClick={() => setShowExitModal(false)}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm p-6 rounded-3xl bg-zinc-950 border border-red-500/40 text-center space-y-4 shadow-2xl"
          >
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-black uppercase tracking-wider text-white">
              Leave Doctor Match?
            </h3>
            <p className="text-xs text-zinc-400">
              Leaving an ongoing match will forfeit your score and penalize your rank.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider hover:bg-zinc-700 transition-colors"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={handleLeaveConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
              >
                Leave Match
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
