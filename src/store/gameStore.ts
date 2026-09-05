import { create } from 'zustand';
import { GameStateClientView } from '@/lib/types';
import { getSocket, resolveBackendUrl } from '@/socket/client';
import { getOrCreateSessionId, saveProfile, getSavedProfile } from '@/lib/utils';
import { sounds } from '@/lib/sound';

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

  setProfile: (name, avatar) => {
    saveProfile(name, avatar);
    set({ myName: name, myAvatar: avatar });
  },

  setPenaltyModalOpen: (open) => set({ isPenaltyModalOpen: open }),
  setRulesModalOpen: (open) => set({ isRulesModalOpen: open }),

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

      s.on('syncState', (state: GameStateClientView) => {
        const prevState = get().gameState;

        // Detect sounds and transitions
        if (prevState) {
          // Sound on card draw
          if (!prevState.myFloatingCard && state.myFloatingCard) {
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
}));
