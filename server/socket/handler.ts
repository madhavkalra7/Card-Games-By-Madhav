import { Server as SocketIOServer, Socket } from 'socket.io';
import { DukkiBazaarRoom } from '../game/engine';
import { prisma } from '../db';

const activeRooms = new Map<string, DukkiBazaarRoom>();
const disconnectTimers = new Map<string, NodeJS.Timeout>();

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

        // Record room in DB
        try {
          await prisma.room.create({
            data: {
              code,
              hostId: player.sessionId,
              status: 'LOBBY',
              gameType: 'DUKKI_BAZAAR',
              maxPlayers: 5,
            },
          });
        } catch (dbErr) {
          console.error("DB Room create error:", dbErr);
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

    socket.on('placeCenter', (data: { roomCode: string; targetDeckId?: number; targetSuit?: any }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const targetDeckId = typeof data.targetDeckId === 'number' ? data.targetDeckId : (typeof data.targetSuit === 'number' ? data.targetSuit : undefined);
      const res = room.placeOnCenter(socket.id, targetDeckId);
      if (res.success) {
        broadcastRoomState(room);
      }
      callback(res);
    });

    socket.on('placeRightDeck', (data: { roomCode: string; targetPlayerId: string }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const res = room.placeOnRightDeck(socket.id, data.targetPlayerId);
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

    socket.on('disconnect', () => {
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
                if (targetRoom.status === 'LOBBY') {
                  targetRoom.removePlayer(disconnectedPlayer.id);
                }
                broadcastRoomState(targetRoom);
              }
            }
          }, 60000);

          disconnectTimers.set(timerKey, timer);
        }
      }
    });
  });
}
