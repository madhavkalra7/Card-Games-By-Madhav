'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Toast: React.FC = () => {
  const { toast } = useGameStore();
  if (!toast) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-none">
      <div
        className={cn(
          'flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border text-xs sm:text-sm font-bold',
          toast.type === 'error' && 'bg-red-950/90 border-red-500/80 text-red-200',
          toast.type === 'success' && 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200',
          toast.type === 'info' && 'bg-zinc-900/90 border-gold/60 text-gold-light'
        )}
      >
        {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
        {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        {toast.type === 'info' && <Info className="w-4 h-4 text-gold shrink-0" />}
        <span>{toast.text}</span>
      </div>
    </div>
  );
};
