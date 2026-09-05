import { NextRequest, NextResponse } from 'next/server';
import { processGoogleAuth } from '@/lib/auth-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    const errorUrl = new URL('/', request.url);
    errorUrl.searchParams.set('auth_error', error || 'No authorization code provided');
    return NextResponse.redirect(errorUrl);
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/auth/callback/google`;

    if (!clientId || !clientSecret) {
      const errorUrl = new URL('/', request.url);
      errorUrl.searchParams.set('auth_error', 'Google OAuth credentials missing on server');
      return NextResponse.redirect(errorUrl);
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
      const errorUrl = new URL('/', request.url);
      errorUrl.searchParams.set('auth_error', tokenData.error_description || 'Failed to exchange Google token');
      return NextResponse.redirect(errorUrl);
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

    const redirectHome = new URL('/', request.url);
    const response = NextResponse.redirect(redirectHome);

    if (authResult.data.success && (authResult.data as any).token) {
      response.cookies.set('cg_auth_token', (authResult.data as any).token, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (err: any) {
    const errorUrl = new URL('/', request.url);
    errorUrl.searchParams.set('auth_error', err.message || 'OAuth error');
    return NextResponse.redirect(errorUrl);
  }
}
