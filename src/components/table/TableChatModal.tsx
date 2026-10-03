'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, TableChatMessage } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  X,
  Send,
  Smile,
  Sparkles,
  Volume2,
  Users
} from 'lucide-react';

const QUICK_TABLE_PHRASES = [
  'Bluff pakda gaya! 😂',
  'Kya baat hai! 👏',
  'Bhabho bachao! ♠',
  'GG Well played 🏆',
  'Fast chalo bhai 🏃',
  'Good game! 🔥',
  'Nice move! 👌',
  'Khao maa kasam! 🤞',
];

const QUICK_EMOJIS = ['😂', '🔥', '👑', '👏', '🤫', '💀', '😱', '♠️', '♥️', '♦️', '♣️', '🃏', '💰', '👍', '🥳', '❤️'];

export const TableChatModal: React.FC = () => {
  const {
    isTableChatOpen,
    setTableChatOpen,
    tableChatMessages,
    sendTableChatMessage,
    roomCode,
    myName
  } = useGameStore();

  const [inputText, setInputText] = useState('');
  const [showEmojiRow, setShowEmojiRow] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isTableChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tableChatMessages, isTableChatOpen]);

  // Focus input on open
  useEffect(() => {
    if (isTableChatOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isTableChatOpen]);

  if (!isTableChatOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    await sendTableChatMessage(text);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleSendPhrase = async (phrase: string) => {
    await sendTableChatMessage(phrase);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm select-none">
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0 z-0"
        onClick={() => setTableChatOpen(false)}
      />

      {/* Modal Card - Responsive on landscape phone, portrait, and desktop */}
      <div
        className={cn(
          'relative z-10 w-full max-w-sm sm:max-w-md bg-zinc-950/95 border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden my-auto',
          'h-[88vh] max-h-[520px] landscape:max-h-[340px] xs:landscape:max-h-[380px] sm:landscape:max-h-[480px]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 landscape:py-1 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/50 via-zinc-900 to-amber-950/50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center text-black shadow-md shadow-amber-500/30 shrink-0">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-black text-white tracking-wide truncate">
                  Table Chat
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] sm:text-[9px] font-bold uppercase shrink-0">
                  Room #{roomCode}
                </span>
              </div>
              <p className="text-[8.5px] sm:text-[10px] text-zinc-400 truncate hidden xs:block">
                Messages are visible to all players on the table
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTableChatOpen(false)}
            className="p-1 sm:p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
            title="Close Chat"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Message Scroll Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 space-y-2 bg-gradient-to-b from-zinc-950 via-zinc-900/50 to-zinc-950">
          {tableChatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center text-zinc-500 px-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg mb-2">
                💬
              </div>
              <p className="text-xs font-bold text-zinc-300">No messages yet</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 max-w-[200px]">
                Drop a message or tap one of the quick game reactions below!
              </p>
            </div>
          ) : (
            tableChatMessages.map((msg, idx) => {
              const isSelf = (msg.senderName || '').toLowerCase() === (myName || '').toLowerCase();
              const timeStr = msg.timestamp
                ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={msg.id || idx}
                  className={cn(
                    'flex flex-col max-w-[85%] sm:max-w-[78%]',
                    isSelf ? 'ml-auto items-end' : 'mr-auto items-start'
                  )}
                >
                  {/* Sender Name */}
                  {!isSelf && (
                    <div className="flex items-center gap-1 mb-0.5 ml-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: msg.senderAvatar || '#f59e0b' }}
                      />
                      <span className="text-[9px] font-bold text-amber-300/90 truncate max-w-[120px]">
                        {msg.senderName}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'rounded-xl px-2.5 sm:px-3 py-1.5 break-words shadow-sm',
                      isSelf
                        ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-semibold rounded-br-xs border border-amber-300/40'
                        : 'bg-zinc-900 border border-white/15 text-zinc-100 rounded-bl-xs'
                    )}
                  >
                    <p className="text-[11px] sm:text-xs whitespace-pre-wrap leading-relaxed select-text font-medium">
                      {msg.message}
                    </p>
                  </div>

                  <span className="text-[8px] text-zinc-500 mt-0.5 px-1 font-mono">
                    {timeStr}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Phrases Horizontal Carousel */}
        <div className="bg-black/50 border-t border-zinc-800/80 px-2 py-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {QUICK_TABLE_PHRASES.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendPhrase(phrase)}
              className="px-2 py-0.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-amber-400/40 text-[9.5px] text-zinc-300 hover:text-white whitespace-nowrap transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
            >
              {phrase}
            </button>
          ))}
        </div>

        {/* Quick Emoji Bar (Collapsible or visible) */}
        {showEmojiRow && (
          <div className="bg-zinc-900/90 border-t border-zinc-800 px-2 py-1 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            {QUICK_EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="w-7 h-7 shrink-0 flex items-center justify-center text-base rounded-md hover:bg-white/10 active:scale-125 transition-transform cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Message Input Footer Form */}
        <footer className="bg-zinc-900 border-t border-zinc-800 p-2 sm:p-2.5 landscape:p-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-1.5">
            {/* Emoji Toggle */}
            <button
              type="button"
              onClick={() => setShowEmojiRow((prev) => !prev)}
              className={cn(
                'p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer shrink-0',
                showEmojiRow
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
              )}
              title="Emojis"
            >
              <Smile className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Input - Supports full keyboard & any character */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message to table... (any character / emoji)"
              className="flex-1 min-w-0 bg-zinc-950 border border-white/15 focus:border-amber-400 focus:outline-none rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs text-white placeholder:text-zinc-500 font-sans touch-manipulation shadow-inner"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={cn(
                'p-1.5 sm:p-2 rounded-xl font-black transition-all cursor-pointer shrink-0 flex items-center justify-center',
                inputText.trim()
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
              )}
              title="Send to Table"
            >
              <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};
