import { create } from 'zustand';
import { GameStateClientView, CardFlightEvent } from '@/lib/types';
import { getSocket, resolveBackendUrl } from '@/socket/client';
import { getOrCreateSessionId, saveProfile, getSavedProfile } from '@/lib/utils';
import { sounds } from '@/lib/sound';
import { ThrownItemEvent, ThrowableType } from '@/lib/throwables';
import { playSoundboardAudio } from '@/lib/soundboard';

// Deduplication cache to prevent duplicate playback on socket reconnections or rapid events
const recentSoundboardPlays = new Map<string, number>();

interface ToastData {
  id: number;
  text: string;
  type: 'info' | 'error' | 'success';
}

interface GameStore {
  gameState: GameStateClientView | null;
  roomCode: string;
  myName: string;
  myAvatar: string;
  isConnected: boolean;
  isPenaltyModalOpen: boolean;
  isRulesModalOpen: boolean;
  toast: ToastData | null;
  activeThrowables: ThrownItemEvent[];
  activeImpacts: Record<string, { itemType: ThrowableType; id: string }>;
  isSoundboardOpen: boolean;
  activeSoundboardDecals: Record<string, { label: string; emoji: string; id: string; timestamp: number }>;
  activeCardFlights: CardFlightEvent[];

  // Actions
  initSocketListeners: () => void;
  setProfile: (name: string, avatar: string) => void;
  setPenaltyModalOpen: (open: boolean) => void;
  setRulesModalOpen: (open: boolean) => void;
  showToast: (text: string, type?: 'info' | 'error' | 'success') => void;
  
  createRoom: (name: string, avatar: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  joinRoom: (code: string, name: string, avatar: string) => Promise<{ success: boolean; error?: string }>;
  startGame: () => void;
  drawCard: () => void;
  placeCenter: (targetDeckId?: number | any, fromRightDeck?: boolean) => void;
  placeRightDeck: (targetPlayerId: string, fromRightDeck?: boolean) => void;
  passTurn: () => void;
  requestPenalty: (targetPlayerId: string, reason: 'MISSED_CENTER' | 'WRONG_CARD_PLAYED' | 'INVALID_SEQUENCE') => Promise<{ success: boolean; error?: string }>;
  kickPlayer: (targetPlayerId: string) => void;
  playAgain: () => void;
  leaveRoom: () => void;

  // Card Flight Animations
  removeCardFlight: (id: string) => void;

  // Throwables Actions
  throwItem: (targetPlayerId: string, itemType: ThrowableType) => void;
  removeThrowable: (id: string) => void;
  triggerImpact: (targetPlayerId: string, itemType: ThrowableType) => void;
  clearImpact: (targetPlayerId: string) => void;

  // Soundboard Actions
  setSoundboardOpen: (open: boolean) => void;
  triggerSoundboard: (clip: { soundId: string; label: string; emoji: string; audioUrl?: string; fallbackSynth?: string; speechText?: string }) => void;
}

const saved = getSavedProfile();

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  roomCode: '',
  myName: saved.name || '',
  myAvatar: saved.avatarColor || '#e11d48',
  isConnected: false,
  isPenaltyModalOpen: false,
  isRulesModalOpen: false,
  toast: null,
  activeThrowables: [],
  activeImpacts: {},
  isSoundboardOpen: false,
  activeSoundboardDecals: {},
  activeCardFlights: [],

  removeCardFlight: (id: string) => {
    set((prev) => ({
      activeCardFlights: prev.activeCardFlights.filter((f) => f.id !== id),
    }));
  },

  setProfile: (name, avatar) => {
    saveProfile(name, avatar);
    set({ myName: name, myAvatar: avatar });
  },

  setPenaltyModalOpen: (open) => set({ isPenaltyModalOpen: open }),
  setRulesModalOpen: (open) => set({ isRulesModalOpen: open }),
  setSoundboardOpen: (open) => set({ isSoundboardOpen: open }),

  showToast: (text, type = 'info') => {
    const id = Date.now();
    set({ toast: { id, text, type } });
    setTimeout(() => {
      if (get().toast?.id === id) {
        set({ toast: null });
      }
    }, 4000);
  },

