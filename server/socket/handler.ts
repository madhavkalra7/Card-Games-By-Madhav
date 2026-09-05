import { Server as SocketIOServer, Socket } from 'socket.io';
import { DukkiBazaarRoom } from '../game/engine';
import { RoomModel } from '../db';

const activeRooms = new Map<string, DukkiBazaarRoom>();
const disconnectTimers = new Map<string, NodeJS.Timeout>();

interface VoiceParticipant {
  socketId: string;
  isMuted: boolean;
  isDeafened: boolean;
}

const voiceRooms = new Map<string, Map<string, VoiceParticipant>>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude ambiguous chars like I, O, 0, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function setupSocketHandlers(io: SocketIOServer) {
  function broadcastRoomState(room: DukkiBazaarRoom) {
    for (const player of room.players) {
      if (player.isConnected) {
        const clientView = room.getClientView(player.id);
        io.to(player.id).emit('syncState', clientView);
      }
    }
  }

  io.on('connection', (socket: Socket) => {
    let currentRoomCode: string | null = null;
    let playerSessionId: string | null = null;

    socket.on('createRoom', async (data: { name: string; avatarColor: string; sessionId: string }, callback) => {
      try {
        let code = generateRoomCode();
        while (activeRooms.has(code)) {
          code = generateRoomCode();
        }

        const room = new DukkiBazaarRoom(code, () => {
          broadcastRoomState(room);
        });

        const player = room.addPlayer({
          id: socket.id,
          sessionId: data.sessionId,
          name: data.name,
          avatarColor: data.avatarColor,
        });

        activeRooms.set(code, room);
        currentRoomCode = code;
        playerSessionId = data.sessionId;

        socket.join(code);

        // Record room in MongoDB
        try {
          await RoomModel.create({
            code,
            hostId: player.sessionId,
            status: 'LOBBY',
            gameType: 'DUKKI_BAZAAR',
            maxPlayers: 5,
          });
        } catch (dbErr) {
          // Non-blocking if MongoDB is offline or connecting
          console.warn("MongoDB Room record skipped:", dbErr);
        }

        callback({ success: true, roomCode: code, state: room.getClientView(socket.id) });
        broadcastRoomState(room);
      } catch (err: any) {
        callback({ success: false, error: err.message || 'Failed to create room' });
      }
    });

    socket.on('joinRoom', async (data: { roomCode: string; name: string; avatarColor: string; sessionId: string }, callback) => {
      try {
        const code = data.roomCode.trim().toUpperCase();
        const room = activeRooms.get(code);

        if (!room) {
          return callback({ success: false, error: 'Room not found. Check the 6-character code.' });
        }

        // Cancel any pending 60s disconnect timer for this session
        const timerKey = `${code}:${data.sessionId}`;
        if (disconnectTimers.has(timerKey)) {
          clearTimeout(disconnectTimers.get(timerKey)!);
          disconnectTimers.delete(timerKey);
        }

        // Check if player is reconnecting
        const reconnected = room.reconnectPlayer(data.sessionId, socket.id);
        if (!reconnected) {
          // New player joining
          room.addPlayer({
            id: socket.id,
            sessionId: data.sessionId,
            name: data.name,
            avatarColor: data.avatarColor,
          });
        }

        if (currentRoomCode && currentRoomCode !== code) {
          socket.leave(currentRoomCode);
        }

        currentRoomCode = code;
        playerSessionId = data.sessionId;

        socket.join(code);
        callback({ success: true, roomCode: code, state: room.getClientView(socket.id) });
        broadcastRoomState(room);
      } catch (err: any) {
        callback({ success: false, error: err.message || 'Failed to join room' });
      }
    });

    socket.on('startGame', (data: { roomCode: string }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const res = room.startGame(socket.id);
      if (res.success) {
        broadcastRoomState(room);
      }
      callback(res);
    });

    socket.on('drawCard', (data: { roomCode: string }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const res = room.drawCard(socket.id);
      if (res.success) {
        broadcastRoomState(room);
      }
      callback(res);
    });

    socket.on('placeCenter', (data: { roomCode: string; targetDeckId?: number; targetSuit?: any; fromRightDeck?: boolean }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const targetDeckId = typeof data.targetDeckId === 'number' ? data.targetDeckId : (typeof data.targetSuit === 'number' ? data.targetSuit : undefined);
      const res = room.placeOnCenter(socket.id, targetDeckId, data.fromRightDeck);
      if (res.success) {
        broadcastRoomState(room);
      }
      callback(res);
    });

    socket.on('placeRightDeck', (data: { roomCode: string; targetPlayerId: string; fromRightDeck?: boolean }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const res = room.placeOnRightDeck(socket.id, data.targetPlayerId, data.fromRightDeck);
      if (res.success) {
        broadcastRoomState(room);
      }
      callback(res);
    });

    socket.on('passTurn', (data: { roomCode: string }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const res = room.passTurn(socket.id);
      if (res.success) {
        broadcastRoomState(room);
      }
      callback(res);
    });

    socket.on('requestPenalty', (data: { 
      roomCode: string; 
      targetPlayerId: string; 
      reason: 'MISSED_CENTER' | 'WRONG_CARD_PLAYED' | 'INVALID_SEQUENCE' 
    }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const res = room.requestPenalty(socket.id, data.targetPlayerId, data.reason);
      if (res.success) {
        broadcastRoomState(room);
      }
      callback(res);
    });

    socket.on('kickPlayer', (data: { roomCode: string; targetPlayerId: string }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const kicked = room.kickPlayer(socket.id, data.targetPlayerId);
      if (kicked) {
        broadcastRoomState(room);
        callback({ success: true });
      } else {
        callback({ success: false, error: 'Could not kick player' });
      }
    });

    socket.on('playAgain', (data: { roomCode: string }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const res = room.playAgain(socket.id);
      if (res.success) {
        broadcastRoomState(room);
      }
      callback(res);
    });

    // ==========================================
    // Real-Time WebRTC Voice Chat Signaling
    // ==========================================
    socket.on('voice:join', (data: { roomCode: string }, callback) => {
      try {
        const code = data.roomCode?.toUpperCase();
        if (!code) return callback({ success: false, error: 'Invalid room code' });

        if (!voiceRooms.has(code)) {
          voiceRooms.set(code, new Map());
        }
        const voiceRoom = voiceRooms.get(code)!;

        // Existing peers already in the voice call
        const existingPeers = Array.from(voiceRoom.keys()).filter((id) => id !== socket.id);

        voiceRoom.set(socket.id, { socketId: socket.id, isMuted: false, isDeafened: false });

        // Inform other players in the room that a new peer has joined voice
        socket.to(code).emit('voice:peer-joined', { peerId: socket.id });

        callback({ success: true, peers: existingPeers });
      } catch (err: any) {
        callback({ success: false, error: err.message || 'Failed to join voice' });
      }
    });

    socket.on('voice:signal', (data: { targetPeerId: string; signal: any }) => {
      if (data.targetPeerId && data.signal) {
        io.to(data.targetPeerId).emit('voice:signal', {
          fromPeerId: socket.id,
          signal: data.signal,
        });
      }
    });

    socket.on('voice:state', (data: { roomCode: string; isMuted: boolean; isDeafened: boolean }) => {
      const code = data.roomCode?.toUpperCase();
      if (!code) return;

      const voiceRoom = voiceRooms.get(code);
      if (voiceRoom && voiceRoom.has(socket.id)) {
        const participant = voiceRoom.get(socket.id)!;
        participant.isMuted = !!data.isMuted;
        participant.isDeafened = !!data.isDeafened;

        socket.to(code).emit('voice:peer-state-changed', {
          peerId: socket.id,
          isMuted: !!data.isMuted,
          isDeafened: !!data.isDeafened,
        });
      }
    });

    socket.on('voice:leave', (data: { roomCode: string }, callback) => {
      const code = data.roomCode?.toUpperCase();
      if (code && voiceRooms.has(code)) {
        const voiceRoom = voiceRooms.get(code)!;
        if (voiceRoom.has(socket.id)) {
          voiceRoom.delete(socket.id);
          socket.to(code).emit('voice:peer-left', { peerId: socket.id });
          if (voiceRoom.size === 0) {
            voiceRooms.delete(code);
          }
        }
      }
      if (callback) callback({ success: true });
    });

    // ==========================================
    // Explicit Player Leave Room
    // ==========================================
    socket.on('leaveRoom', (data: { roomCode: string }, callback) => {
      try {
        const code = data.roomCode?.trim().toUpperCase();
        if (code) {
          const room = activeRooms.get(code);
          if (room) {
            // Cancel any pending disconnect timer for this session
            if (playerSessionId) {
              const timerKey = `${code}:${playerSessionId}`;
              if (disconnectTimers.has(timerKey)) {
                clearTimeout(disconnectTimers.get(timerKey)!);
                disconnectTimers.delete(timerKey);
              }
            }

            // Remove player from game engine (distributing cards if PLAYING)
            room.removePlayer(socket.id);

            // Clean up voice participation
            if (voiceRooms.has(code)) {
              const voiceRoom = voiceRooms.get(code)!;
              if (voiceRoom.has(socket.id)) {
                voiceRoom.delete(socket.id);
                socket.to(code).emit('voice:peer-left', { peerId: socket.id });
                if (voiceRoom.size === 0) {
                  voiceRooms.delete(code);
                }
              }
            }

            // Unsubscribe socket from room channel
            socket.leave(code);

            // Broadcast new state to remaining players
            if (room.players.length === 0) {
              activeRooms.delete(code);
            } else {
              broadcastRoomState(room);
            }
          }
        }

        currentRoomCode = null;
        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('disconnect', () => {
      // Clean up voice chat participation on disconnect
      if (currentRoomCode && voiceRooms.has(currentRoomCode)) {
        const voiceRoom = voiceRooms.get(currentRoomCode)!;
        if (voiceRoom.has(socket.id)) {
          voiceRoom.delete(socket.id);
          socket.to(currentRoomCode).emit('voice:peer-left', { peerId: socket.id });
          if (voiceRoom.size === 0) {
            voiceRooms.delete(currentRoomCode);
          }
        }
      }

      if (currentRoomCode && playerSessionId) {
        const room = activeRooms.get(currentRoomCode);
        if (room) {
          room.markDisconnected(socket.id);
          broadcastRoomState(room);

          // 60-second reconnect window
          const timerKey = `${currentRoomCode}:${playerSessionId}`;
          const timer = setTimeout(() => {
            disconnectTimers.delete(timerKey);
            const targetRoom = activeRooms.get(currentRoomCode!);
            if (targetRoom) {
              const disconnectedPlayer = targetRoom.players.find(p => p.sessionId === playerSessionId);
              if (disconnectedPlayer && !disconnectedPlayer.isConnected) {
                targetRoom.removePlayer(disconnectedPlayer.id);
                if (targetRoom.players.length === 0) {
                  activeRooms.delete(currentRoomCode!);
                } else {
                  broadcastRoomState(targetRoom);
                }
              }
            }
          }, 60000);

          disconnectTimers.set(timerKey, timer);
        }
      }
    });
  });
}
