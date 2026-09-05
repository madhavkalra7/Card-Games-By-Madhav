import { UserModel, connectDB, hashPassword, verifyPassword } from '../../server/db';
import { signAuthToken, verifyAuthToken } from './auth-token';
import { DEFAULT_AVATAR, getAvatarById } from './avatars';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  avatarColor: string;
  avatarId: string;
  totalScore: number;
  totalGamesWon: number;
  totalGamesPlayed: number;
  createdAt?: Date;
}

export function formatSafeUser(user: any): SafeUser {
  return {
    id: (user._id || user.id || '').toString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || DEFAULT_AVATAR.image,
    avatarColor: user.avatarColor || DEFAULT_AVATAR.color,
    avatarId: user.avatarId || DEFAULT_AVATAR.id,
    totalScore: typeof user.totalScore === 'number' ? user.totalScore : 100,
    totalGamesWon: user.totalGamesWon || 0,
    totalGamesPlayed: user.totalGamesPlayed || 0,
    createdAt: user.createdAt,
  };
}

// In-memory user fallback store (for serverless environments or if DB connection is unavailable)
interface InMemoryUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  googleId?: string;
  avatarUrl: string;
  avatarColor: string;
  avatarId: string;
  totalScore: number;
  totalGamesWon: number;
  totalGamesPlayed: number;
  createdAt: Date;
}

declare global {
  var inMemoryAuthUsers: Map<string, InMemoryUser> | undefined;
}

const memUsers = global.inMemoryAuthUsers || new Map<string, InMemoryUser>();
if (!global.inMemoryAuthUsers) {
  global.inMemoryAuthUsers = memUsers;
}

export async function processSignup(data: {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}) {
  const { name, email, password, confirmPassword } = data || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return { status: 400, data: { success: false, error: 'Please enter your full name.' } };
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { status: 400, data: { success: false, error: 'Please enter a valid email address.' } };
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return { status: 400, data: { success: false, error: 'Password must be at least 6 characters long.' } };
  }

  if (password !== confirmPassword) {
    return { status: 400, data: { success: false, error: 'Passwords do not match.' } };
  }

  const cleanEmail = email.trim().toLowerCase();
  const { salt, hash } = hashPassword(password);

  const isConnected = await connectDB();
  if (isConnected) {
    try {
      const existing = await UserModel.findOne({ email: cleanEmail });
      if (existing) {
        return {
          status: 409,
          data: { success: false, error: 'An account with this email already exists. Please sign in.' },
        };
      }

      const user = await UserModel.create({
        name: name.trim(),
        email: cleanEmail,
        passwordHash: hash,
        salt,
        avatarUrl: DEFAULT_AVATAR.image,
        avatarColor: DEFAULT_AVATAR.color,
        avatarId: DEFAULT_AVATAR.id,
        totalScore: 100,
        totalGamesWon: 0,
        totalGamesPlayed: 0,
      });

      const token = signAuthToken({ userId: user._id.toString(), email: user.email });

      return {
        status: 200,
        data: {
          success: true,
          user: formatSafeUser(user),
          token,
          message: 'Account created successfully! Welcome to Card Games By Madhav.',
        },
      };
    } catch (e: any) {
      console.warn('MongoDB query warning in signup, using memory store:', e.message);
    }
  }

  // Memory fallback
  if (memUsers.has(cleanEmail)) {
    return {
      status: 409,
      data: { success: false, error: 'An account with this email already exists. Please sign in.' },
    };
  }

  const memUser: InMemoryUser = {
    id: 'mem_' + Math.random().toString(36).substring(2, 10),
    name: name.trim(),
    email: cleanEmail,
    passwordHash: hash,
    salt,
    avatarUrl: DEFAULT_AVATAR.image,
    avatarColor: DEFAULT_AVATAR.color,
    avatarId: DEFAULT_AVATAR.id,
    totalScore: 100,
    totalGamesWon: 0,
    totalGamesPlayed: 0,
    createdAt: new Date(),
  };
  memUsers.set(cleanEmail, memUser);

  const token = signAuthToken({ userId: memUser.id, email: memUser.email });
  return {
    status: 200,
    data: {
      success: true,
      user: formatSafeUser(memUser),
      token,
      message: 'Account created successfully! Welcome to Card Games By Madhav.',
    },
  };
}

