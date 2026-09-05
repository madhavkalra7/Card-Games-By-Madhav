'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { CARTOON_AVATARS, getAvatarById } from '@/lib/avatars';
import { X, Trophy, Flame, Play, Award, Check, Edit2, LogOut, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/sound';

export const ProfileModal: React.FC = () => {
  const {
    user,
    isProfileModalOpen,
    setProfileModalOpen,
    updateAvatar,
    updateProfile,
    logout,
  } = useAuthStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [savingAvatarId, setSavingAvatarId] = useState<string | null>(null);

  React.useEffect(() => {
    if (user?.name) setEditedName(user.name);
  }, [user?.name]);

  if (!isProfileModalOpen || !user) return null;

  const currentAvatar = getAvatarById(user.avatarId);
  const winRate = user.totalGamesPlayed > 0
    ? Math.round((user.totalGamesWon / user.totalGamesPlayed) * 100)
    : 0;

  const handleSelectAvatar = async (avatarId: string) => {
    if (avatarId === user.avatarId) return;
    setSavingAvatarId(avatarId);
    sounds.playCardFlip();
    await updateAvatar(avatarId);
    setSavingAvatarId(null);
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName.trim() === user.name) {
      setIsEditingName(false);
      return;
    }
    await updateProfile({ name: editedName.trim() });
    setIsEditingName(false);
  };

  return (
    <div
      onClick={() => setProfileModalOpen(false)}
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[94vh] overflow-y-auto bg-gradient-to-b from-zinc-950 via-[#18110b] to-[#0c0805] border-2 border-gold/50 rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(212,175,55,0.35)] p-4 sm:p-7"
      >
        
        {/* Glow Ambient Top Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-16 bg-amber-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setProfileModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Profile Hero Showcase Header */}
        <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-5 border-b border-white/10">
          {/* Selected Figurine Display */}
          <div className="relative shrink-0 group">
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl p-2 flex items-center justify-center border-2 border-gold/60 shadow-gold-glow relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundColor: `${currentAvatar.color}25` }}
            >
              <img
                src={currentAvatar.image}
                alt={currentAvatar.name}
                className="w-full h-full object-contain filter drop-shadow-xl"
              />
            </div>

            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-400 text-black font-black text-[9px] sm:text-[10px] uppercase px-2 py-0.5 rounded-full border border-yellow-200 shadow whitespace-nowrap">
              {currentAvatar.title}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-black/60 border border-amber-400 text-white font-bold text-base sm:text-lg outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 rounded-lg bg-amber-400 text-black font-bold text-xs"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-serif">
                    {user.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="text-zinc-400 hover:text-amber-400 p-1 transition-colors"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-zinc-400 mt-0.5">{user.email}</p>

            {/* Rank Tier Pill */}
            <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-400/40 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>
                {user.totalGamesWon >= 10
                  ? 'Grandmaster Shark 👑'
                  : user.totalGamesWon >= 5
                  ? 'Bazaar Champion 🏆'
                  : user.totalGamesWon >= 1
                  ? 'Rising Card Shark 🃏'
                  : 'Table Rookie ♠'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Stats Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 my-5">
          {/* Total Score */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/15 via-black/40 to-transparent border border-amber-400/40 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center mb-1 text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Score</span>
            <span className="text-base sm:text-lg font-black text-amber-300 font-mono mt-0.5">
              {user.totalScore.toLocaleString()}
            </span>
          </div>

          {/* Games Won */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-black/40 to-transparent border border-emerald-500/40 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center mb-1 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Games Won</span>
            <span className="text-base sm:text-lg font-black text-emerald-300 font-mono mt-0.5">
              {user.totalGamesWon} Wins
            </span>
          </div>

          {/* Games Played */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/15 via-black/40 to-transparent border border-blue-500/40 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center mb-1 text-blue-400">
              <Play className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Matches</span>
            <span className="text-base sm:text-lg font-black text-blue-300 font-mono mt-0.5">
              {user.totalGamesPlayed} Played
            </span>
          </div>

          {/* Win Rate */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/15 via-black/40 to-transparent border border-pink-500/40 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-pink-400/20 flex items-center justify-center mb-1 text-pink-400">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Win Rate</span>
            <span className="text-base sm:text-lg font-black text-pink-300 font-mono mt-0.5">
              {winRate}%
            </span>
          </div>
        </div>

        {/* 3. "Tum Kaunsa Banoge?" Avatar Selector */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-serif">
                <span>Tum Kaunsa Banoge?</span>
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.2 rounded-full border border-amber-400/30">
                  Choose Avatar
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Select your favorite cartoon figurine for your profile & poker table seat!
              </p>
            </div>
          </div>

          {/* Avatar Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {CARTOON_AVATARS.map((avatar) => {
              const isSelected = user.avatarId === avatar.id;
              const isSaving = savingAvatarId === avatar.id;

              return (
                <div
                  key={avatar.id}
                  onClick={() => handleSelectAvatar(avatar.id)}
                  className={cn(
                    "relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-300 cursor-pointer group",
                    isSelected
                      ? "bg-gradient-to-b from-amber-500/25 to-black/60 border-amber-400 shadow-gold-glow scale-[1.02]"
                      : "bg-black/40 hover:bg-black/60 border-white/10 hover:border-white/25 hover:scale-[1.01]"
                  )}
                  style={{
                    backgroundColor: isSelected ? `${avatar.color}20` : undefined,
                  }}
                >
                  {/* Selected Active Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-amber-400 text-black p-0.5 rounded-full shadow border border-yellow-200">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Character Image */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center my-1 transition-transform duration-300 group-hover:scale-110">
                    <img
                      src={avatar.image}
                      alt={avatar.name}
                      className="w-full h-full object-contain filter drop-shadow-md"
                    />
                  </div>

                  {/* Character Name & Title */}
                  <span className="font-extrabold text-xs sm:text-sm text-white mt-1">
                    {avatar.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">
                    {avatar.title}
                  </span>

                  {/* Description pill */}
                  <span className="text-[8px] text-zinc-400 text-center line-clamp-1 mt-1 px-1">
                    {avatar.description}
                  </span>

                  {/* Action prompt */}
                  <div className="mt-2 w-full text-center">
                    <span
                      className={cn(
                        "inline-block w-full py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                        isSelected
                          ? "bg-amber-400 text-black shadow"
                          : "bg-white/10 text-zinc-300 group-hover:bg-white/20"
                      )}
                    >
                      {isSaving ? 'Saving...' : isSelected ? 'Active Avatar' : 'Select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Footer Actions */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-gold-glow active:scale-95 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
