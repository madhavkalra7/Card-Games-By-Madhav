import { Server as SocketIOServer, Socket } from 'socket.io';
import { DukkiBazaarRoom } from '../game/engine';
import { BluffMasterRoom } from '../game/bluffEngine';
import { GameType, Rank } from '../game/types';
import { RoomModel, GameHistoryModel, updatePlayerStats } from '../db';

const activeRooms = new Map<string, DukkiBazaarRoom | BluffMasterRoom>();
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

interface RoomAutoAbort {
  timer: NodeJS.Timeout;
  deadline: number;
  playerName: string;
}

const roomAutoAbortTimers = new Map<string, RoomAutoAbort>();

export function setupSocketHandlers(io: SocketIOServer) {
  function broadcastRoomState(room: DukkiBazaarRoom | BluffMasterRoom) {
    for (const player of room.players) {
      if (player.isConnected) {
        const clientView = room.getClientView(player.id);
        io.to(player.id).emit('syncState', clientView);
      }
    }
    for (const spectator of (room as any).spectators || []) {
      const clientView = room.getClientView(spectator.id);
      io.to(spectator.id).emit('syncState', clientView);
    }
  }

  function createRoomInstance(code: string, gameType: GameType = 'DUKKI_BAZAAR'): DukkiBazaarRoom | BluffMasterRoom {
    const handleGameOver = async (finishedRoom: DukkiBazaarRoom | BluffMasterRoom) => {
      try {
        for (const r of finishedRoom.rankings) {
          if (r.scoreEarned || r.coinsEarned) {
            await updatePlayerStats(r.name, r.scoreEarned || 0, r.rank === 1, r.coinsEarned || 0);
          }
        }
        const winner = finishedRoom.rankings.find(r => r.rank === 1) || (finishedRoom as any).winner;
        if (winner) {
          await GameHistoryModel.create({
            roomCode: code,
            winnerName: winner.name,
            roundsCount: finishedRoom.rankings.length,
            playerCount: finishedRoom.players.length,
            summary: finishedRoom.rankings.map(r => `#${r.rank} ${r.name} (+${r.scoreEarned || 0} PTS, +${r.coinsEarned || 0} Coins)`).join(', '),
          });
        }
        try {
          await RoomModel.updateOne({ code }, { status: 'FINISHED', updatedAt: new Date() });
        } catch (e) {}
      } catch (err: any) {
        console.warn('Game over score persistence warning:', err.message);
      }
    };

    if (gameType === 'BLUFF_MASTER') {
      const room = new BluffMasterRoom(
        code,
        () => {
          broadcastRoomState(room);
        },
        handleGameOver
      );
      return room;
    }

    const room = new DukkiBazaarRoom(
      code,
      () => {
        broadcastRoomState(room);
      },
      handleGameOver
    );
    return room;
  }

  io.on('connection', (socket: Socket) => {
    let currentRoomCode: string | null = null;
    let playerSessionId: string | null = null;

    socket.on('createRoom', async (data: { name: string; avatarColor: string; sessionId: string; gameType?: GameType }, callback) => {
      try {
        let code = generateRoomCode();
        while (activeRooms.has(code)) {
          code = generateRoomCode();
        }

        const gameType: GameType = data.gameType === 'BLUFF_MASTER' ? 'BLUFF_MASTER' : 'DUKKI_BAZAAR';
        const room = createRoomInstance(code, gameType);

        const player = room.addPlayer({
          id: socket.id,
          sessionId: data.sessionId,
          name: data.name,
          avatarColor: data.avatarColor,
        });

        activeRooms.set(code, room);
        currentRoomCode = code;
        playerSessionId = data.sessionId;

        if (onlineUsers.has(socket.id)) {
          onlineUsers.get(socket.id)!.currentRoomCode = code;
        }

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
              gameType,
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
              const gType: GameType = (dbRoom.gameType as GameType) || 'DUKKI_BAZAAR';
              room = createRoomInstance(code, gType);
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

        let isSpectator = false;

        if (reconnected) {
          // If this player returned, check if all active players are now connected
          const hasDisconnectedActive = room.players.some(p => !p.isConnected && !p.isFinished);
          if (!hasDisconnectedActive && roomAutoAbortTimers.has(code)) {
            const abortEntry = roomAutoAbortTimers.get(code)!;
            clearTimeout(abortEntry.timer);
            roomAutoAbortTimers.delete(code);
            room.autoAbortTimer = null;
            io.to(code).emit('player_reconnected', { playerName: data.name });
          }
        } else {
          // New user joining room
          if (room.status === 'PLAYING') {
            // Match already in progress: Add as Spectator to watch and play next round
            (room as any).addSpectator({
              id: socket.id,
              sessionId: data.sessionId,
              name: data.name,
              avatarColor: data.avatarColor,
            });
            isSpectator = true;
          } else {
            // Join as active player in lobby
            room.addPlayer({
              id: socket.id,
              sessionId: data.sessionId,
              name: data.name,
              avatarColor: data.avatarColor,
            });
          }
        }

        if (currentRoomCode && currentRoomCode !== code) {
          socket.leave(currentRoomCode);
        }

        currentRoomCode = code;
        playerSessionId = data.sessionId;

        if (onlineUsers.has(socket.id)) {
          onlineUsers.get(socket.id)!.currentRoomCode = code;
        }

        socket.join(code);
        callback({ success: true, roomCode: code, state: room.getClientView(socket.id), isSpectator });
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
      if (!room || !(room instanceof DukkiBazaarRoom)) return callback({ success: false, error: 'Dukki Bazaar room not found' });

      const res = room.drawCard(socket.id);
      if (res.success) {
        broadcastRoomState(room);
      }
      callback(res);
    });

    socket.on('placeCenter', (data: { roomCode: string; targetDeckId?: number; targetSuit?: any; fromRightDeck?: boolean }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room || !(room instanceof DukkiBazaarRoom)) return callback({ success: false, error: 'Dukki Bazaar room not found' });

      const targetDeckId = typeof data.targetDeckId === 'number' ? data.targetDeckId : (typeof data.targetSuit === 'number' ? data.targetSuit : undefined);
      const res = room.placeOnCenter(socket.id, targetDeckId, data.fromRightDeck);
      if (res.success) {
        if (!res.autoPenalized && res.card && res.targetDeckId !== undefined) {
          const fromPlayer = room.players.find(p => p.id === socket.id);
          io.to(room.roomCode).emit('card_played', {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            card: res.card,
            fromPlayerId: socket.id,
            fromPlayerName: fromPlayer?.name || 'Player',
            fromSource: res.fromRightDeck ? 'RIGHT_DECK' : 'FLOATING',
            targetType: 'CENTER',
            targetDeckId: res.targetDeckId,
            timestamp: Date.now(),
          });
        }
        broadcastRoomState(room);
      }
      callback(res);
    });

    socket.on('placeRightDeck', (data: { roomCode: string; targetPlayerId: string; fromRightDeck?: boolean }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room || !(room instanceof DukkiBazaarRoom)) return callback({ success: false, error: 'Dukki Bazaar room not found' });

      const res = room.placeOnRightDeck(socket.id, data.targetPlayerId, data.fromRightDeck);
      if (res.success) {
        if (!res.autoPenalized && res.card && res.targetPlayerId) {
          const fromPlayer = room.players.find(p => p.id === socket.id);
          const targetPlayer = room.players.find(p => p.id === res.targetPlayerId);
          io.to(room.roomCode).emit('card_played', {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            card: res.card,
            fromPlayerId: socket.id,
            fromPlayerName: fromPlayer?.name || 'Player',
            fromSource: res.fromRightDeck ? 'RIGHT_DECK' : 'FLOATING',
            targetType: 'RIGHT_DECK',
            targetPlayerId: res.targetPlayerId,
            targetPlayerName: targetPlayer?.name || 'Opponent',
            isOwnRightDeck: !!res.isOwnRightDeck,
            timestamp: Date.now(),
          });
        }
        broadcastRoomState(room);
      }
      callback(res);
    });

    socket.on('passTurn', (data: { roomCode: string }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room) return callback({ success: false, error: 'Room not found' });

      if (room instanceof BluffMasterRoom) {
        const res = room.passTurn(socket.id);
        if (res.success) broadcastRoomState(room);
        return callback(res);
      }

      if (room instanceof DukkiBazaarRoom) {
        const res = room.passTurn(socket.id);
        if (res.success) broadcastRoomState(room);
        return callback(res);
      }

      callback({ success: false, error: 'Unsupported game room' });
    });

    socket.on('requestPenalty', (data: { 
      roomCode: string; 
      targetPlayerId: string; 
      reason: 'MISSED_CENTER' | 'WRONG_CARD_PLAYED' | 'INVALID_SEQUENCE' 
    }, callback) => {
      const room = activeRooms.get(data.roomCode);
      if (!room || !(room instanceof DukkiBazaarRoom)) return callback({ success: false, error: 'Dukki Bazaar room not found' });

      const res = room.requestPenalty(socket.id, data.targetPlayerId, data.reason);
      if (res.success) {
        broadcastRoomState(room);
      }
      callback(res);
    });

    // ==========================================
    // Bluff Master Specific Socket Handlers
    // ==========================================
    socket.on('bluff:playCards', (data: { roomCode: string; cardIds: string[]; declaredRank: Rank }, callback) => {
      const room = activeRooms.get(data.roomCode?.toUpperCase());
      if (!room || !(room instanceof BluffMasterRoom)) {
        return callback?.({ success: false, error: 'Bluff Master room not found' });
      }

      const res = room.playCards(socket.id, data.cardIds, data.declaredRank);
      if (res.success) {
        broadcastRoomState(room);
      }
      callback?.(res);
    });

    socket.on('bluff:challenge', (data: { roomCode: string }, callback) => {
      const room = activeRooms.get(data.roomCode?.toUpperCase());
      if (!room || !(room instanceof BluffMasterRoom)) {
        return callback?.({ success: false, error: 'Bluff Master room not found' });
      }

      const res = room.challenge(socket.id);
      if (res.success) {
        broadcastRoomState(room);
      }
      callback?.(res);
    });

    socket.on('bluff:pass', (data: { roomCode: string }, callback) => {
      const room = activeRooms.get(data.roomCode?.toUpperCase());
      if (!room || !(room instanceof BluffMasterRoom)) {
        return callback?.({ success: false, error: 'Bluff Master room not found' });
      }

      const res = room.passTurn(socket.id);
      if (res.success) {
        broadcastRoomState(room);
      }
      callback?.(res);
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
    // Real-Time Desi Soundboard Audio Broadcast
    // ==========================================
    const lastSoundboardPlay = new Map<string, number>();

    socket.on('play_soundboard', (data: {
      roomCode: string;
      soundId: string;
      label: string;
      emoji: string;
      audioUrl?: string;
      fallbackSynth?: string;
      speechText?: string;
      sessionId?: string;
    }, callback) => {
      try {
        const code = data.roomCode?.trim().toUpperCase();
        if (!code || !activeRooms.has(code)) {
          if (callback) callback({ success: false, error: 'Room not active' });
          return;
        }

        // Rate limit: 1.5s per player to prevent audio overlap spam
        const now = Date.now();
        const lastPlay = lastSoundboardPlay.get(socket.id) || 0;
        if (now - lastPlay < 1500) {
          if (callback) callback({ success: false, error: 'Cooldown active' });
          return;
        }
        lastSoundboardPlay.set(socket.id, now);

        const room = activeRooms.get(code);
        const senderPlayer = room?.players.find(p => p.id === socket.id);

        const payload = {
          id: `sb-${now}-${Math.random().toString(36).substring(2, 6)}`,
          senderId: senderPlayer?.id || socket.id,
          senderSessionId: data.sessionId || senderPlayer?.sessionId || '',
          senderName: senderPlayer?.name || 'Table Player',
          soundId: data.soundId || 'meme',
          label: (data.label || 'Desi Meme').slice(0, 40),
          emoji: data.emoji || '📢',
          audioUrl: data.audioUrl || '',
          fallbackSynth: data.fallbackSynth || 'dramatic',
          speechText: data.speechText || data.label || '',
          timestamp: now,
        };

        io.to(code).emit('soundboard_played', payload);
        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err?.message || 'Failed to trigger soundboard' });
      }
    });
    socket.on('voice:join', (data: { roomCode: string }, callback) => {
      try {
        const code = data.roomCode?.toUpperCase();
        if (!code) return callback({ success: false, error: 'Invalid room code' });

        if (!voiceRooms.has(code)) {
          voiceRooms.set(code, new Map());
        }
        const voiceRoom = voiceRooms.get(code)!;

        // Existing peers already participating in the voice call
        const existingPeers = Array.from(voiceRoom.keys()).filter((id) => id !== socket.id);

        voiceRoom.set(socket.id, { socketId: socket.id, isMuted: false, isDeafened: false });

        // Join dedicated voice channel room to isolate voice broadcasts
        socket.join(`voice:${code}`);

        // Inform other players in the voice call that a new peer has joined voice
        socket.to(`voice:${code}`).emit('voice:peer-joined', { peerId: socket.id });

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

        // Broadcast to whole game room so player seat UI reflects mute/deafen status
        io.to(code).emit('voice:peer-state-changed', {
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
          socket.leave(`voice:${code}`);
          io.to(code).emit('voice:peer-left', { peerId: socket.id });
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

            // Remove spectator or player from game engine
            (room as any).removeSpectator?.(socket.id);
            room.removePlayer(socket.id);

            // Clean up voice participation
            if (voiceRooms.has(code)) {
              const voiceRoom = voiceRooms.get(code)!;
              if (voiceRoom.has(socket.id)) {
                voiceRoom.delete(socket.id);
                socket.leave(`voice:${code}`);
                io.to(code).emit('voice:peer-left', { peerId: socket.id });
                if (voiceRoom.size === 0) {
                  voiceRooms.delete(code);
                }
              }
            }

            // Unsubscribe socket from room channel
            socket.leave(code);

            // If no players remain, cancel auto-abort timers
            if (room.players.length === 0 && roomAutoAbortTimers.has(code)) {
              clearTimeout(roomAutoAbortTimers.get(code)!.timer);
              roomAutoAbortTimers.delete(code);
            }

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
        if (onlineUsers.has(socket.id)) {
          onlineUsers.get(socket.id)!.currentRoomCode = null;
        }
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

    // Get list of online players with active room & game status for 1-click Join / Spectate
    socket.on('get_online_players', (callback) => {
      const list = Array.from(onlineUsers.values()).map(u => {
        const activeRoom = u.currentRoomCode ? activeRooms.get(u.currentRoomCode) : null;
        return {
          userId: u.userId,
          name: u.name,
          avatarUrl: u.avatarUrl,
          avatarColor: u.avatarColor,
          inRoom: !!u.currentRoomCode,
          currentRoomCode: u.currentRoomCode || null,
          roomStatus: activeRoom ? activeRoom.status : null,
          gameType: activeRoom ? activeRoom.gameType : null,
          playerCount: activeRoom ? activeRoom.players.length : 0,
        };
      });
      if (callback) callback(list);
    });

    // Check if player has an ongoing active match to offer "Resume Match?" on home screen
    socket.on('check_active_match', (data: { sessionId?: string }, callback) => {
      try {
        const sessionId = data?.sessionId;
        if (!sessionId) {
          return callback ? callback({ hasActiveMatch: false }) : undefined;
        }

        // Search active rooms for this sessionId
        for (const [code, room] of activeRooms.entries()) {
          const player = room.players.find(p => p.sessionId === sessionId);
          if (player) {
            return callback ? callback({
              hasActiveMatch: true,
              roomCode: code,
              gameType: room.gameType,
              roomStatus: room.status,
              playerCount: room.players.length,
              isSpectator: false,
              playerName: player.name,
              autoAbortRemaining: room.autoAbortTimer ? Math.max(0, Math.ceil((room.autoAbortTimer.deadline - Date.now()) / 1000)) : null,
            }) : undefined;
          }

          const spectator = room.spectators.find(s => s.sessionId === sessionId);
          if (spectator) {
            return callback ? callback({
              hasActiveMatch: true,
              roomCode: code,
              gameType: room.gameType,
              roomStatus: room.status,
              playerCount: room.players.length,
              isSpectator: true,
              playerName: spectator.name,
            }) : undefined;
          }
        }

        if (callback) callback({ hasActiveMatch: false });
      } catch (err: any) {
        if (callback) callback({ hasActiveMatch: false, error: err.message });
      }
    });

    // Explicit leave room action
    socket.on('leaveRoom', (data: { roomCode: string; sessionId?: string }, callback) => {
      try {
        const code = data?.roomCode?.trim().toUpperCase();
        if (code && activeRooms.has(code)) {
          const room = activeRooms.get(code)!;
          const sessionId = data.sessionId;

          // If room has active auto-abort timer for this player, cancel it
          if (roomAutoAbortTimers.has(code)) {
            const entry = roomAutoAbortTimers.get(code)!;
            const targetPlayer = room.players.find(p => p.id === socket.id || (sessionId && p.sessionId === sessionId));
            if (targetPlayer && targetPlayer.name === entry.playerName) {
              clearTimeout(entry.timer);
              roomAutoAbortTimers.delete(code);
              room.autoAbortTimer = null;
            }
          }

          // Remove player or spectator
          const player = room.players.find(p => p.id === socket.id || (sessionId && p.sessionId === sessionId));
          if (player) {
            room.removePlayer(player.id);
            if (room.players.length === 0) {
              activeRooms.delete(code);
            } else {
              broadcastRoomState(room);
            }
          } else {
            room.removeSpectator(socket.id);
            broadcastRoomState(room);
          }

          socket.leave(code);
          if (onlineUsers.has(socket.id) && onlineUsers.get(socket.id)?.currentRoomCode === code) {
            onlineUsers.get(socket.id)!.currentRoomCode = null;
          }
        }
        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      // Clean up voice chat participation on disconnect
      for (const [vCode, voiceRoom] of voiceRooms.entries()) {
        if (voiceRoom.has(socket.id)) {
          voiceRoom.delete(socket.id);
          io.to(vCode).emit('voice:peer-left', { peerId: socket.id });
          if (voiceRoom.size === 0) {
            voiceRooms.delete(vCode);
          }
        }
      }

      if (currentRoomCode && playerSessionId) {
        const room = activeRooms.get(currentRoomCode);
        if (room) {
          (room as any).removeSpectator?.(socket.id);
          room.markDisconnected(socket.id);
          broadcastRoomState(room);

          // Only auto-remove disconnected players during LOBBY phase!
          if (room.status === 'LOBBY') {
            const timerKey = `${currentRoomCode}:${playerSessionId}`;
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
          } else if (room.status === 'PLAYING') {
            // Player disconnected during active PLAYING match:
            // Trigger 2-minute (120-second) auto-abort grace window!
            const disconnectedPlayer = room.players.find(p => p.sessionId === playerSessionId);
            const remainingConnectedActive = room.players.some(p => p.isConnected && !p.isFinished);

            if (disconnectedPlayer && !disconnectedPlayer.isFinished && remainingConnectedActive) {
              const code = currentRoomCode;
              if (!roomAutoAbortTimers.has(code)) {
                const deadline = Date.now() + 120_000;
                room.autoAbortTimer = {
                  deadline,
                  secondsRemaining: 120,
                  disconnectedPlayerName: disconnectedPlayer.name,
                };
                broadcastRoomState(room);

                const abortTimer = setTimeout(() => {
                  const targetRoom = activeRooms.get(code);
                  if (targetRoom && targetRoom.status === 'PLAYING') {
                    const stillDisc = targetRoom.players.find(p => p.sessionId === playerSessionId);
                    if (stillDisc && !stillDisc.isConnected) {
                      console.log(`[Auto-Abort] Room ${code} match aborted: ${stillDisc.name} did not reconnect within 2 minutes.`);
                      targetRoom.status = 'LOBBY';
                      targetRoom.autoAbortTimer = null;
                      if ('centerBazaar' in targetRoom) {
                        (targetRoom as any).centerBazaar = [];
                        (targetRoom as any).unusedCards = [];
                        (targetRoom as any).centerDecks = (targetRoom as any).centerDecks.map((d: any) => ({
                          ...d,
                          cards: [],
                          topCard: null,
                          isOpen: false,
                          isCompleted: false,
                        }));
                      }
                      if ('centerPile' in targetRoom) {
                        (targetRoom as any).centerPile = [];
                        (targetRoom as any).currentDeclaredRank = null;
                        (targetRoom as any).currentClaimCount = 0;
                      }
                      targetRoom.players.forEach((p: any) => {
                        if ('hiddenCards' in p) p.hiddenCards = [];
                        if ('rightDeck' in p) p.rightDeck = [];
                        if ('floatingCard' in p) p.floatingCard = null;
                        if ('cards' in p) p.cards = [];
                      });

                      io.to(code).emit('match_aborted', {
                        reason: `${stillDisc.name} did not reconnect within 2 minutes. Match returned to lobby.`,
                      });
                      broadcastRoomState(targetRoom);
                    }
                  }
                  roomAutoAbortTimers.delete(code);
                }, 120_000);

                roomAutoAbortTimers.set(code, {
                  timer: abortTimer,
                  deadline,
                  playerName: disconnectedPlayer.name,
                });
              }
            }
          }
        }
      }
    });
  });
}
