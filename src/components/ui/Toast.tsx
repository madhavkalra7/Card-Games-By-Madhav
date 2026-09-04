'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Toast: React.FC = () => {
  const { toast } = useGameStore();
  if (!toast) return null;

  return (
    <div className="fixed top-6 sm:top-10 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-none max-w-[92vw] sm:max-w-md w-full flex justify-center px-2">
      <div
        className={cn(
          'flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border text-xs sm:text-sm font-bold pointer-events-auto',
          toast.type === 'error' && 'bg-red-950/95 border-red-500/90 text-red-200 shadow-red-950/50',
          toast.type === 'success' && 'bg-emerald-950/95 border-emerald-500/90 text-emerald-200 shadow-emerald-950/50',
          toast.type === 'info' && 'bg-zinc-900/95 border-gold/70 text-gold-light shadow-black/60'
        )}
      >
        {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
        {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        {toast.type === 'info' && <Info className="w-4 h-4 text-gold shrink-0" />}
        <span className="leading-snug">{toast.text}</span>
      </div>
    </div>
  );
};
