'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { X, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

const AVATAR_COLORS = [
  '#2563eb', // Royal Blue
  '#e11d48', // Rose / Red
  '#059669', // Emerald Green
  '#d97706', // Amber Gold
  '#7c3aed', // Royal Purple
  '#0891b2', // Cyan / Teal
  '#ea580c', // Fiery Orange
  '#4f46e5', // Indigo
];

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ isOpen, onClose, initialCode = '' }) => {
  const router = useRouter();
  const { myName, myAvatar, joinRoom, isConnected, initSocketListeners } = useGameStore();

  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState(myName || '');
  const [avatar, setAvatar] = useState(myAvatar || AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      initSocketListeners();
    }
  }, [isOpen, initSocketListeners]);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setLoading(true);
    const res = await joinRoom(code.trim(), name.trim(), avatar);
    setLoading(false);

    if (res.success) {
      onClose();
      router.push(`/room/${code.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-zinc-950 border-2 border-gold/70 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 text-zinc-400 hover:text-white p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3.5 sm:mb-6">
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0">
            <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide">Join Game Room</h2>
            <p className="text-[11px] sm:text-xs text-zinc-400">Enter room code to join table</p>
          </div>
        </div>

        {!isConnected && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="font-medium">Connecting to multiplayer game server...</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-3 sm:space-y-4">
          {/* Room Code */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              6-Character Room Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="e.g. K7P2QM"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-gold text-center font-mono font-black text-base sm:text-lg tracking-widest placeholder-zinc-600 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold uppercase"
            />
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Your Player Name
            </label>
            <input
              type="text"
              required
              maxLength={15}
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-xs sm:text-sm font-medium"
            />
          </div>

          {/* Avatar Color Selector */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Select Avatar Color
            </label>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {AVATAR_COLORS.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setAvatar(color)}
                  className={cn(
                    'h-8 sm:h-10 rounded-xl flex items-center justify-center font-black text-white text-xs sm:text-sm transition-all relative',
                    avatar === color
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105 shadow-lg'
                      : 'opacity-70 hover:opacity-100'
                  )}
                  style={{ backgroundColor: color }}
                >
                  {name ? name.charAt(0).toUpperCase() : '♦'}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !name.trim() || code.trim().length < 6}
            className={cn(
              'w-full py-2.5 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg mt-2 sm:mt-4',
              !loading && name.trim() && code.trim().length >= 6
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white active:scale-95 shadow-emerald-900/50'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            )}
          >
            {loading ? 'Joining Room...' : 'Enter Table'}
          </button>
        </form>

      </div>
    </div>
  );
};
