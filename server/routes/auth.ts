import { Router, Request, Response } from 'express';
import {
  processSignup,
  processLogin,
  processGoogleAuth,
  processGetMe,
  processUpdateProfile,
} from '../../src/lib/auth-service';

export const authRouter = Router();

function setAuthCookie(res: Response, token: string) {
  res.cookie('cg_auth_token', token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
  });
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/cg_auth_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

// POST /api/auth/signup
authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    const result = await processSignup(req.body);
    if (result.data.success && (result.data as any).token) {
      setAuthCookie(res, (result.data as any).token);
    }
    res.status(result.status).json(result.data);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const result = await processLogin(req.body);
    if (result.data.success && (result.data as any).token) {
      setAuthCookie(res, (result.data as any).token);
    }
    res.status(result.status).json(result.data);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// POST /api/auth/google
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const result = await processGoogleAuth(req.body);
    if (result.data.success && (result.data as any).token) {
      setAuthCookie(res, (result.data as any).token);
    }
    res.status(result.status).json(result.data);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// GET /api/auth/me
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    const result = await processGetMe(token);
    res.status(result.status).json(result.data);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// PUT /api/auth/profile
authRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    const result = await processUpdateProfile(token, req.body);
    res.status(result.status).json(result.data);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});
