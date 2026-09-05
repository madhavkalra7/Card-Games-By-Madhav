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
  friends: [{ type: String }],
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

// Update player stats after match ends
export async function updatePlayerStats(nameOrEmailOrId: string, scoreEarned: number, won: boolean): Promise<any> {
  const isConnected = await connectDB();
  if (!isConnected) return null;

  try {
    const isObjectId = mongoose.isValidObjectId(nameOrEmailOrId);
    let user;
    if (isObjectId) {
      user = await UserModel.findById(nameOrEmailOrId);
    }
    if (!user) {
      user = await UserModel.findOne({
        $or: [
          { email: nameOrEmailOrId.toLowerCase() },
          { name: nameOrEmailOrId },
        ],
      });
    }

    if (user) {
      user.totalScore = (user.totalScore || 100) + scoreEarned;
      user.totalGamesPlayed = (user.totalGamesPlayed || 0) + 1;
      if (won) {
        user.totalGamesWon = (user.totalGamesWon || 0) + 1;
      }
      await user.save();
      return user;
    }
  } catch (err: any) {
    console.warn('⚠️ Could not update user stats in MongoDB:', err.message);
  }
  return null;
}

// Get global leaderboard sorted by totalGamesWon descending, then totalScore descending
export async function getGlobalLeaderboard(limit = 50) {
  const isConnected = await connectDB();
  if (isConnected) {
    try {
      const users = await UserModel.find({})
        .sort({ totalGamesWon: -1, totalScore: -1 })
        .limit(limit)
        .lean();

      return users.map((u: any, idx: number) => ({
        rank: idx + 1,
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        avatarColor: u.avatarColor,
        avatarId: u.avatarId || 'toon-orange',
        totalScore: u.totalScore || 100,
        totalGamesWon: u.totalGamesWon || 0,
        totalGamesPlayed: u.totalGamesPlayed || 0,
        winRate: u.totalGamesPlayed > 0 ? Math.round((u.totalGamesWon / u.totalGamesPlayed) * 100) : 0,
      }));
    } catch (err: any) {
      console.warn('⚠️ Error fetching leaderboard:', err.message);
    }
  }

  return [];
}

// Get friends for a user
export async function getUserFriendsList(userIdOrEmail: string) {
  const isConnected = await connectDB();
  if (!isConnected) return [];

  try {
    const isObjectId = mongoose.isValidObjectId(userIdOrEmail);
    let user;
    if (isObjectId) {
      user = await UserModel.findById(userIdOrEmail);
    }
    if (!user) {
      user = await UserModel.findOne({
        $or: [{ email: userIdOrEmail.toLowerCase() }, { name: userIdOrEmail }],
      });
    }

    if (!user || !user.friends || user.friends.length === 0) {
      return [];
    }

    const friendsList = await UserModel.find({
      $or: [
        { _id: { $in: user.friends.filter((f: string) => mongoose.isValidObjectId(f)) } },
        { email: { $in: user.friends.map((f: string) => f.toLowerCase()) } },
        { name: { $in: user.friends } },
      ],
    }).lean();

    return friendsList.map((f: any) => ({
      id: f._id.toString(),
      name: f.name,
      email: f.email,
      avatarUrl: f.avatarUrl,
      avatarColor: f.avatarColor,
      avatarId: f.avatarId || 'toon-orange',
      totalScore: f.totalScore || 100,
      totalGamesWon: f.totalGamesWon || 0,
      totalGamesPlayed: f.totalGamesPlayed || 0,
      winRate: f.totalGamesPlayed > 0 ? Math.round((f.totalGamesWon / f.totalGamesPlayed) * 100) : 0,
    }));
  } catch (err: any) {
    console.warn('⚠️ Error fetching user friends:', err.message);
    return [];
  }
}

// Add friend for a user
export async function addUserFriend(userIdOrEmail: string, friendEmailOrName: string) {
  const isConnected = await connectDB();
  if (!isConnected) return { success: false, error: 'Database not connected' };

  try {
    const cleanTarget = friendEmailOrName.trim().toLowerCase();
    const friendUser = await UserModel.findOne({
      $or: [
        { email: cleanTarget },
        { name: friendEmailOrName.trim() },
      ],
    });

    if (!friendUser) {
      return { success: false, error: 'Player not found with that name or email.' };
    }

    const isObjectId = mongoose.isValidObjectId(userIdOrEmail);
    let user;
    if (isObjectId) {
      user = await UserModel.findById(userIdOrEmail);
    }
    if (!user) {
      user = await UserModel.findOne({
        $or: [{ email: userIdOrEmail.toLowerCase() }, { name: userIdOrEmail }],
      });
    }

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user._id.toString() === friendUser._id.toString()) {
      return { success: false, error: 'You cannot add yourself as a friend.' };
    }

    user.friends = user.friends || [];
    const friendId = friendUser._id.toString();
    if (!user.friends.includes(friendId) && !user.friends.includes(friendUser.email)) {
      user.friends.push(friendId);
      await user.save();
    }

    return {
      success: true,
      friend: {
        id: friendUser._id.toString(),
        name: friendUser.name,
        email: friendUser.email,
        avatarUrl: friendUser.avatarUrl,
        avatarColor: friendUser.avatarColor,
        avatarId: friendUser.avatarId,
        totalScore: friendUser.totalScore,
        totalGamesWon: friendUser.totalGamesWon,
        totalGamesPlayed: friendUser.totalGamesPlayed,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

