'use client';

import React, { useState, useEffect } from 'react';
import { useFriendsStore } from '@/store/friendsStore';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { getAvatarById } from '@/lib/avatars';
import { sounds } from '@/lib/sound';
import { cn } from '@/lib/utils';
import {
  Users,
  X,
  Send,
  Check,
  Copy,
  Sparkles,
  Share2,
  Wifi,
  Search,
  UserPlus,
  RefreshCw
} from 'lucide-react';

interface InviteFriendsModalProps {
  roomCode: string;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({ roomCode }) => {
  const {
    isInviteModalOpen,
    friends,
    onlinePlayers,
    setInviteModalOpen,
    fetchFriends,
    fetchOnlinePlayers,
    sendRoomInvite,
    addFriend,
  } = useFriendsStore();

  const { user } = useAuthStore();
  const { showToast } = useGameStore();

  const [copied, setCopied] = useState(false);
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});
  const [quickAddInput, setQuickAddInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Real-time live search states
  const [quickSearchResults, setQuickSearchResults] = useState<any[]>([]);
  const [isQuickSearching, setIsQuickSearching] = useState(false);

  // Debounced real-time search
  useEffect(() => {
    const query = quickAddInput.trim();
    if (!query) {
      setQuickSearchResults([]);
      setIsQuickSearching(false);
      return;
    }

    setIsQuickSearching(true);
    const timer = setTimeout(async () => {
      const results = await useFriendsStore.getState().searchUsers(query);
      setQuickSearchResults(results);
      setIsQuickSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [quickAddInput]);

  useEffect(() => {
    if (isInviteModalOpen) {
      fetchFriends();
      fetchOnlinePlayers();
    }
  }, [isInviteModalOpen, fetchFriends, fetchOnlinePlayers]);

  if (!isInviteModalOpen) return null;

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    showToast('Room invite link copied to clipboard!', 'success');
    sounds.playCardDraw();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    showToast(`Room code ${roomCode} copied!`, 'success');
    sounds.playCardDraw();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInvite = async (targetIdOrName: string, displayName: string) => {
    const hostName = user?.name || 'Table Host';
    const hostAvatar = user?.avatarUrl;
    const hostColor = user?.avatarColor || '#f59e0b';

    setInvitedMap((prev) => ({ ...prev, [targetIdOrName]: true }));
    sounds.playCardDraw();

    const res = await sendRoomInvite(targetIdOrName, roomCode, hostName, hostAvatar, hostColor);
    if (res.success) {
      showToast(`Direct invite sent to ${displayName}!`, 'success');
    } else {
      showToast(`Invited ${displayName} to room ${roomCode}`, 'info');
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddInput.trim()) return;
    setIsAdding(true);
    const res = await addFriend(quickAddInput.trim());
    setIsAdding(false);
    if (res.success) {
      showToast(`Added ${quickAddInput.trim()}!`, 'success');
      setQuickAddInput('');
      sounds.playCardDraw();
    } else {
      showToast(res.error || 'Could not add friend', 'error');
    }
  };

  return (
    <div
      onClick={() => setInviteModalOpen(false)}
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in duration-200 select-none overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-gradient-to-b from-zinc-950 via-[#18110b] to-[#0d0a06] border-2 border-gold/70 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.4)] overflow-hidden"
      >
        
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-gold/25 blur-2xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="relative flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-500/20 border border-gold/40 text-gold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-serif">
                Direct Invite Friends
              </h2>
              <p className="text-[11px] text-zinc-400">
                1-click invites directly to Table #{roomCode}
              </p>
            </div>
          </div>

          <button
            onClick={() => setInviteModalOpen(false)}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Code & Copy Share Banner */}
        <div className="p-3.5 sm:p-4 bg-black/50 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-zinc-900/90 border border-gold/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 uppercase">Room:</span>
              <span className="font-mono text-base sm:text-lg font-black text-gold tracking-widest">
                {roomCode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Code</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-gold-glow active:scale-95 transition-all cursor-pointer"
                title="Copy Invite Link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          
          {/* Section: Your Friends */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span>Your Friends ({friends.length})</span>
              </span>
            </div>

            {friends.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 text-center text-zinc-400 text-xs">
                No friends added yet. Enter a player name below to add and invite them instantly!
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => {
                  const cartoon = getAvatarById(friend.avatarId);
                  const isOnline = friend.isOnline || onlinePlayers.some((op) => op.name === friend.name || op.userId === friend.id);
                  const isInvited = invitedMap[friend.id] || invitedMap[friend.name];

                  return (
                    <div
                      key={friend.id || friend.name}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-gold/40 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <div
                            className="w-9 h-9 rounded-full border border-amber-400/60 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow"
                            style={{ backgroundColor: `${cartoon.color}40` }}
                          >
                            <img
                              src={friend.avatarUrl || cartoon.image}
                              alt={friend.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span
                            className={cn(
                              'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black',
                              isOnline ? 'bg-emerald-400' : 'bg-zinc-600'
                            )}
                          />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[130px]">
                              {friend.name}
                            </span>
                            {isOnline && (
                              <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                                ONLINE
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            🏆 {friend.totalGamesWon} Wins
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isInvited}
                        onClick={() => handleInvite(friend.id || friend.name, friend.name)}
                        className={cn(
                          'px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer',
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Add Friend form with live search */}
          <form onSubmit={handleQuickAdd} className="pt-2 border-t border-white/10">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
              Quick Add & Invite by Nickname or Email
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Type player nickname or email..."
                  value={quickAddInput}
                  onChange={(e) => setQuickAddInput(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-gold"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                {quickAddInput && (
                  <button
                    type="button"
                    onClick={() => setQuickAddInput('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isAdding || !quickAddInput.trim()}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shrink-0',
                  !isAdding && quickAddInput.trim()
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black hover:from-amber-400 hover:to-yellow-300 shadow-gold-glow active:scale-95'
                    : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                )}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Live Search Results in Quick Add */}
            {quickAddInput.trim().length > 0 && (
              <div className="mt-2 space-y-1.5 p-2.5 rounded-xl bg-black/60 border border-gold/40 animate-in fade-in zoom-in-95 duration-150 shadow-md">
                <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold uppercase tracking-wider px-0.5">
                  <span>Matching Players {quickSearchResults.length > 0 && `(${quickSearchResults.length})`}</span>
                  {isQuickSearching && (
                    <span className="flex items-center gap-1 text-[9px] text-zinc-400 font-normal lowercase">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-400" />
                      <span>searching...</span>
                    </span>
                  )}
                </div>

                {isQuickSearching && quickSearchResults.length === 0 ? (
                  <div className="py-2.5 text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                    <span>Searching registered players...</span>
                  </div>
                ) : !isQuickSearching && quickSearchResults.length === 0 ? (
                  <div className="py-2 text-center text-xs text-zinc-400">
                    No players found matching "{quickAddInput.trim()}"
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {quickSearchResults.map((player) => {
                      const isFriend = friends.some((f) => f.id === player.id || f.name === player.name);
                      const isInvited = invitedMap[player.id] || invitedMap[player.name];
                      const cartoon = getAvatarById(player.avatarId);

                      return (
                        <div
                          key={`quick-res-${player.id || player.name}`}
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/90 border border-white/10 hover:border-gold/40 transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-7 h-7 rounded-full border border-amber-400/80 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow"
                              style={{ backgroundColor: `${cartoon.color}40` }}
                            >
                              <img
                                src={player.avatarUrl || cartoon.image}
                                alt={player.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-xs text-white truncate max-w-[110px]">
                                {player.name}
                              </span>
                              <span className="text-[9px] text-zinc-400 font-mono">
                                🏆 {player.totalGamesWon} Wins
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isFriend ? (
                              <button
                                type="button"
                                disabled={isInvited}
                                onClick={() => handleInvite(player.id || player.name, player.name)}
                                className={cn(
                                  'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer',
                                  isInvited
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-gold-glow active:scale-95'
                                )}
                              >
                                {isInvited ? <Check className="w-2.5 h-2.5" /> : <Send className="w-2.5 h-2.5" />}
                                <span>{isInvited ? 'Invited' : 'Invite'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  setIsAdding(true);
                                  await addFriend(player.name || player.id);
                                  setIsAdding(false);
                                  handleInvite(player.id || player.name, player.name);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-gold-glow active:scale-95 transition-all cursor-pointer"
                              >
                                <UserPlus className="w-2.5 h-2.5" />
                                <span>+ Add & Invite</span>
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
          </form>

          {/* Section: Other Active Online Players in Casino */}
          {onlinePlayers.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Online in Casino ({onlinePlayers.length})</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onlinePlayers.map((p, idx) => {
                  if (user && p.name === user.name) return null;
                  const isInvited = invitedMap[p.userId || p.name] || invitedMap[p.name];

                  return (
                    <div
                      key={`online-inv-${idx}-${p.name}`}
                      className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-white/5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0"
                          style={{ backgroundColor: p.avatarColor || '#3b82f6' }}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-xs text-zinc-200 truncate max-w-[90px]">
                          {p.name}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isInvited}
                        onClick={() => handleInvite(p.userId || p.name, p.name)}
                        className={cn(
                          'px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer',
                          isInvited
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 active:scale-95'
                        )}
                      >
                        {isInvited ? 'Invited ✓' : 'Invite'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
