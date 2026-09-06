'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Sparkles, Music, Flame, Globe, Play, Check, AlertCircle, Search } from 'lucide-react';
import { DESI_SOUNDBOARD_CLIPS, SoundboardClip, playSoundboardAudio } from '@/lib/soundboard';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';

type TabType = 'all' | 'bollywood' | 'viral' | 'beats' | 'custom';

export const DesiSoundboardModal: React.FC = () => {
  const isOpen = useGameStore((s) => s.isSoundboardOpen);
  const setOpen = useGameStore((s) => s.setSoundboardOpen);
  const triggerSoundboard = useGameStore((s) => s.triggerSoundboard);

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [recentlyPlayedId, setRecentlyPlayedId] = useState<string | null>(null);

  // Custom audio link inputs
  const [customUrl, setCustomUrl] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customEmoji, setCustomEmoji] = useState('📢');
  const [customTestStatus, setCustomTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Handle anti-spam cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 100));
    }, 100);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const handlePlayClip = (clip: SoundboardClip) => {
    if (cooldownRemaining > 0) return;

    // 1. Play audio locally IMMEDIATELY within user click stack (bypasses browser autoplay block!)
    playSoundboardAudio(clip.audioUrl, clip.fallbackSynth);

    // 2. Broadcast to room via socket for other players
    triggerSoundboard({
      soundId: clip.id,
      label: clip.label,
      emoji: clip.emoji,
      audioUrl: clip.audioUrl,
      fallbackSynth: clip.fallbackSynth,
    });

    setRecentlyPlayedId(clip.id);
    setCooldownRemaining(1500); // 1.5s room rate limit

    // Auto-close soundboard immediately on click so player returns to table without manual 'X' tap
    setOpen(false);

    setTimeout(() => {
      setRecentlyPlayedId((prev) => (prev === clip.id ? null : prev));
    }, 1800);
  };

  const handleTestCustomUrl = () => {
    if (!customUrl.trim()) return;
    setCustomTestStatus('testing');
    playSoundboardAudio(customUrl.trim(), 'horn');
    setCustomTestStatus('success');
    setTimeout(() => setCustomTestStatus('idle'), 3000);
  };

  const handleBroadcastCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || cooldownRemaining > 0) return;

    // Play locally immediately
    playSoundboardAudio(customUrl.trim(), 'horn');

    triggerSoundboard({
      soundId: `custom-${Date.now()}`,
      label: customLabel.trim() || 'Custom Meme',
      emoji: customEmoji || '📢',
      audioUrl: customUrl.trim(),
      fallbackSynth: 'horn',
    });

    setCooldownRemaining(1500);
    setCustomUrl('');
    setCustomLabel('');

    // Auto-close soundboard immediately on broadcast
    setOpen(false);
  };

  if (!isOpen) return null;

  const bollywoodCount = DESI_SOUNDBOARD_CLIPS.filter((c) => c.category === 'bollywood').length;
  const viralCount = DESI_SOUNDBOARD_CLIPS.filter((c) => c.category === 'viral').length;
  const beatsCount = DESI_SOUNDBOARD_CLIPS.filter((c) => c.category === 'beats').length;

  const filteredClips = DESI_SOUNDBOARD_CLIPS.filter((c) => {
    const matchesTab = activeTab === 'all' || c.category === activeTab;
    if (!matchesTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.label.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q);
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        {/* Modal Backdrop click */}
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpen(false)}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-lg bg-zinc-950/95 border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 shrink-0">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center text-black shadow-md shadow-amber-500/30 shrink-0">
                <Volume2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs sm:text-base font-black text-white tracking-wide truncate">
                    Desi Soundboard
                  </h2>
                  <span className="px-1 sm:px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] sm:text-[9px] font-bold uppercase shrink-0">
                    Live Table
                  </span>
                </div>
                <p className="text-[9px] sm:text-[11px] text-zinc-400 truncate hidden xs:block">
                  Plays in crisp audio for everyone at the table!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1">
              {/* Cooldown Ring */}
              {cooldownRemaining > 0 && (
                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] sm:text-[10px] font-bold text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>{(cooldownRemaining / 1000).toFixed(1)}s</span>
                </div>
              )}

              <button
                onClick={() => setOpen(false)}
                className="p-1 sm:p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Close Soundboard"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Category Tabs */}
          <div className="flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 border-b border-zinc-800/80 bg-black/40 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                activeTab === 'all'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              )}
            >
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>All ({DESI_SOUNDBOARD_CLIPS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('bollywood')}
              className={cn(
                'flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                activeTab === 'bollywood'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              )}
            >
              <span>🎭 Bollywood ({bollywoodCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('viral')}
              className={cn(
                'flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                activeTab === 'viral'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              )}
            >
              <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Viral Hits ({viralCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('beats')}
              className={cn(
                'flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                activeTab === 'beats'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              )}
            >
              <Music className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Beats ({beatsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={cn(
                'flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                activeTab === 'custom'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              )}
            >
              <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Paste MP3 Link</span>
            </button>
          </div>

          {/* Quick Search Input */}
          {activeTab !== 'custom' && (
            <div className="px-2.5 sm:px-4 pt-2 pb-1 border-b border-zinc-800/60 bg-black/25 shrink-0">
              <div className="relative">
                <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${DESI_SOUNDBOARD_CLIPS.length} real meme dialogues (e.g. Akshay, Daya, Pushpa)...`}
                  className="w-full pl-7 sm:pl-8 pr-7 py-1 rounded-xl bg-zinc-900/90 border border-white/10 focus:border-amber-400 focus:outline-none text-[10px] sm:text-xs text-white placeholder:text-zinc-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 p-2 sm:p-4 overflow-y-auto min-h-0">
            {activeTab !== 'custom' ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-1.5 sm:gap-2.5">
                {filteredClips.map((clip) => {
                  const isPlaying = recentlyPlayedId === clip.id;
                  const isDisabled = cooldownRemaining > 0;

                  return (
                    <motion.button
                      key={clip.id}
                      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                      whileTap={{ scale: isDisabled ? 1 : 0.96 }}
                      onClick={() => handlePlayClip(clip)}
                      disabled={isDisabled}
                      className={cn(
                        'group relative flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none',
                        isPlaying
                          ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/30'
                          : isDisabled
                          ? 'bg-zinc-900/40 border-zinc-800/60 opacity-60 cursor-not-allowed'
                          : 'bg-zinc-900/80 hover:bg-zinc-800/90 border-white/10 hover:border-amber-500/40 shadow-sm'
                      )}
                    >
                      {/* Emoji Icon Badge */}
                      <div
                        className={cn(
                          'w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-base sm:text-xl shrink-0 transition-transform',
                          isPlaying ? 'scale-110 rotate-6' : 'group-hover:scale-105',
                          clip.category === 'bollywood'
                            ? 'bg-amber-500/15 border border-amber-500/30'
                            : clip.category === 'viral'
                            ? 'bg-rose-500/15 border border-rose-500/30'
                            : 'bg-indigo-500/15 border border-indigo-500/30'
                        )}
                      >
                        {clip.emoji}
                      </div>

                      {/* Clip Info */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="font-extrabold text-[11px] xs:text-xs sm:text-sm text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
                          {clip.label}
                        </div>
                        <div className="text-[8px] sm:text-[10px] text-zinc-400 truncate">
                          {clip.subtitle}
                        </div>
                      </div>

                      {/* Play Action Icon */}
                      <div className="shrink-0 text-zinc-400 group-hover:text-amber-400 transition-colors">
                        {isPlaying ? (
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-3 bg-amber-400 rounded-full animate-pulse" />
                            <span className="w-1 h-4 bg-amber-400 rounded-full animate-pulse delay-75" />
                            <span className="w-1 h-2 bg-amber-400 rounded-full animate-pulse delay-150" />
                          </div>
                        ) : (
                          <Play className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 fill-current" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              /* Custom Meme Audio Link Player */
              <div className="flex flex-col gap-3 py-1">
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Real Internet Meme Audio:</span>
                    <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                      You can paste ANY direct audio link (.mp3, .wav, .aac) from Discord,
                      MyInstants, GitHub Raw, Google Drive, or Cloudinary. It will play
                      for everyone at the table instantly!
                    </p>
                  </div>
                </div>

                <form onSubmit={handleBroadcastCustom} className="flex flex-col gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Audio Link (Direct MP3 URL)
                    </label>
                    <input
                      type="url"
                      required
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://example.com/memes/paisa-hi-paisa.mp3"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 focus:border-amber-400 focus:outline-none text-xs text-white placeholder:text-zinc-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                        Meme Dialogue / Title
                      </label>
                      <input
                        type="text"
                        maxLength={35}
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        placeholder="e.g. Jalwa Hai Hamara"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 focus:border-amber-400 focus:outline-none text-xs text-white placeholder:text-zinc-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                        Emoji
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        value={customEmoji}
                        onChange={(e) => setCustomEmoji(e.target.value)}
                        placeholder="😎"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 focus:border-amber-400 focus:outline-none text-xs text-white text-center"
                      />
                    </div>
                  </div>

                  {/* Actions: Test & Broadcast */}
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={handleTestCustomUrl}
                      disabled={!customUrl.trim() || customTestStatus === 'testing'}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-white/10 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {customTestStatus === 'testing' ? (
                        <span>Playing Test...</span>
                      ) : customTestStatus === 'success' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Link Works!</span>
                        </>
                      ) : customTestStatus === 'error' ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          <span>Invalid URL</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Test Audio</span>
                        </>
                      )}
                    </button>

                    <button
                      type="submit"
                      disabled={!customUrl.trim() || cooldownRemaining > 0}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black text-xs font-black uppercase tracking-wide shadow-gold-glow transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Play to Table</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 sm:px-5 py-2 sm:py-2.5 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between text-[10px] text-zinc-500 shrink-0">
            <span>💡 Tap any sound to broadcast to table</span>
            <span>1.5s Anti-Spam Protected</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
