'use client';

import React, { useState, useEffect } from 'react';
import { useFriendsStore, LeaderboardPlayer, FriendUser, OnlinePlayer } from '@/store/friendsStore';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { getAvatarById } from '@/lib/avatars';
import { sounds } from '@/lib/sound';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Users,
  X,
  UserPlus,
  Sparkles,
  Search,
  Check,
  Send,
  Wifi,
  WifiOff,
  Flame,
  Medal,
  RefreshCw
} from 'lucide-react';

interface FriendsModalProps {
  currentRoomCode?: string;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({ currentRoomCode }) => {
  const {
    isFriendsModalOpen,
    activeTab,
    leaderboard,
    friends,
    onlinePlayers,
    isLoading,
    setFriendsModalOpen,
    setActiveTab,
    fetchLeaderboard,
    fetchFriends,
    fetchOnlinePlayers,
    addFriend,
    sendRoomInvite,
  } = useFriendsStore();

  const { user, setAuthModalOpen } = useAuthStore();
  const { showToast } = useGameStore();

  const [searchFriendInput, setSearchFriendInput] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [addMsg, setAddMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [invitedIds, setInvitedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isFriendsModalOpen) {
      fetchLeaderboard();
      fetchFriends();
      fetchOnlinePlayers();
      setAddMsg(null);
    }
  }, [isFriendsModalOpen, fetchLeaderboard, fetchFriends, fetchOnlinePlayers]);

  if (!isFriendsModalOpen) return null;

  const handleClose = () => {
    setFriendsModalOpen(false);
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchFriendInput.trim()) return;

    if (!user) {
      setAuthModalOpen(true, 'login');
      return;
    }

    setAddingFriend(true);
    setAddMsg(null);
    const res = await addFriend(searchFriendInput.trim());
    setAddingFriend(false);

