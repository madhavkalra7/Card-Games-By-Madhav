'use client';

import React from 'react';
import { useVoiceStore } from '@/store/voiceStore';
import { useGameStore } from '@/store/gameStore';
import { voiceManager } from '@/lib/voice/voiceManager';
import { Mic, MicOff, Headphones, VolumeX, PhoneOff, Radio, Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceControlsProps {
  roomCode: string;
  className?: string;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({ roomCode, className }) => {
  const { isInVoice, isConnecting, isMicMuted, isDeafened, speakingPeers, error } = useVoiceStore();
  const setSoundboardOpen = useGameStore((s) => s.setSoundboardOpen);

  const isMeSpeaking = !!speakingPeers['me'];

  const handleJoin = () => {
    voiceManager.joinVoice(roomCode);
  };

  const handleLeave = () => {
    voiceManager.leaveVoice();
  };

  const handleToggleMute = () => {
    voiceManager.toggleMute();
  };

  const handleToggleDeafen = () => {
    voiceManager.toggleDeafen();
  };

  if (!isInVoice) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <button
          onClick={handleJoin}
          disabled={isConnecting}
          title={error || 'Join Table Voice Chat'}
          className={cn(
            'flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider transition-all shadow-md',
            isConnecting
              ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
              : 'bg-black/70 backdrop-blur-md border border-emerald-500/50 text-emerald-300 hover:bg-emerald-950/60 hover:border-emerald-400 active:scale-95'
          )}
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Join Voice</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 bg-black/75 backdrop-blur-md px-1.5 py-1 rounded-full border border-emerald-500/40 shadow-lg', className)}>
      {/* Microphone Mute / Unmute Button */}
      <button
        onClick={handleToggleMute}
        title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
        className={cn(
          'p-1 sm:p-1.5 rounded-full transition-all active:scale-90',
          isMicMuted
            ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
            : isMeSpeaking
            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/50 scale-105 animate-pulse'
            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
        )}
      >
        {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
      </button>

      {/* Speaker Deafen / Undeafen Button */}
      <button
        onClick={handleToggleDeafen}
        title={isDeafened ? 'Undeafen Voice' : 'Deafen (Mute Incoming Audio)'}
        className={cn(
          'p-1 sm:p-1.5 rounded-full transition-all active:scale-90',
          isDeafened
            ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
            : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white'
        )}
      >
        {isDeafened ? <VolumeX className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
      </button>

      {/* Quick Desi Soundboard Button */}
      <button
        onClick={() => setSoundboardOpen(true)}
        title="Real-Time Desi Soundboard"
        className="p-1 sm:p-1.5 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 border border-amber-500/40 transition-all active:scale-90"
      >
        <Volume2 className="w-3.5 h-3.5 text-amber-300" />
      </button>

      {/* Disconnect / Leave Voice Button */}
      <button
        onClick={handleLeave}
        title="Leave Voice Chat"
        className="p-1 sm:p-1.5 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-all active:scale-90"
      >
        <PhoneOff className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