export async function processLogin(data: { email?: string; password?: string }) {
  const { email, password } = data || {};

  if (!email || !password) {
    return { status: 400, data: { success: false, error: 'Please enter both email and password.' } };
  }

  const cleanEmail = email.trim().toLowerCase();
  const isConnected = await connectDB();

  if (isConnected) {
    try {
      const user = await UserModel.findOne({ email: cleanEmail });
      if (user) {
        if (!user.passwordHash || !user.salt) {
          if (user.googleId) {
            return {
              status: 400,
              data: {
                success: false,
                error: 'This account was created with Google. Please click "Continue with Google".',
              },
            };
          }
          return { status: 401, data: { success: false, error: 'Invalid account credentials.' } };
        }

        const isValid = verifyPassword(password, user.salt, user.passwordHash);
        if (!isValid) {
          return { status: 401, data: { success: false, error: 'Incorrect password. Please try again.' } };
        }

        const token = signAuthToken({ userId: user._id.toString(), email: user.email });
        return {
          status: 200,
          data: {
            success: true,
            user: formatSafeUser(user),
            token,
            message: 'Logged in successfully!',
          },
        };
      }
    } catch (e: any) {
      console.warn('MongoDB query warning in login, checking memory store:', e.message);
    }
  }

  // Memory fallback
  const memUser = memUsers.get(cleanEmail);
  if (!memUser) {
    return { status: 401, data: { success: false, error: 'No account found with this email address.' } };
  }

  if (memUser.passwordHash && memUser.salt) {
    const isValid = verifyPassword(password, memUser.salt, memUser.passwordHash);
    if (!isValid) {
      return { status: 401, data: { success: false, error: 'Incorrect password. Please try again.' } };
    }
  }

  const token = signAuthToken({ userId: memUser.id, email: memUser.email });
  return {
    status: 200,
    data: {
      success: true,
      user: formatSafeUser(memUser),
      token,
      message: 'Logged in successfully!',
    },
  };
}

export async function processGoogleAuth(data: {
  email?: string;
  name?: string;
  googleId?: string;
  avatarUrl?: string;
  credential?: string;
}) {
  let { email, name, googleId, avatarUrl, credential } = data || {};

  // Verify Google ID Token (credential) if provided via GIS
  if (credential) {
    try {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (verifyRes.ok) {
        const payload = await verifyRes.json();
        email = payload.email || email;
        name = payload.name || name;
        googleId = payload.sub || googleId;
        avatarUrl = payload.picture || avatarUrl;
      }
    } catch (e: any) {
      console.warn('Google tokeninfo fetch warning:', e?.message || e);
    }
  }

  if (!email || typeof email !== 'string') {
    return { status: 400, data: { success: false, error: 'Google login failed: Email missing.' } };
  }

  const cleanEmail = email.trim().toLowerCase();
  const userName = name && typeof name === 'string' && name.trim() ? name.trim() : cleanEmail.split('@')[0];

  const isConnected = await connectDB();
  if (isConnected) {
    try {
      let user = await UserModel.findOne({ email: cleanEmail });

      if (!user) {
        user = await UserModel.create({
          name: userName,
          email: cleanEmail,
          googleId: googleId || 'g_' + Math.random().toString(36).substring(2, 10),
          avatarUrl: avatarUrl || DEFAULT_AVATAR.image,
          avatarColor: DEFAULT_AVATAR.color,
          avatarId: DEFAULT_AVATAR.id,
          totalScore: 100,
          totalGamesWon: 0,
          totalGamesPlayed: 0,
        });
      } else {
        let modified = false;
        if (!user.googleId && googleId) {
          user.googleId = googleId;
          modified = true;
        }
        if (avatarUrl && (!user.avatarUrl || user.avatarUrl === DEFAULT_AVATAR.image)) {
          user.avatarUrl = avatarUrl;
          modified = true;
        }
        if (modified) {
          await user.save();
        }
      }

      const token = signAuthToken({ userId: user._id.toString(), email: user.email });

      return {
        status: 200,
        data: {
          success: true,
          user: formatSafeUser(user),
          token,
          message: 'Signed in with Google successfully!',
        },
      };
    } catch (e: any) {
      console.warn('MongoDB query warning in Google auth, using memory store:', e.message);
    }
  }

  // Memory fallback
  let memUser = memUsers.get(cleanEmail);
  if (!memUser) {
    memUser = {
      id: 'mem_' + Math.random().toString(36).substring(2, 10),
      name: userName,
      email: cleanEmail,
      googleId: googleId || 'g_' + Math.random().toString(36).substring(2, 10),
      avatarUrl: avatarUrl || DEFAULT_AVATAR.image,
      avatarColor: DEFAULT_AVATAR.color,
      avatarId: DEFAULT_AVATAR.id,
      totalScore: 100,
      totalGamesWon: 0,
      totalGamesPlayed: 0,
      createdAt: new Date(),
    };
    memUsers.set(cleanEmail, memUser);
  } else {
    if (avatarUrl) memUser.avatarUrl = avatarUrl;
    if (userName) memUser.name = userName;
  }

  const token = signAuthToken({ userId: memUser.id, email: memUser.email });

  return {
    status: 200,
    data: {
      success: true,
      user: formatSafeUser(memUser),
      token,
      message: 'Signed in with Google successfully!',
    },
  };
}

