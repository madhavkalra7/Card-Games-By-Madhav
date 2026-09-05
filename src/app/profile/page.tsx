'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { CARTOON_AVATARS, getAvatarById } from '@/lib/avatars';
import { ArrowLeft, Trophy, Award, Play, Flame, Check, Edit2, LogOut, Sparkles, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/sound';
import { AuthModal } from '@/components/modal/AuthModal';

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    checkAuth,
    updateAvatar,
    updateProfile,
    logout,
    setAuthModalOpen,
    isLoading,
  } = useAuthStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [savingAvatarId, setSavingAvatarId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user?.name) setEditedName(user.name);
  }, [user?.name]);

  const currentAvatar = getAvatarById(user?.avatarId);
  const winRate = user && user.totalGamesPlayed > 0
    ? Math.round((user.totalGamesWon / user.totalGamesPlayed) * 100)
    : 0;

  const handleSelectAvatar = async (avatarId: string) => {
    if (!user || avatarId === user.avatarId) return;
    setSavingAvatarId(avatarId);
    sounds.playCardFlip();
    await updateAvatar(avatarId);
    setSavingAvatarId(null);
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName.trim() === user?.name) {
      setIsEditingName(false);
      return;
    }
    await updateProfile({ name: editedName.trim() });
    setIsEditingName(false);
  };

  return (
    <main className="min-h-screen bg-[#070d09] text-zinc-100 flex flex-col selection:bg-amber-400 selection:text-black">
      {/* Top Header */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tables</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-serif font-black text-xs sm:text-sm text-gold tracking-widest uppercase">
            Player Profile
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6">
        {!user ? (
          /* Logged Out State */
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-zinc-950 border-2 border-gold/50 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center text-gold mb-3">
              <UserCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-serif uppercase tracking-wider">
              Profile Sign In
            </h2>
            <p className="text-xs text-zinc-400 mt-1 mb-5">
              Sign in or create an account to view your game score, wins, and select your cartoon character avatar!
            </p>
            <button
              onClick={() => setAuthModalOpen(true, 'login')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-gold-glow active:scale-95 transition-all cursor-pointer"
            >
              Sign In / Register
            </button>
          </div>
        ) : (
          /* Full Profile Dashboard */
          <div className="w-full max-w-2xl bg-gradient-to-b from-zinc-950 via-[#18110b] to-[#0c0805] border-2 border-gold/50 rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(212,175,55,0.35)] p-5 sm:p-8">
            {/* 1. Header Profile Banner */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-6 border-b border-white/10">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl p-2 flex items-center justify-center border-2 border-gold/60 shadow-gold-glow relative overflow-hidden shrink-0"
                style={{ backgroundColor: `${currentAvatar.color}25` }}
              >
                <img
                  src={currentAvatar.image}
                  alt={currentAvatar.name}
                  className="w-full h-full object-contain filter drop-shadow-xl"
                />
              </div>

              <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-black/60 border border-amber-400 text-white font-bold text-base outline-none"
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
                      <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-serif">
                        {user.name}
                      </h1>
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

              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-bold uppercase transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

            {/* 2. Stats Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 my-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/15 via-black/40 to-transparent border border-amber-400/40 flex flex-col items-center justify-center text-center">
                <Trophy className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Total Score</span>
                <span className="text-lg font-black text-amber-300 font-mono mt-0.5">
                  {user.totalScore.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-black/40 to-transparent border border-emerald-500/40 flex flex-col items-center justify-center text-center">
                <Award className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Games Won</span>
                <span className="text-lg font-black text-emerald-300 font-mono mt-0.5">
                  {user.totalGamesWon}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/15 via-black/40 to-transparent border border-blue-500/40 flex flex-col items-center justify-center text-center">
                <Play className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Matches</span>
                <span className="text-lg font-black text-blue-300 font-mono mt-0.5">
                  {user.totalGamesPlayed}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/15 via-black/40 to-transparent border border-pink-500/40 flex flex-col items-center justify-center text-center">
                <Flame className="w-5 h-5 text-pink-400 mb-1" />
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Win Rate</span>
                <span className="text-lg font-black text-pink-300 font-mono mt-0.5">
                  {winRate}%
                </span>
              </div>
            </div>

            {/* 3. "Tum Kaunsa Banoge?" Avatar Selector */}
            <div className="pt-2">
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-serif mb-1">
                <span>Tum Kaunsa Banoge?</span>
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.2 rounded-full border border-amber-400/30">
                  Cartoon Characters
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                Choose your avatar figurine to represent you at the card table!
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-amber-400 text-black p-0.5 rounded-full shadow border border-yellow-200">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center my-1 transition-transform duration-300 group-hover:scale-110">
                        <img
                          src={avatar.image}
                          alt={avatar.name}
                          className="w-full h-full object-contain filter drop-shadow-md"
                        />
                      </div>

                      <span className="font-extrabold text-xs sm:text-sm text-white mt-1">
                        {avatar.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold">
                        {avatar.title}
                      </span>

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

          </div>
        )}
      </div>

      <AuthModal />
    </main>
  );
}
