import { NextRequest, NextResponse } from 'next/server';
import { processLogin } from '@/lib/auth-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await processLogin(body);

    const response = NextResponse.json(result.data, { status: result.status });
    if (result.data.success && (result.data as any).token) {
      response.cookies.set('cg_auth_token', (result.data as any).token, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
      });
    }
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Login failed' },
      { status: 500 }
    );
  }
}