export async function processGetMe(token: string | null) {
  if (!token) {
    return { status: 401, data: { success: false, user: null } };
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return { status: 401, data: { success: false, user: null } };
  }

  const isConnected = await connectDB();
  if (isConnected) {
    try {
      const user = await UserModel.findById(payload.userId);
      if (user) {
        return {
          status: 200,
          data: {
            success: true,
            user: formatSafeUser(user),
          },
        };
      }
    } catch (e: any) {
      console.warn('MongoDB query warning in me:', e.message);
    }
  }

  // Check in-memory store
  for (const [, user] of memUsers) {
    if (user.id === payload.userId || user.email === payload.email) {
      return {
        status: 200,
        data: {
          success: true,
          user: formatSafeUser(user),
        },
      };
    }
  }

  return { status: 404, data: { success: false, user: null } };
}

export async function processUpdateProfile(token: string | null, data: { name?: string; avatarId?: string }) {
  if (!token) {
    return { status: 401, data: { success: false, error: 'Unauthorized' } };
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return { status: 401, data: { success: false, error: 'Session expired' } };
  }

  const { name, avatarId } = data || {};
  const isConnected = await connectDB();

  if (isConnected) {
    try {
      const user = await UserModel.findById(payload.userId);
      if (user) {
        if (name && typeof name === 'string' && name.trim()) {
          user.name = name.trim();
        }

        if (avatarId) {
          const avatarInfo = getAvatarById(avatarId);
          user.avatarId = avatarInfo.id;
          user.avatarUrl = avatarInfo.image;
          user.avatarColor = avatarInfo.color;
        }

        await user.save();

        return {
          status: 200,
          data: {
            success: true,
            user: formatSafeUser(user),
            message: 'Profile updated successfully!',
          },
        };
      }
    } catch (e: any) {
      console.warn('MongoDB query warning in update profile:', e.message);
    }
  }

  // Update in-memory user
  for (const [, user] of memUsers) {
    if (user.id === payload.userId || user.email === payload.email) {
      if (name && typeof name === 'string' && name.trim()) {
        user.name = name.trim();
      }
      if (avatarId) {
        const avatarInfo = getAvatarById(avatarId);
        user.avatarId = avatarInfo.id;
        user.avatarUrl = avatarInfo.image;
        user.avatarColor = avatarInfo.color;
      }

      return {
        status: 200,
        data: {
          success: true,
          user: formatSafeUser(user),
          message: 'Profile updated successfully!',
        },
      };
    }
  }

  return { status: 404, data: { success: false, error: 'User not found.' } };
}
