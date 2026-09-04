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
  const { myName, myAvatar, joinRoom } = useGameStore();

  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState(myName || '');
  const [avatar, setAvatar] = useState(myAvatar || AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border-2 border-gold/70 rounded-3xl p-6 sm:p-8 shadow-2xl">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wide">Join Game Room</h2>
            <p className="text-xs text-zinc-400">Enter room code to join table</p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          {/* Room Code */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              6-Character Room Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="e.g. K7P2QM"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-gold text-center font-mono font-black text-lg tracking-widest placeholder-zinc-600 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold uppercase"
            />
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Your Player Name
            </label>
            <input
              type="text"
              required
              maxLength={15}
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-sm font-medium"
            />
          </div>

          {/* Avatar Color Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Select Avatar Color
            </label>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_COLORS.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setAvatar(color)}
                  className={cn(
                    'h-10 rounded-xl flex items-center justify-center font-black text-white text-sm transition-all relative',
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
              'w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg mt-4',
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
