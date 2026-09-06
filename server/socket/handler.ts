import { Server as SocketIOServer, Socket } from 'socket.io';
import { DukkiBazaarRoom } from '../game/engine';
import { RoomModel, GameHistoryModel, updatePlayerStats } from '../db';

const activeRooms = new Map<string, DukkiBazaarRoom>();
const disconnectTimers = new Map<string, NodeJS.Timeout>();

interface OnlineUser {
  socketId: string;
  userId?: string;
  sessionId?: string;
  name: string;
  avatarUrl?: string;
  avatarColor?: string;
  currentRoomCode?: string | null;
}

const onlineUsers = new Map<string, OnlineUser>();

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

  function createRoomInstance(code: string): DukkiBazaarRoom {
    const room = new DukkiBazaarRoom(
      code,
      () => {
        broadcastRoomState(room);
      },
      async (finishedRoom) => {
        try {
          for (const r of finishedRoom.rankings) {
            if (r.scoreEarned) {
              await updatePlayerStats(r.name, r.scoreEarned, r.rank === 1);
            }
          }
          const winner = finishedRoom.rankings.find(r => r.rank === 1) || finishedRoom.winner;
          if (winner) {
            await GameHistoryModel.create({
              roomCode: code,
              winnerName: winner.name,
              roundsCount: finishedRoom.rankings.length,
              playerCount: finishedRoom.players.length,
              summary: finishedRoom.rankings.map(r => `#${r.rank} ${r.name} (+${r.scoreEarned || 0} PTS)`).join(', '),
            });
          }
          try {
            await RoomModel.updateOne({ code }, { status: 'FINISHED', updatedAt: new Date() });
          } catch (e) {}
        } catch (err: any) {
          console.warn('Game over score persistence warning:', err.message);
        }
      }
    );
    return room;
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

        const room = createRoomInstance(code);

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

        // Record room in MongoDB with upsert
        try {
          await RoomModel.findOneAndUpdate(
            { code },
            {
              code,
              hostId: player.sessionId,
              hostName: data.name,
              status: 'LOBBY',
              gameType: 'DUKKI_BAZAAR',
              maxPlayers: 5,
              updatedAt: new Date(),
            },
            { upsert: true, new: true }
          );
        } catch (dbErr) {
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
        let room = activeRooms.get(code);

        // Fallback: If room is not in memory (e.g. server restarted or host temporarily disconnected), check MongoDB
        if (!room) {
          try {
            const dbRoom = await RoomModel.findOne({
              code,
              status: { $in: ['LOBBY', 'PLAYING'] },
            }).sort({ createdAt: -1 });

            if (dbRoom) {
              console.log(`♻️ Rehydrating room ${code} from MongoDB for player ${data.name}`);
              room = createRoomInstance(code);
              activeRooms.set(code, room);
            }
          } catch (dbErr) {
            console.warn('⚠️ Could not check MongoDB for room:', dbErr);
          }
        }

        if (!room) {
          return callback({ success: false, error: 'Room not found. Check the 6-character code.' });
        }

        // Cancel any pending disconnect timer for this session
        const timerKey = `${code}:${data.sessionId}`;
        if (disconnectTimers.has(timerKey)) {
          clearTimeout(disconnectTimers.get(timerKey)!);
          disconnectTimers.delete(timerKey);
        }

        // Check if player is reconnecting (by sessionId first, then by name fallback)
        let reconnected = room.reconnectPlayer(data.sessionId, socket.id);
        if (!reconnected && data.name) {
          const matchedPlayer = room.players.find(
            p => p.name.trim().toLowerCase() === data.name.trim().toLowerCase()
          );
          if (matchedPlayer) {
            matchedPlayer.sessionId = data.sessionId;
            reconnected = room.reconnectPlayer(data.sessionId, socket.id);
          }
        }

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
    // Interactive Felt Throwables (Chappal, Chai, Tomato, Cash, Rose)
    // ==========================================
    socket.on('throw_item', (data: { roomCode: string; fromPlayerId: string; toPlayerId: string; itemType: string }, callback) => {
      try {
        const code = data.roomCode?.trim().toUpperCase();
        if (code && activeRooms.has(code)) {
          const payload = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            fromPlayerId: data.fromPlayerId,
            toPlayerId: data.toPlayerId,
            itemType: data.itemType,
            timestamp: Date.now(),
          };
          io.to(code).emit('item_thrown', payload);
          if (callback) callback({ success: true });
        } else {
          if (callback) callback({ success: false, error: 'Room not found' });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err?.message || 'Failed to throw item' });
      }
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
              // Retain empty lobby room for a grace period before evicting from memory
              setTimeout(() => {
                const r = activeRooms.get(code);
                if (r && r.players.length === 0 && r.status === 'LOBBY') {
                  activeRooms.delete(code);
                }
              }, 15 * 60 * 1000);
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

    // Register online user for direct friend invites
    socket.on('register_user', (userData: { userId?: string; sessionId?: string; name: string; avatarUrl?: string; avatarColor?: string }) => {
      onlineUsers.set(socket.id, {
        socketId: socket.id,
        userId: userData.userId,
        sessionId: userData.sessionId,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
        avatarColor: userData.avatarColor,
        currentRoomCode,
      });
    });

    // Send direct room invite to another online player
    socket.on('send_room_invite', (data: { targetUserIdOrName: string; roomCode: string; hostName: string; hostAvatar?: string; hostAvatarColor?: string }, callback) => {
      const target = data.targetUserIdOrName?.toLowerCase();
      let targetSocketId: string | null = null;

      for (const [sId, u] of onlineUsers.entries()) {
        if (
          (u.userId && u.userId.toLowerCase() === target) ||
          (u.name && u.name.toLowerCase() === target)
        ) {
          targetSocketId = sId;
          break;
        }
      }

      if (targetSocketId) {
        io.to(targetSocketId).emit('room_invite_received', {
          roomCode: data.roomCode,
          hostName: data.hostName,
          hostAvatar: data.hostAvatar,
          hostAvatarColor: data.hostAvatarColor,
          gameType: 'DUKKI_BAZAAR',
        });
        if (callback) callback({ success: true, online: true });
      } else {
        if (callback) callback({ success: true, online: false, message: 'Player is not currently online' });
      }
    });

    // Get list of online players for quick invite
    socket.on('get_online_players', (callback) => {
      const list = Array.from(onlineUsers.values()).map(u => ({
        userId: u.userId,
        name: u.name,
        avatarUrl: u.avatarUrl,
        avatarColor: u.avatarColor,
        inRoom: !!u.currentRoomCode,
      }));
      if (callback) callback(list);
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
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

          // Only auto-remove disconnected players during LOBBY phase!
          // During active PLAYING game, DO NOT kick players on disconnect to prevent premature victory.
          // Players can seamlessly reconnect back to their ongoing match anytime.
          if (room.status === 'LOBBY') {
            const timerKey = `${currentRoomCode}:${playerSessionId}`;
            // 30-minute lobby disconnect grace period:
            // Allows hosts and players to switch apps (e.g. WhatsApp to invite friends), take calls,
            // or lock screens without the lobby room vanishing into thin air!
            const timer = setTimeout(() => {
              disconnectTimers.delete(timerKey);
              const targetRoom = activeRooms.get(currentRoomCode!);
              if (targetRoom && targetRoom.status === 'LOBBY') {
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
            }, 30 * 60 * 1000); // 30 minutes grace period

            disconnectTimers.set(timerKey, timer);
          }
        }
      }
    });
  });
}