    if (res.success) {
      setAddMsg({ type: 'success', text: `Added ${searchFriendInput.trim()} to friends!` });
      setSearchFriendInput('');
      sounds.playCardDraw();
    } else {
      setAddMsg({ type: 'error', text: res.error || 'Failed to add friend' });
    }
  };

  const handleDirectInvite = async (targetIdOrName: string, displayName: string) => {
    if (!currentRoomCode) {
      showToast('Create or enter a room first to send invites!', 'info');
      return;
    }

    const hostName = user?.name || 'Table Host';
    const hostAvatar = user?.avatarUrl;
    const hostColor = user?.avatarColor || '#f59e0b';

    setInvitedIds((prev) => ({ ...prev, [targetIdOrName]: true }));
    sounds.playCardDraw();

    const res = await sendRoomInvite(targetIdOrName, currentRoomCode, hostName, hostAvatar, hostColor);
    if (res.success) {
      showToast(`Invitation sent to ${displayName}!`, 'success');
    } else {
      showToast(`Invited ${displayName} to room ${currentRoomCode}`, 'info');
    }
  };

  // Check if a leaderboard player is already a friend
  const isFriendOfMine = (playerIdOrEmail: string) => {
    return friends.some((f) => f.id === playerIdOrEmail || f.email === playerIdOrEmail || f.name === playerIdOrEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in duration-200 select-none overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-gradient-to-b from-zinc-950 via-[#18110b] to-[#0d0a06] border-2 border-gold/70 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.35)] overflow-hidden">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-16 bg-gold/20 blur-2xl pointer-events-none rounded-full" />

        {/* Modal Top Bar */}
        <div className="relative flex items-center justify-between p-4 sm:p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-gold-glow flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-2xl bg-black/85 flex items-center justify-center">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider font-serif">
                  Casino Arena
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-gold/15 border border-gold/40 text-[9px] sm:text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                  Live
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                Leaderboard rankings & 1-click room invites
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 sm:px-6 pt-3 pb-2 gap-2 bg-black/40 border-b border-white/5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer',
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow'
                : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
            )}
          >
            <Trophy className="w-4 h-4" />
            <span>Rankings by Wins</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer relative',
              activeTab === 'friends'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow'
                : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
            )}
          >
            <Users className="w-4 h-4" />
            <span>Friends & Online</span>
            {friends.length > 0 && (
              <span className={cn(
                'ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                activeTab === 'friends' ? 'bg-black/30 text-black' : 'bg-gold/20 text-gold'
              )}>
                {friends.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Global Rankings According to Total Wins */}
        {activeTab === 'leaderboard' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3">
            {/* Explanatory Banner */}
            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Ranked strictly by <strong>Total Match Victories</strong> & points</span>
              </div>
              <button
                onClick={() => fetchLeaderboard()}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-white hover:underline cursor-pointer"
              >
                <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
                <span>Refresh</span>
              </button>
            </div>

            {isLoading && leaderboard.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                <span className="text-xs">Loading tournament rankings...</span>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No tournament records yet. Play your first match to claim #1 rank!
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((player) => {
                  const isFirst = player.rank === 1;
                  const isSecond = player.rank === 2;
                  const isThird = player.rank === 3;
                  const isSelf = user && (user.id === player.id || user.email === player.email || user.name === player.name);
                  const isAlreadyFriend = isSelf || isFriendOfMine(player.id) || isFriendOfMine(player.name);
                  const isInvited = invitedIds[player.id] || invitedIds[player.name];

                  const cartoon = getAvatarById(player.avatarId);

                  return (
                    <div
                      key={player.id || player.name}
                      className={cn(
                        'relative flex items-center justify-between p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-200',
                        isFirst && 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border-amber-400/70 shadow-gold-glow',
                        isSecond && 'bg-gradient-to-r from-slate-400/15 to-transparent border-slate-300/50',
                        isThird && 'bg-gradient-to-r from-amber-800/15 to-transparent border-amber-700/50',
                        player.rank > 3 && 'bg-zinc-900/60 border-white/5 hover:border-white/15',
                        isSelf && 'ring-2 ring-gold/90'
                      )}
                    >
                      {/* Left: Rank Medal & Avatar & Name */}
                      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={cn(
                            'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-md',
                            isFirst && 'bg-gradient-to-br from-yellow-300 to-amber-500 text-black shadow-gold-glow ring-2 ring-yellow-200',
                            isSecond && 'bg-gradient-to-br from-slate-200 to-slate-400 text-black ring-1 ring-white',
                            isThird && 'bg-gradient-to-br from-amber-600 to-amber-800 text-white ring-1 ring-amber-300',
                            player.rank > 3 && 'bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono'
                          )}
                        >
                          {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `#${player.rank}`}
                        </div>

                        {/* Avatar */}
                        <div
                          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-amber-400/80 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow"
                          style={{ backgroundColor: `${cartoon.color}40` }}
                        >
                          {player.avatarUrl || cartoon.image ? (
                            <img
                              src={player.avatarUrl || cartoon.image}
                              alt={player.name}
                              className="w-full h-full object-contain filter drop-shadow"
                            />
                          ) : (
                            <span className="font-black text-white text-xs">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Player Details */}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[110px] sm:max-w-[160px]">
                              {player.name}
                            </span>
                            {isSelf && (
                              <span className="text-[8px] sm:text-[9px] bg-gold/20 text-gold border border-gold/40 font-mono px-1 py-0.2 rounded font-extrabold">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                            {cartoon.title || 'Casino Champion'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Wins Highlight & Points & Action */}
                      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        {/* Total Wins Badge (Prominently Highlighted) */}
                        <div className="flex flex-col items-end text-right">
                          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 shadow-sm">
                            <Trophy className="w-3 h-3 text-yellow-400 shrink-0" />
                            <span className="font-black text-xs sm:text-sm text-amber-300 font-mono">
                              {player.totalGamesWon} {player.totalGamesWon === 1 ? 'Win' : 'Wins'}
                            </span>
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5 font-mono">
                            {player.totalScore.toLocaleString()} PTS • {player.winRate}% WR
                          </div>
                        </div>

                        {/* Action buttons */}
                        {currentRoomCode && !isSelf && (
                          <button
                            type="button"
                            disabled={isInvited}
                            onClick={() => handleDirectInvite(player.id || player.name, player.name)}
                            className={cn(
                              'px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer',
                              isInvited
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-gold-glow active:scale-95'
                            )}
                          >
                            {isInvited ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Invited</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                <span>Invite</span>
                              </>
                            )}
                          </button>
                        )}

                        {!currentRoomCode && !isSelf && !isAlreadyFriend && (
                          <button
                            type="button"
                            onClick={() => {
                              addFriend(player.name);
                              showToast(`Added ${player.name} to friends!`, 'success');
                            }}
                            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                            title="Add to Friends"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Friends List & Online Players with Direct Invite */}
        {activeTab === 'friends' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
            
            {/* Add Friend Input Form */}
            <form onSubmit={handleAddFriend} className="flex flex-col gap-2">
              <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-300">
                Add Friend by Player Name or Email
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchFriendInput}
                    onChange={(e) => setSearchFriendInput(e.target.value)}
                    placeholder="Enter nickname or email (e.g. Madhav, Kabir)..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-gold"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                </div>
                <button
                  type="submit"
                  disabled={addingFriend || !searchFriendInput.trim()}
                  className={cn(
                    'px-3.5 sm:px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-gold-glow transition-all cursor-pointer shrink-0',
                    !addingFriend && searchFriendInput.trim()
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300 active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  )}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{addingFriend ? 'Adding...' : 'Add'}</span>
                </button>
              </div>

              {addMsg && (
                <div
                  className={cn(
                    'p-2 rounded-xl text-xs font-medium',
                    addMsg.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/15 border border-red-500/30 text-red-300'
                  )}
                >
                  {addMsg.text}
                </div>
              )}
            </form>

            {/* Friends Section */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gold" />
                  <span>My Friends ({friends.length})</span>
                </h3>
                {currentRoomCode && (
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Room #{currentRoomCode} Active
                  </span>
                )}
              </div>

              {friends.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 text-center text-zinc-500 text-xs">
                  Your friend list is empty. Search above or click "+ Friend" in the Rankings tab!
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => {
                    const cartoon = getAvatarById(friend.avatarId);
                    const isOnline = friend.isOnline || onlinePlayers.some((op) => op.name === friend.name || op.userId === friend.id);
                    const isInvited = invitedIds[friend.id] || invitedIds[friend.name];

                    return (
                      <div
                        key={friend.id || friend.name}
                        className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-zinc-900/70 border border-white/10 hover:border-gold/40 transition-all"
                      >
                        {/* Avatar & Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <div
                              className="w-10 h-10 rounded-full border border-amber-400/60 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow"
                              style={{ backgroundColor: `${cartoon.color}40` }}
                            >
                              <img
                                src={friend.avatarUrl || cartoon.image}
                                alt={friend.name}
                                className="w-full h-full object-contain filter drop-shadow"
                              />
                            </div>
                            {/* Online indicator dot */}
                            <span
                              className={cn(
                                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black',
                                isOnline ? 'bg-emerald-400 ring-2 ring-emerald-500/50' : 'bg-zinc-600'
                              )}
                              title={isOnline ? 'Online in Casino' : 'Offline'}
                            />
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[130px] sm:max-w-[180px]">
                                {friend.name}
                              </span>
                              {isOnline && (
                                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                                  ONLINE
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              🏆 {friend.totalGamesWon} Wins • {friend.totalScore.toLocaleString()} PTS
                            </span>
                          </div>
                        </div>

                        {/* Direct Invite Button */}
                        <div>
                          {currentRoomCode ? (
                            <button
                              type="button"
                              disabled={isInvited}
                              onClick={() => handleDirectInvite(friend.id || friend.name, friend.name)}
                              className={cn(
                                'px-3 py-1.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer',
                                isInvited
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-gold-glow active:scale-95'
                              )}
                            >
                              {isInvited ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Invited</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Direct Invite</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-[10px] text-zinc-500 font-medium">
                              {isOnline ? 'Active in Casino' : 'Offline'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Players in Casino Subsection */}
            {onlinePlayers.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-white/10">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Other Players Online in Casino ({onlinePlayers.length})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {onlinePlayers.map((p, idx) => {
                    if (user && p.name === user.name) return null;
                    const isInvited = invitedIds[p.userId || p.name] || invitedIds[p.name];

                    return (
                      <div
                        key={`online-${idx}-${p.name}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/50 border border-white/5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow"
                            style={{ backgroundColor: p.avatarColor || '#3b82f6' }}
                          >
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-xs text-zinc-200 truncate max-w-[100px]">
                            {p.name}
                          </span>
                        </div>

                        {currentRoomCode && (
                          <button
                            type="button"
                            disabled={isInvited}
                            onClick={() => handleDirectInvite(p.userId || p.name, p.name)}
                            className={cn(
                              'px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer',
                              isInvited
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 active:scale-95'
                            )}
                          >
                            {isInvited ? 'Invited ✓' : 'Invite'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
