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

// GET /api/auth/callback/google
authRouter.get('/callback/google', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const error = req.query.error as string;

  if (error || !code) {
    const errorMsg = error || 'No authorization code provided';
    res.status(400).send(`<!DOCTYPE html>
<html>
<head><title>Authentication Error</title></head>
<body style="background:#111;color:#fff;font-family:sans-serif;text-align:center;padding:40px;">
  <h2>Google Sign-In Cancelled</h2>
  <p>${errorMsg}</p>
  <script>
    setTimeout(function() {
      if (window.opener) { window.close(); } else { window.location.href = '/'; }
    }, 1500);
  </script>
</body>
</html>`);
    return;
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/callback/google`;

    if (!clientId || !clientSecret) {
      res.status(500).send('Google credentials missing on server');
      return;
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      res.status(400).send(`Google auth error: ${tokenData.error_description || 'token exchange failed'}`);
      return;
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userRes.json();

    const authResult = await processGoogleAuth({
      email: profile.email,
      name: profile.name,
      googleId: profile.sub,
      avatarUrl: profile.picture,
    });

    const token = (authResult.data as any).token;
    if (token) {
      setAuthCookie(res, token);
    }

    res.send(`<!DOCTYPE html>
<html>
<head><title>Signed In Successfully</title></head>
<body style="background:#0c0906;color:#e5c07b;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;padding:20px;">
    <h3 style="margin:0 0 10px;font-size:20px;">Welcome, ${profile.name || 'Player'}!</h3>
    <p style="color:#aaa;font-size:14px;">Connecting to Card Games By Madhav...</p>
  </div>
  <script>
    try {
      localStorage.setItem('cg_auth_token', '${token}');
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: '${token}' }, '*');
        window.close();
      } else {
        window.location.href = '/';
      }
    } catch (e) {
      window.location.href = '/';
    }
  </script>
</body>
</html>`);
  } catch (err: any) {
    res.status(500).send(`Server error: ${err.message}`);
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
