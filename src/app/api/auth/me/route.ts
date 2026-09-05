import { NextRequest, NextResponse } from 'next/server';
import { processGetMe } from '@/lib/auth-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      token = request.cookies.get('cg_auth_token')?.value || null;
    }

    const result = await processGetMe(token);
    return NextResponse.json(result.data, { status: result.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
