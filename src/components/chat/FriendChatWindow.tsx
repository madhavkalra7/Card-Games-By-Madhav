'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChatStore, DirectChatMessage } from '@/store/chatStore';
import { useFriendsStore, OnlinePlayer } from '@/store/friendsStore';
import { useGameStore } from '@/store/gameStore';
import { getAvatarById } from '@/lib/avatars';
import { sounds } from '@/lib/sound';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Send,
  Smile,
  X,
  Sparkles,
  Play,
  CheckCheck,
  Clock,
  Shield,
  MessageSquare
} from 'lucide-react';

// Curated Emoji Palette for High-Energy Desi Card Gaming
const EMOJI_CATEGORIES = [
  {
    title: 'Popular',
    emojis: ['😂', '🔥', '👑', '❤️', '👏', '🤫', '💀', '😱', '💰', '🥳', '👍', '💯'],
  },
  {
    title: 'Cards & Casino',
    emojis: ['♠️', '♥️', '♦️', '♣️', '🃏', '🎲', '🎰', '🏆', '🥇', '💵', '🪙', '✨'],
  },
  {
    title: 'Desi Reactions',
    emojis: ['🙏', '👀', '🦁', '🐅', '🎯', '🚀', '💣', '⚡', '🤝', '😎', '💃', '🕺'],
  },
  {
    title: 'Expressions',
    emojis: ['🤣', '😜', '🤩', '🥺', '😤', '🤯', '🥱', '🤐', '🤙', '✌️', '💪', '🎉'],
  },
];

const QUICK_STARTERS = [
  '♠️ Bhabho ka match khelega?',
  '🃏 Bluff Master me aaja bro!',
  '🔥 Table ready hai, chal!',
  'Ready when you are! 🏆',
];

