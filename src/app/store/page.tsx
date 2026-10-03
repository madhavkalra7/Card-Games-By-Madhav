'use client';

import React, { useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { useMStore } from '@/store/mStore';
import { MStoreModal } from '@/components/store/MStoreModal';
import { Crown, Sparkles, ShoppingBag } from 'lucide-react';

export default function StorePage() {
  const { setOpen, isOpen } = useMStore();

  useEffect(() => {
    setOpen(true);
  }, [setOpen]);

  return (
    <main className="min-h-screen min-h-[100dvh] bg-[#070b09] text-zinc-100 flex flex-col justify-between selection:bg-gold selection:text-black">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-0.5 shadow-gold-glow flex items-center justify-center mx-auto">
          <div className="w-full h-full rounded-3xl bg-black/85 flex items-center justify-center">
            <Crown className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white font-serif uppercase tracking-wider">
            M Store Emporium
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Exclusive M Coins currency packs and daily 7-card rotation shop featuring the 24K Golden Joker!
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-gold-glow active:scale-95 transition-all flex items-center gap-2 mx-auto cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Open M Store Window</span>
        </button>
      </div>

      <MStoreModal />
    </main>
  );
}
