import { NextRequest, NextResponse } from 'next/server';
import { processGoogleAuth } from '@/lib/auth-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    const errorMsg = error || 'No authorization code provided';
    return new NextResponse(
      `<!DOCTYPE html>
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
</html>`,
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/auth/callback/google`;

    if (!clientId || !clientSecret) {
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head><title>Configuration Missing</title></head>
<body style="background:#111;color:#fff;font-family:sans-serif;text-align:center;padding:40px;">
  <h2>Configuration Missing</h2>
  <p>Google OAuth credentials missing on server.</p>
</body>
</html>`,
        { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Exchange authorization code for tokens
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
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head><title>Token Exchange Failed</title></head>
<body style="background:#111;color:#fff;font-family:sans-serif;text-align:center;padding:40px;">
  <h2>Google Authentication Failed</h2>
  <p>${tokenData.error_description || 'Failed to exchange authorization token'}</p>
  <script>
    setTimeout(function() {
      if (window.opener) { window.close(); } else { window.location.href = '/'; }
    }, 2000);
  </script>
</body>
</html>`,
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Fetch Google profile
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

    const html = `<!DOCTYPE html>
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
</html>`;

    const response = new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

    if (token) {
      response.cookies.set('cg_auth_token', token, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (err: any) {
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<body style="background:#111;color:#fff;text-align:center;padding:40px;">
  <h2>Error during authentication</h2>
  <p>${err.message}</p>
</body>
</html>`,
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
