'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { Header } from '@/components/ui/Header';
import { PokerTable } from '@/components/table/PokerTable';
import { PenaltyModal } from '@/components/modal/PenaltyModal';
import { GameOverModal } from '@/components/modal/GameOverModal';
import { RulesModal } from '@/components/modal/RulesModal';
import { Toast } from '@/components/ui/Toast';
import { Copy, Crown, Play, ShieldAlert, Sparkles, UserMinus, Users, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const roomCode = resolvedParams.code.toUpperCase();
  const router = useRouter();

  const {
    gameState,
    myName,
    myAvatar,
    initSocketListeners,
    joinRoom,
    startGame,
    drawCard,
    placeCenter,
    placeRightDeck,
    requestPenalty,
    kickPlayer,
    playAgain,
    isPenaltyModalOpen,
    setPenaltyModalOpen,
    isRulesModalOpen,
    setRulesModalOpen,
  } = useGameStore();

  // Direct navigation join prompt state
  const [directName, setDirectName] = useState(myName || '');
  const [directAvatar, setDirectAvatar] = useState(myAvatar || '#2563eb');
  const [isJoining, setIsJoining] = useState(false);
  const [hasPromptedJoin, setHasPromptedJoin] = useState(false);

  useEffect(() => {
    initSocketListeners();
  }, [initSocketListeners]);

  // If user opened URL directly and has not joined the room state
  useEffect(() => {
    if (!gameState && !hasPromptedJoin) {
      if (myName) {
        // Auto-join if profile exists
        joinRoom(roomCode, myName, myAvatar);
      }
      setHasPromptedJoin(true);
    }
  }, [gameState, hasPromptedJoin, joinRoom, roomCode, myName, myAvatar]);

  const handleDirectJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directName.trim()) return;
    setIsJoining(true);
    await joinRoom(roomCode, directName.trim(), directAvatar);
    setIsJoining(false);
  };

  // Direct join prompt modal if state is empty
  if (!gameState) {
    return (
      <main className="min-h-screen bg-[#070d09] text-zinc-100 flex flex-col justify-between overflow-y-auto">
        <Header roomCode={roomCode} />
        <Toast />

        <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-zinc-950 border-2 border-gold/70 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl">
            <div className="text-center mb-4 sm:mb-6">
              <span className="text-[10px] sm:text-xs font-bold text-gold uppercase tracking-widest">
                Invited to Table
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white font-serif mt-0.5 sm:mt-1">
                Room {roomCode}
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1">
                Enter your details to take a seat at the table
              </p>
            </div>

            <form onSubmit={handleDirectJoin} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 sm:mb-2">
                  Your Player Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  placeholder="Enter name"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  className="w-full px-3.5 sm:px-4 py-2 sm:py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-gold text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 sm:mb-2">
                  Choose Avatar Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['#e11d48', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#ea580c', '#4f46e5'].map(
                    (color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setDirectAvatar(color)}
                        className={cn(
                          'h-8 sm:h-9 rounded-xl flex items-center justify-center text-xs font-black text-white transition-all',
                          directAvatar === color ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                        )}
                        style={{ backgroundColor: color }}
                      >
                        {directName ? directName.charAt(0).toUpperCase() : '♣'}
                      </button>
                    )
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isJoining || !directName.trim()}
                className={cn(
                  'w-full py-2.5 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-gold-glow mt-2 sm:mt-4',
                  !isJoining && directName.trim()
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300 active:scale-95'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                )}
              >
                {isJoining ? 'Joining Table...' : 'Join Dukki Bazaar'}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const isHost = !!me?.isHost;
  const isLobby = gameState.status === 'LOBBY';

  return (
    <main className={cn(
      "bg-[#070d09] text-zinc-100 flex flex-col justify-between selection:bg-gold selection:text-black",
      isLobby ? "min-h-screen overflow-y-auto" : "h-screen h-[100dvh] overflow-hidden"
    )}>
      {/* Hide navbar when game starts (isLobby is false) */}
      {isLobby && <Header roomCode={roomCode} />}
      <Toast />

      {isLobby ? (
        /* ==================== LOBBY VIEW ==================== */
        <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
          {/* Lobby Card Container */}
          <div className="w-full bg-zinc-950/80 border-2 border-gold/70 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 shadow-2xl backdrop-blur-md">
            
            {/* Lobby Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider">
                    Waiting Lobby
                  </span>
                  <span className="text-xs text-zinc-400">Dukki Bazaar</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-serif mt-1">
                  Table Room {roomCode}
                </h1>
              </div>

              {/* Player Count Badge */}
              <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-2xl border border-white/10 text-xs sm:text-sm font-bold">
                <Users className="w-4 h-4 text-gold" />
                <span className="text-white">{gameState.players.length} / 5 Players</span>
                <span className="text-zinc-400">(Min 3 to start)</span>
              </div>
            </div>

            {/* Players Roster */}
            <div className="mt-8">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-4">
                Seated Players
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {gameState.players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/70 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="relative w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm shadow-md"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                        {p.isHost && (
                          <Crown className="absolute -top-2 -right-1 w-4 h-4 text-gold fill-gold drop-shadow" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-zinc-100 truncate max-w-[110px]">
                            {p.name}
                          </span>
                          {p.id === gameState.myPlayerId && (
                            <span className="text-[9px] bg-white/20 text-zinc-200 px-1 py-0.2 rounded font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          {p.isHost ? 'Table Host' : 'Player'}
                        </span>
                      </div>
                    </div>

                    {/* Host kick option for disconnected player */}
                    {isHost && !p.isHost && (
                      <button
                        onClick={() => kickPlayer(p.id)}
                        title="Kick player"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Empty seat placeholders */}
                {Array.from({ length: 5 - gameState.players.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center justify-center p-3 rounded-2xl border border-dashed border-zinc-800 bg-black/20 text-zinc-600 text-xs font-medium"
                  >
                    Waiting for player to join...
                  </div>
                ))}
              </div>
            </div>

            {/* Start Game Action */}
            <div className="mt-6 sm:mt-10 pt-4 sm:pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="text-xs text-zinc-400 text-center sm:text-left">
                {gameState.players.length < 3 ? (
                  <span className="text-amber-400 font-semibold">
                    Need at least {3 - gameState.players.length} more player(s) to start.
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold">
                    Ready to deal cards! Minimum requirement satisfied.
                  </span>
                )}
              </div>

              {isHost ? (
                <button
                  onClick={startGame}
                  disabled={gameState.players.length < 3}
                  className={cn(
                    'w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-gold-glow',
                    gameState.players.length >= 3
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300 active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  )}
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Start Game</span>
                </button>
              ) : (
                <div className="text-xs text-zinc-400 animate-pulse font-medium">
                  Waiting for host to start match...
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        /* ==================== LIVE GAME TABLE VIEW (FULL SCREEN) ==================== */
        <div className="w-full h-screen h-[100dvh] overflow-hidden">
          <PokerTable
            state={gameState}
            onDrawCard={drawCard}
            onPlaceCenter={placeCenter}
            onPlaceRightDeck={placeRightDeck}
          />
        </div>
      )}

      {/* Game Over Scoreboard Modal */}
      <GameOverModal
        winner={gameState.winner}
        players={gameState.players}
        isHost={isHost}
        onPlayAgain={playAgain}
      />

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
      />

      {isLobby && (
        <div className="w-full text-center py-2 text-[10px] text-zinc-600">
          Card Games By Madhav • Dukki Bazaar Table
        </div>
      )}
    </main>
  );
}
