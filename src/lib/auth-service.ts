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
    id: user._id.toString(),
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

export async function processSignup(data: {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}) {
  await connectDB();
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
  const existing = await UserModel.findOne({ email: cleanEmail });
  if (existing) {
    return {
      status: 409,
      data: { success: false, error: 'An account with this email already exists. Please sign in.' },
    };
  }

  const { salt, hash } = hashPassword(password);

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
}

export async function processLogin(data: { email?: string; password?: string }) {
  await connectDB();
  const { email, password } = data || {};

  if (!email || !password) {
    return { status: 400, data: { success: false, error: 'Please enter both email and password.' } };
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: cleanEmail });
  if (!user) {
    return { status: 401, data: { success: false, error: 'No account found with this email address.' } };
  }

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

export async function processGoogleAuth(data: {
  email?: string;
  name?: string;
  googleId?: string;
  avatarUrl?: string;
  credential?: string;
}) {
  await connectDB();
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
}

export async function processGetMe(token: string | null) {
  if (!token) {
    return { status: 401, data: { success: false, user: null } };
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return { status: 401, data: { success: false, user: null } };
  }

  await connectDB();
  const user = await UserModel.findById(payload.userId);
  if (!user) {
    return { status: 404, data: { success: false, user: null } };
  }

  return {
    status: 200,
    data: {
      success: true,
      user: formatSafeUser(user),
    },
  };
}

export async function processUpdateProfile(token: string | null, data: { name?: string; avatarId?: string }) {
  if (!token) {
    return { status: 401, data: { success: false, error: 'Unauthorized' } };
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return { status: 401, data: { success: false, error: 'Session expired' } };
  }

  await connectDB();
  const user = await UserModel.findById(payload.userId);
  if (!user) {
    return { status: 404, data: { success: false, error: 'User not found.' } };
  }

  const { name, avatarId } = data || {};

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