  initSocketListeners: () => {
    const bindListeners = (s: any) => {
      s.off('syncState');
      s.off('connect');
      s.off('disconnect');
      s.off('connect_error');
      s.off('item_thrown');
      s.off('soundboard_played');
      s.off('card_played');

      // Set current connection status immediately
      set({ isConnected: s.connected });

      s.on('connect', () => {
        set({ isConnected: true });
      });

      s.on('disconnect', () => {
        set({ isConnected: false });
      });

      s.on('connect_error', (err: any) => {
        set({ isConnected: false });
        console.warn('Socket connection error:', err.message);
      });

      // Listen for real-time card flight animations across the table
      s.on('card_played', (flight: CardFlightEvent) => {
        sounds.playCardSlide();
        set((prev) => ({
          activeCardFlights: [...prev.activeCardFlights, flight],
        }));
      });

      // Listen for real-time throwables across the table
      s.on('item_thrown', (item: ThrownItemEvent) => {
        sounds.playThrowWhoosh();
        set((prev) => ({
          activeThrowables: [...prev.activeThrowables, item],
        }));
      });

      // Listen for real-time soundboard meme audio across the room
      s.on('soundboard_played', (data: {
        id: string;
        senderId: string;
        senderSessionId?: string;
        senderName: string;
        soundId: string;
        label: string;
        emoji: string;
        audioUrl?: string;
        fallbackSynth?: string;
        speechText?: string;
        timestamp: number;
      }) => {
        const now = Date.now();
        // Ignore stale events (>8s old) or duplicate packets already handled
        if (data.timestamp && now - data.timestamp > 8000) return;
        if (data.id && recentSoundboardPlays.has(data.id)) return;
        if (data.id) {
          recentSoundboardPlays.set(data.id, now);
          // Purge records older than 20 seconds
          if (recentSoundboardPlays.size > 50) {
            for (const [key, time] of recentSoundboardPlays.entries()) {
              if (now - time > 20000) recentSoundboardPlays.delete(key);
            }
          }
        }

        // Only play if NOT the sender (sender already played it immediately upon tap!)
        const myPlayerId = get().gameState?.myPlayerId;
        const mySessionId = getOrCreateSessionId();
        const isSender = (data.senderId === myPlayerId) ||
                         (data.senderId === s.id) ||
                         (!!data.senderSessionId && data.senderSessionId === mySessionId);

        if (!isSender) {
          playSoundboardAudio(data.audioUrl || '', data.fallbackSynth);
        }

        const decalId = data.id || `${Date.now()}`;
        set((prev) => ({
          activeSoundboardDecals: {
            ...prev.activeSoundboardDecals,
            [data.senderId]: {
              label: data.label,
              emoji: data.emoji,
              id: decalId,
              timestamp: data.timestamp,
            },
          },
        }));

        setTimeout(() => {
          set((prev) => {
            if (prev.activeSoundboardDecals[data.senderId]?.id === decalId) {
              const copy = { ...prev.activeSoundboardDecals };
              delete copy[data.senderId];
              return { activeSoundboardDecals: copy };
            }
            return prev;
          });
        }, 3800);
      });

      s.on('syncState', (state: GameStateClientView) => {
        const currentRoomCode = get().roomCode;

        // Isolate room state: Drop updates for rooms the client is not in
        if (currentRoomCode && state.roomCode !== currentRoomCode) {
          return;
        }

        const prevState = get().gameState;

        // Detect sounds and transitions
        if (prevState) {
          // Sound on card draw (for self or any opponent)
          const hadFloating = (prevState.myFloatingCard !== null) || prevState.players.some(p => p.hasFloatingCard || !!p.floatingCard);
          const hasFloating = (state.myFloatingCard !== null) || state.players.some(p => p.hasFloatingCard || !!p.floatingCard);
          if (!hadFloating && hasFloating) {
            sounds.playCardFlip();
          }

          // Sound on center placement
          if (state.centerCard && prevState.centerCard?.id !== state.centerCard.id) {
            sounds.playCardSlide();
          }

          // Sound on Bazaar Open for this player
          const prevMe = prevState.players.find(p => p.id === state.myPlayerId);
          const currMe = state.players.find(p => p.id === state.myPlayerId);
          if (currMe?.isBazaarOpen && !prevMe?.isBazaarOpen) {
            sounds.playBazaarOpen();
          }

          // Sound on penalty triggered
          if (!prevState.activePenaltyAnimation && state.activePenaltyAnimation) {
            sounds.playPenalty();
          }

          // Sound on Game Over
          if (prevState.status !== 'GAME_OVER' && state.status === 'GAME_OVER') {
            sounds.playVictory();
          }
        }

        set({ gameState: state, roomCode: state.roomCode });
      });
    };

    const initialSocket = getSocket();
    bindListeners(initialSocket);

    // If backend URL resolves to Render via /api/socket-url fallback, re-bind to the remote socket
    resolveBackendUrl().then((url) => {
      const remoteSocket = getSocket(url);
      bindListeners(remoteSocket);
    });
  },

