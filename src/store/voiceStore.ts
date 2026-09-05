import { create } from 'zustand';

export interface PeerVoiceState {
  peerId: string;
  isMuted: boolean;
  isDeafened: boolean;
}

export interface VoiceStore {
  isInVoice: boolean;
  isConnecting: boolean;
  isMicMuted: boolean;
  isDeafened: boolean;
  speakingPeers: Record<string, boolean>; // key: peerId or 'me', val: boolean
  peerStates: Record<string, PeerVoiceState>; // key: peerId
  error: string | null;

  setIsInVoice: (inVoice: boolean) => void;
  setIsConnecting: (connecting: boolean) => void;
  setIsMicMuted: (muted: boolean) => void;
  setIsDeafened: (deafened: boolean) => void;
  setPeerSpeaking: (peerId: string, isSpeaking: boolean) => void;
  setPeerState: (peerId: string, state: Partial<PeerVoiceState>) => void;
  removePeer: (peerId: string) => void;
  setError: (error: string | null) => void;
  resetVoiceState: () => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  isInVoice: false,
  isConnecting: false,
  isMicMuted: false,
  isDeafened: false,
  speakingPeers: {},
  peerStates: {},
  error: null,

  setIsInVoice: (isInVoice) => set({ isInVoice }),
  setIsConnecting: (isConnecting) => set({ isConnecting }),
  setIsMicMuted: (isMicMuted) => set({ isMicMuted }),
  setIsDeafened: (isDeafened) => set({ isDeafened }),

  setPeerSpeaking: (peerId, isSpeaking) =>
    set((state) => {
      if (state.speakingPeers[peerId] === isSpeaking) return state;
      return {
        speakingPeers: {
          ...state.speakingPeers,
          [peerId]: isSpeaking,
        },
      };
    }),

  setPeerState: (peerId, updated) =>
    set((state) => {
      const existing = state.peerStates[peerId] || { peerId, isMuted: false, isDeafened: false };
      return {
        peerStates: {
          ...state.peerStates,
          [peerId]: { ...existing, ...updated },
        },
      };
    }),

  removePeer: (peerId) =>
    set((state) => {
      const { [peerId]: _, ...restPeers } = state.peerStates;
      const { [peerId]: __, ...restSpeaking } = state.speakingPeers;
      return {
        peerStates: restPeers,
        speakingPeers: restSpeaking,
      };
    }),

  setError: (error) => set({ error }),

  resetVoiceState: () =>
    set({
      isInVoice: false,
      isConnecting: false,
      speakingPeers: {},
      peerStates: {},
      error: null,
    }),
}));
