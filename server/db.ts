import mongoose from 'mongoose';
import crypto from 'crypto';

// Disable buffering so queries fail or fallback immediately instead of hanging 10 seconds
mongoose.set('bufferCommands', false);

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

// 4. User Account Schema (Email & Google Auth)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String },
  salt: { type: String },
  googleId: { type: String },
  avatarUrl: { 
    type: String, 
    default: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png' 
  },
  avatarColor: { type: String, default: '#F4845F' },
  avatarId: { type: String, default: 'toon-orange' },
  totalScore: { type: Number, default: 100 },
  totalGamesWon: { type: Number, default: 0 },
  totalGamesPlayed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

// Password hashing helpers using native crypto
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return verifyHash === hash;
}

// Serverless Cached Mongoose Connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    return false;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return true;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    }).then((m) => {
      return m;
    }).catch((err) => {
      cached.promise = null;
      console.warn('⚠️ MongoDB connection failed:', err.message);
      return null as any;
    });
  }

  try {
    const result = await cached.promise;
    if (result && mongoose.connection.readyState === 1) {
      cached.conn = result;
      return true;
    }
    cached.promise = null;
    return false;
  } catch (err: any) {
    cached.promise = null;
    console.warn('⚠️ MongoDB connection error:', err.message);
    return false;
  }
}