  createRoom: (name, avatar) => {
    return new Promise(async (resolve) => {
      await resolveBackendUrl();
      const socket = getSocket();
      const sessionId = getOrCreateSessionId();
      get().setProfile(name, avatar);

      let settled = false;

      // 25-second fail-safe timeout prevents infinite loading while allowing Render cold starts
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
          const errMsg = isVercel
            ? 'Game server not responding. If using Render free tier, the backend can take ~30-50s to wake up from sleep. Please wait a moment and try again.'
            : 'Connection timeout: Game server did not respond. Please ensure the backend server is running.';
          get().showToast(errMsg, 'error');
          resolve({ success: false, error: errMsg });
        }
      }, 25000);

      const doEmit = () => {
        socket.emit('createRoom', { name, avatarColor: avatar, sessionId }, (res: any) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);

          if (res && res.success) {
            set({ gameState: res.state, roomCode: res.roomCode });
            resolve({ success: true, code: res.roomCode });
          } else {
            const errMsg = res?.error || 'Failed to create room';
            get().showToast(errMsg, 'error');
            resolve({ success: false, error: errMsg });
          }
        });
      };

      if (socket.connected) {
        doEmit();
      } else {
        socket.connect();
        socket.once('connect', doEmit);
      }
    });
  },

  joinRoom: (code, name, avatar) => {
    return new Promise(async (resolve) => {
      await resolveBackendUrl();
      const socket = getSocket();
      const sessionId = getOrCreateSessionId();
      get().setProfile(name, avatar);

      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
          const errMsg = isVercel
            ? 'Game server not responding. If using Render free tier, the backend can take ~30-50s to wake up from sleep. Please wait a moment and try again.'
            : 'Connection timeout: Game server did not respond. Please ensure the backend server is running.';
          get().showToast(errMsg, 'error');
          resolve({ success: false, error: errMsg });
        }
      }, 25000);

      const doEmit = () => {
        socket.emit('joinRoom', { roomCode: code.toUpperCase(), name, avatarColor: avatar, sessionId }, (res: any) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);

          if (res && res.success) {
            set({ gameState: res.state, roomCode: res.roomCode });
            resolve({ success: true });
          } else {
            const errMsg = res?.error || 'Failed to join room';
            get().showToast(errMsg, 'error');
            resolve({ success: false, error: errMsg });
          }
        });
      };

      if (socket.connected) {
        doEmit();
      } else {
        socket.connect();
        socket.once('connect', doEmit);
      }
    });
  },

  startGame: () => {
    const socket = getSocket();
    const { roomCode } = get();
    socket.emit('startGame', { roomCode }, (res: any) => {
      if (!res.success) {
        get().showToast(res.error || 'Could not start game', 'error');
      } else {
        sounds.playCardSlide();
      }
    });
  },

  drawCard: () => {
    const socket = getSocket();
    const { roomCode } = get();
    socket.emit('drawCard', { roomCode }, (res: any) => {
      if (!res.success) {
        get().showToast(res.error || 'Cannot draw card', 'error');
      } else {
        sounds.playCardFlip();
      }
    });
  },

  placeCenter: (targetDeckId?: number | any, fromRightDeck?: boolean) => {
    const socket = getSocket();
    const { roomCode } = get();
    const resolvedDeckId = typeof targetDeckId === 'number' ? targetDeckId : (!isNaN(Number(targetDeckId)) ? Number(targetDeckId) : undefined);
    socket.emit('placeCenter', { roomCode, targetDeckId: resolvedDeckId, fromRightDeck }, (res: any) => {
      if (!res.success) {
        get().showToast(res.error || 'Invalid move on center', 'error');
      } else if (res.autoPenalized) {
        sounds.playPenalty();
        get().showToast(`🚨 AUTO PENALTY: ${res.reason || 'Wrong card placed in Center!'}`, 'error');
      } else {
        sounds.playCardSlide();
        if (res.openedBazaar) {
          get().showToast('🌟 BAZAAR OPEN! You can now place on opponents!', 'success');
        } else {
          get().showToast('✅ Valid play! Your turn continues!', 'success');
        }
      }
    });
  },

  placeRightDeck: (targetPlayerId: string, fromRightDeck?: boolean) => {
    const socket = getSocket();
    const { roomCode, gameState } = get();
    const isSelf = targetPlayerId === gameState?.myPlayerId;
    socket.emit('placeRightDeck', { roomCode, targetPlayerId, fromRightDeck }, (res: any) => {
      if (!res.success) {
        get().showToast(res.error || 'Invalid move on right deck', 'error');
      } else if (res.autoPenalized) {
        sounds.playPenalty();
        get().showToast(`🚨 AUTO PENALTY: ${res.reason || 'Missed Center or illegal placement!'}`, 'error');
      } else {
        sounds.playCardSlide();
        if (!isSelf) {
          get().showToast('✅ Placed on opponent! Your turn continues!', 'success');
        }
      }
    });
  },

  passTurn: () => {
    const socket = getSocket();
    const { roomCode } = get();
    socket.emit('passTurn', { roomCode }, (res: any) => {
      if (!res.success) {
        get().showToast(res.error || 'Cannot pass turn', 'error');
      }
    });
  },

  requestPenalty: (targetPlayerId, reason) => {
    return new Promise((resolve) => {
      const socket = getSocket();
      const { roomCode } = get();

      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          get().showToast('Penalty call timed out. Server did not respond.', 'error');
          resolve({ success: false, error: 'Timeout' });
        }
      }, 7000);

      socket.emit('requestPenalty', { roomCode, targetPlayerId, reason }, (res: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        if (!res || !res.success) {
          const err = res?.error || 'Could not call penalty';
          get().showToast(err, 'error');
          resolve({ success: false, error: err });
        } else {
          set({ isPenaltyModalOpen: false });
          if (res.result?.isValid) {
            get().showToast(`🚨 PENALTY UPHELD! ${res.result.targetName} received ${res.result.cardsTransferred} cards!`, 'success');
          } else {
            get().showToast(`❌ FALSE ACCUSATION! You received ${res.result?.cardsTransferred} penalty cards!`, 'error');
          }
          resolve({ success: true });
        }
      });
    });
  },

  kickPlayer: (targetPlayerId: string) => {
    const socket = getSocket();
    const { roomCode } = get();
    socket.emit('kickPlayer', { roomCode, targetPlayerId }, (res: any) => {
      if (!res.success) {
        get().showToast(res.error || 'Failed to kick player', 'error');
      }
    });
  },

  playAgain: () => {
    const socket = getSocket();
    const { roomCode } = get();
    socket.emit('playAgain', { roomCode }, (res: any) => {
      if (!res.success) {
        get().showToast(res.error || 'Could not restart match', 'error');
      }
    });
  },

  leaveRoom: () => {
    const socket = getSocket();
    const { roomCode } = get();
    if (roomCode) {
      socket.emit('leaveRoom', { roomCode }, () => {});
    }
    set({
      gameState: null,
      roomCode: '',
      isPenaltyModalOpen: false,
      isRulesModalOpen: false,
    });
  },

  // ==========================================
  // Desi Virtual Throwables Actions
  // ==========================================
  throwItem: (targetPlayerId: string, itemType: ThrowableType) => {
    const { gameState, roomCode } = get();
    const myPlayerId = gameState?.myPlayerId;
    if (!roomCode || !myPlayerId) return;

    const socket = getSocket();
    socket.emit('throw_item', {
      roomCode,
      fromPlayerId: myPlayerId,
      toPlayerId: targetPlayerId,
      itemType,
    });
  },

  removeThrowable: (id: string) => {
    set((prev) => ({
      activeThrowables: prev.activeThrowables.filter((t) => t.id !== id),
    }));
  },

  triggerImpact: (targetPlayerId: string, itemType: ThrowableType) => {
    const impactId = `${Date.now()}-${Math.random()}`;
    set((prev) => ({
      activeImpacts: {
        ...prev.activeImpacts,
        [targetPlayerId]: { itemType, id: impactId },
      },
    }));

    // Trigger designated synthesized impact audio
    if (itemType === 'chappal') sounds.playChappalSlap();
    else if (itemType === 'chai') sounds.playChaiSplash();
    else if (itemType === 'tomato') sounds.playTomatoSquish();
    else if (itemType === 'cash') sounds.playCashChime();
    else if (itemType === 'rose') sounds.playRoseChime();

    // Auto-clear impact decal after 2.8 seconds
    setTimeout(() => {
      set((prev) => {
        if (prev.activeImpacts[targetPlayerId]?.id === impactId) {
          const copy = { ...prev.activeImpacts };
          delete copy[targetPlayerId];
          return { activeImpacts: copy };
        }
        return prev;
      });
    }, 2800);
  },

  clearImpact: (targetPlayerId: string) => {
    set((prev) => {
      const copy = { ...prev.activeImpacts };
      delete copy[targetPlayerId];
      return { activeImpacts: copy };
    });
  },

  // ==========================================
  // Desi Soundboard Actions
  // ==========================================
  triggerSoundboard: (clip) => {
    const currentCode = get().roomCode || get().gameState?.roomCode;
    if (!currentCode) return;
    const socket = getSocket();
    socket.emit('play_soundboard', {
      roomCode: currentCode,
      soundId: clip.soundId,
      label: clip.label,
      emoji: clip.emoji,
      audioUrl: clip.audioUrl,
      fallbackSynth: clip.fallbackSynth,
      speechText: clip.speechText,
      sessionId: getOrCreateSessionId(),
    });
  },
}));
