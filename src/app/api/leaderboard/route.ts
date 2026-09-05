import { NextResponse } from 'next/server';
import { getGlobalLeaderboard } from '../../../../server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leaderboard = await getGlobalLeaderboard(50);
    return NextResponse.json({ success: true, leaderboard });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
