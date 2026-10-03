'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { MessageSquare } from 'lucide-react';

export const TableChatBubbleOverlay: React.FC = () => {
  const latestTableBubble = useGameStore((s) => s.latestTableBubble);
  const setTableChatOpen = useGameStore((s) => s.setTableChatOpen);
  const isTableChatOpen = useGameStore((s) => s.isTableChatOpen);

  // If table chat modal is already open, the user is already viewing the chat history
  if (isTableChatOpen || !latestTableBubble) return null;

  return (
    <div className="fixed top-12 sm:top-14 landscape:top-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none px-3 max-w-sm sm:max-w-md w-full">
      <AnimatePresence>
        <motion.div
          key={latestTableBubble.id}
          initial={{ opacity: 0, y: -12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.92 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={() => setTableChatOpen(true)}
          className="pointer-events-auto cursor-pointer mx-auto flex items-center gap-2 px-3 py-2 rounded-2xl bg-zinc-950/95 border border-amber-500/50 shadow-[0_8px_30px_rgba(0,0,0,0.7)] backdrop-blur-md hover:border-amber-400 transition-all hover:scale-[1.02] active:scale-98"
        >
          {/* Avatar Color Dot / Icon */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-white/20 shadow-sm text-xs font-bold text-black"
            style={{ backgroundColor: latestTableBubble.senderAvatar || '#f59e0b' }}
          >
            <MessageSquare className="w-3 h-3 text-black" />
          </div>

          {/* Sender & Text */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-300 truncate">
                {latestTableBubble.senderName}
              </span>
              <span className="text-[8px] text-zinc-500 font-mono">table</span>
            </div>
            <p className="text-xs sm:text-[13px] text-white font-medium truncate leading-tight">
              {latestTableBubble.message}
            </p>
          </div>

          {/* Tap to reply cue */}
          <div className="shrink-0 text-[8px] sm:text-[9px] font-black uppercase text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
            Reply
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