export const FriendChatWindow: React.FC = () => {
  const { activeFriend, isChatWindowOpen, closeChatWindow, messagesByFriend, sendMessage, isLoadingHistory } = useChatStore();
  const { onlinePlayers, sendRoomInvite, friends } = useFriendsStore();
  const { roomCode: currentRoomCode, showToast } = useGameStore();

  const isAcceptedFriend = friends.some(
    (f) =>
      (activeFriend?.id && f.id === activeFriend.id) ||
      (activeFriend?.name && f.name.toLowerCase() === activeFriend.name.toLowerCase()) ||
      (activeFriend?.email && f.email?.toLowerCase() === activeFriend.email.toLowerCase())
  );

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const friendKey = (activeFriend?.id || activeFriend?.name || '').toLowerCase();
  const messages: DirectChatMessage[] = messagesByFriend[friendKey] || [];

  // Check online status
  const onlineInfo = onlinePlayers.find(
    (op) =>
      (activeFriend?.name && op.name?.toLowerCase() === activeFriend.name.toLowerCase()) ||
      (activeFriend?.id && op.userId === activeFriend.id)
  );
  const isOnline = activeFriend?.isOnline || !!onlineInfo;

  // Auto-scroll to latest message
  useEffect(() => {
    if (isChatWindowOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatWindowOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isChatWindowOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    }
  }, [isChatWindowOpen]);

  if (!isChatWindowOpen || !activeFriend) return null;

  const cartoon = getAvatarById(activeFriend.avatarId);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    setShowEmojiPicker(false);
    await sendMessage(text);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleSendStarter = async (starter: string) => {
    await sendMessage(starter);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleDirectInvite = async () => {
    if (!currentRoomCode) {
      showToast('Create or enter a table room first to invite!', 'info');
      return;
    }
    sounds.playCardDraw();
    const targetKey = activeFriend.id || activeFriend.name;
    const res = await sendRoomInvite(targetKey, currentRoomCode, 'Host');
    if (res.success) {
      showToast(`Invited ${activeFriend.name} to room #${currentRoomCode}!`, 'success');
      await sendMessage(`🚨 Join my table in Room #${currentRoomCode}! Click play to enter.`);
    } else {
      showToast(`Invited ${activeFriend.name}`, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-zinc-950 flex flex-col text-white overflow-hidden select-none animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <header className="shrink-0 bg-zinc-900/95 border-b border-amber-500/20 px-3 sm:px-6 py-2 sm:py-3 landscape:py-1.5 flex items-center justify-between shadow-lg backdrop-blur-md z-10 pt-[max(0.4rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => {
              closeChatWindow();
              useFriendsStore.getState().setFriendsModalOpen(true);
            }}
            className="p-1.5 sm:p-2 -ml-1 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            title="Back to Friends"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="hidden xs:inline text-xs sm:text-sm font-bold">Friends</span>
          </button>

          {/* Friend Avatar & Details */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-amber-400/70 p-0.5 flex items-center justify-center overflow-hidden shadow-md"
                style={{ backgroundColor: `${cartoon.color}40` }}
              >
                <img
                  src={activeFriend.avatarUrl || cartoon.image}
                  alt={activeFriend.name}
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              {/* Online pulse indicator */}
              <span
                className={cn(
                  'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950',
                  isOnline ? 'bg-emerald-400 ring-2 ring-emerald-500/50 animate-pulse' : 'bg-zinc-600'
                )}
                title={isOnline ? 'Online in Casino' : 'Offline'}
              />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-base font-black text-white truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[280px]">
                  {activeFriend.name}
                </h2>
                {isOnline && (
                  <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 rounded-full hidden xs:inline-block">
                    Online
                  </span>
                )}
              </div>
              <div className="text-[9px] sm:text-[11px] text-zinc-400 font-mono truncate">
                🏆 {activeFriend.totalGamesWon} Wins • {activeFriend.totalScore.toLocaleString()} PTS
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {currentRoomCode && (
            <button
              type="button"
              onClick={handleDirectInvite}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-gold-glow active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-3 h-3 fill-black" />
              <span>Invite</span>
            </button>
          )}

          <button
            type="button"
            onClick={closeChatWindow}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Chat Messages Body Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 space-y-3 bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-zinc-950">
        {/* Encrypted & Saved in Database Banner */}
        <div className="flex items-center justify-center my-1">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-amber-500/20 text-[9px] sm:text-[10px] text-zinc-400">
            <Shield className="w-3 h-3 text-gold" />
          </div>
        </div>

        {isLoadingHistory && messages.length === 0 && (
          <div className="flex items-center justify-center py-10 text-zinc-500 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping mr-2" />
            Loading conversation...
          </div>
        )}

        {!isAcceptedFriend && (
          <div className="mx-auto my-4 max-w-sm p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-center shadow-lg animate-in fade-in">
            <div className="w-11 h-11 rounded-full bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center text-xl mb-2">
              ⏳
            </div>
            <h4 className="font-black text-sm text-amber-300">Friend Request Pending</h4>
            <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
              You cannot send messages until <strong>{activeFriend.name}</strong> accepts your friend request. Once accepted, live 1-on-1 chat will unlock automatically!
            </p>
          </div>
        )}

        {messages.length === 0 && !isLoadingHistory && isAcceptedFriend && (
          <div className="flex flex-col items-center justify-center py-12 text-center max-w-sm mx-auto px-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl mb-3 shadow-lg">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-zinc-200">
              Start chatting with {activeFriend.name}
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-1">
              Say hello or challenge them directly to a live card game!
            </p>

            {/* Quick Starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full">
              {QUICK_STARTERS.map((starter, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendStarter(starter)}
                  className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-gold/40 text-left text-[11px] text-zinc-300 hover:text-white transition-all active:scale-98 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3 h-3 text-gold shrink-0" />
                  <span className="truncate">{starter}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((msg, index) => {
          const isSelf = msg.isSelf;
          const timeStr = msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          // Check if message is purely 1-3 emojis for extra large playful font
          const isOnlyEmoji = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}){1,3}$/u.test(msg.text.trim());

          return (
            <div
              key={msg.id || index}
              className={cn('flex flex-col max-w-[85%] sm:max-w-[70%]', isSelf ? 'ml-auto items-end' : 'mr-auto items-start')}
            >
              {/* Sender Name for incoming */}
              {!isSelf && (
                <span className="text-[9px] text-zinc-400 font-bold mb-0.5 ml-2">
                  {msg.senderName}
                </span>
              )}

              {/* Message Bubble */}
              <div
                className={cn(
                  'rounded-2xl px-3.5 py-2 break-words shadow-md transition-all',
                  isOnlyEmoji
                    ? 'bg-transparent text-4xl sm:text-5xl py-1 px-1'
                    : isSelf
                    ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-semibold rounded-br-xs border border-amber-300/40'
                    : 'bg-zinc-900 border border-white/15 text-zinc-100 rounded-bl-xs'
                )}
              >
                <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-text font-medium">
                  {msg.text}
                </p>
              </div>

              {/* Time & Delivery Status */}
              <div className="flex items-center gap-1 mt-0.5 px-1 text-[8.5px] text-zinc-500 font-mono">
                <span>{timeStr}</span>
                {isSelf && <CheckCheck className="w-2.5 h-2.5 text-amber-400" />}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Expandable Emoji Picker Drawer */}
      {showEmojiPicker && (
        <div className="bg-zinc-900 border-t border-zinc-800 p-2 sm:p-3 shrink-0 animate-in slide-in-from-bottom-5 duration-200">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 mb-2 overflow-x-auto no-scrollbar">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedEmojiCategory(idx)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                  selectedEmojiCategory === idx
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                )}
              >
                {cat.title}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="grid grid-cols-6 xs:grid-cols-8 sm:grid-cols-12 gap-1.5 max-h-32 sm:max-h-40 landscape:max-h-24 overflow-y-auto p-1">
            {EMOJI_CATEGORIES[selectedEmojiCategory].emojis.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-lg sm:text-xl rounded-lg hover:bg-white/10 active:scale-120 transition-all cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Emoji Bar (Always Visible Above Input for instant mobile chat) */}
      <div className="bg-zinc-950 border-t border-zinc-800/80 px-2 sm:px-4 py-1.5 landscape:py-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider hidden sm:inline mr-1">
          Quick:
        </span>
        {['😂', '🔥', '👑', '❤️', '👏', '🤫', '💀', '😱', '♠️', '♥️', '♦️', '♣️', '🃏', '💰', '👍', '💯'].map((emoji, idx) => (
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

      {/* Bottom Message Input Form */}
      <footer className="bg-zinc-900/90 border-t border-zinc-800 p-2 sm:p-3 landscape:p-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shrink-0 backdrop-blur-md">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Emoji Toggle Button */}
          <button
            type="button"
            disabled={!isAcceptedFriend}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={cn(
              'p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer shrink-0',
              !isAcceptedFriend
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                : showEmojiPicker
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
            )}
            title={!isAcceptedFriend ? 'Chat locked: Waiting for request acceptance' : 'Emoji Picker'}
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Text Input (Supports full keyboard, any unicode, language, symbols) */}
          <input
            ref={inputRef}
            type="text"
            disabled={!isAcceptedFriend}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              !isAcceptedFriend
                ? 'Chat is locked until friend request is accepted...'
                : `Message ${activeFriend.name}... (full keyboard & emojis)`
            }
            className={cn(
              'flex-1 min-w-0 border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-sans shadow-inner touch-manipulation',
              isAcceptedFriend
                ? 'bg-zinc-950 border-white/15 focus:border-amber-400 focus:outline-none text-white placeholder:text-zinc-500'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 placeholder:text-zinc-600 cursor-not-allowed'
            )}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!isAcceptedFriend || !inputText.trim()}
            className={cn(
              'p-2 sm:p-2.5 rounded-xl font-black transition-all cursor-pointer shrink-0 flex items-center justify-center',
              isAcceptedFriend && inputText.trim()
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow active:scale-95'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
            )}
            title={!isAcceptedFriend ? 'Friend request pending' : 'Send Message (Enter)'}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
};
