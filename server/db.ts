import mongoose from 'mongoose';

// 1. Room Schema
const roomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  hostId: { type: String, required: true },
  status: { type: String, default: 'LOBBY' },
  gameType: { type: String, default: 'DUKKI_BAZAAR' },
  maxPlayers: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now },
});

export const RoomModel = mongoose.models.Room || mongoose.model('Room', roomSchema);

// 2. Game History Schema
const gameHistorySchema = new mongoose.Schema({
  roomCode: { type: String, required: true },
  winnerName: { type: String, required: true },
  roundsCount: { type: Number, default: 0 },
  playerCount: { type: Number, required: true },
  summary: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const GameHistoryModel = mongoose.models.GameHistory || mongoose.model('GameHistory', gameHistorySchema);

// 3. Player Session Schema
const playerSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  avatarColor: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const PlayerSessionModel = mongoose.models.PlayerSession || mongoose.model('PlayerSession', playerSessionSchema);

// Connection manager
let isConnected = false;

// Attach error listener to prevent unhandled EventEmitter process crashes
mongoose.connection.on('error', (err) => {
  console.warn('⚠️ MongoDB connection warning:', err.message);
  isConnected = false;
});

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️ MONGODB_URI environment variable is not set. Game running in in-memory mode.');
    return false;
  }

  // Prevent DNS errors if URI contains unconfigured placeholder tokens
  if (uri.includes('<username>') || uri.includes('<password>') || uri.includes('xxxxx')) {
    console.log('ℹ️ MONGODB_URI contains placeholder text (<username>, <password>). Game server running in in-memory mode until real credentials are provided.');
    return false;
  }

  if (isConnected) {
    return true;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = !!conn.connections[0].readyState;
    console.log('🍃 MongoDB connected successfully:', conn.connection.host);
    return true;
  } catch (err: any) {
    console.error('❌ MongoDB connection error:', err.message);
    return false;
  }
}
