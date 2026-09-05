'use client';

import React, { useState } from 'react';
import { PlayerClientView } from '@/lib/types';
import { ShieldAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: PlayerClientView[];
  myPlayerId: string;
  onSubmitPenalty: (targetPlayerId: string, reason: 'MISSED_CENTER' | 'WRONG_CARD_PLAYED' | 'INVALID_SEQUENCE') => void;
}

export const PenaltyModal: React.FC<PenaltyModalProps> = ({
  isOpen,
  onClose,
  players,
  myPlayerId,
  onSubmitPenalty,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<'MISSED_CENTER' | 'WRONG_CARD_PLAYED' | 'INVALID_SEQUENCE'>('MISSED_CENTER');

  if (!isOpen) return null;

  const opponents = players.filter(p => p.id !== myPlayerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) return;
    onSubmitPenalty(selectedPlayerId, selectedReason);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-zinc-950 border-2 border-red-500/70 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 text-zinc-400 hover:text-white p-1 sm:p-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3.5 sm:mb-5">
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 shrink-0">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-wide">Call Penalty</h3>
            <p className="text-[11px] sm:text-xs text-zinc-400">Accuse a player of violating Dukki Bazaar rules</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Step 1: Select Offending Player */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              1. Select Offending Player
            </label>
            <div className="grid grid-cols-2 gap-2">
              {opponents.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all',
                    selectedPlayerId === p.id
                      ? 'border-red-500 bg-red-950/40 text-white ring-2 ring-red-500/50'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                  )}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Violation Reason */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              2. Choose Infraction Reason
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'MISSED_CENTER' as const,
                  title: '1. Missed Center (Priority Violation)',
                  desc: 'Card was playable on Center Bazaar, but placed on right deck instead.',
                },
                {
                  id: 'WRONG_CARD_PLAYED' as const,
                  title: '2. Wrong Card Played',
                  desc: 'Card placed on an opponent without Bazaar Open or without rank + 1.',
                },
                {
                  id: 'INVALID_SEQUENCE' as const,
                  title: '3. Invalid Sequence',
                  desc: 'Card does not follow valid ascending numerical order.',
                },
              ].map((reason) => (
                <div
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={cn(
                    'p-3 rounded-xl border cursor-pointer transition-all',
                    selectedReason === reason.id
                      ? 'border-red-500 bg-red-950/40 ring-1 ring-red-500/50'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  )}
                >
                  <div className="text-xs font-bold text-zinc-100">{reason.title}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{reason.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/30 text-[11px] text-amber-300/90 leading-relaxed">
            ⚠️ <strong>Notice:</strong> If your accusation is false, <em>YOU</em> will receive 1 penalty card from every other player!
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!selectedPlayerId}
            className={cn(
              'w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg',
              selectedPlayerId
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white active:scale-95 shadow-red-900/50'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            )}
          >
            Submit Penalty Call
          </button>
        </form>
      </div>
    </div>
  );
};
