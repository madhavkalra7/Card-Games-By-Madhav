import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-token';
import { getUserFriendsList, addUserFriend } from '../../../../server/db';

export const dynamic = 'force-dynamic';

function getUserIdFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    token = req.cookies.get('cg_auth_token')?.value || null;
  }
  if (!token) return null;
  const payload = verifyAuthToken(token);
  return payload?.userId || null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, friends: [] });
    }

    const friends = await getUserFriendsList(userId);
    return NextResponse.json({ success: true, friends });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { friendEmailOrName } = body || {};

    if (!friendEmailOrName || typeof friendEmailOrName !== 'string' || !friendEmailOrName.trim()) {
      return NextResponse.json({ success: false, error: 'Please provide friend name or email' }, { status: 400 });
    }

    const result = await addUserFriend(userId, friendEmailOrName.trim());
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
