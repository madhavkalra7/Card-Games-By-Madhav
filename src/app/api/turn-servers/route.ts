import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const turnUrl =
    process.env.NEXT_PUBLIC_TURN_URL ||
    process.env.TURN_URL ||
    '';
  const username =
    process.env.NEXT_PUBLIC_TURN_USERNAME ||
    process.env.TURN_USERNAME ||
    '';
  const credential =
    process.env.NEXT_PUBLIC_TURN_CREDENTIAL ||
    process.env.TURN_CREDENTIAL ||
    '';

  return NextResponse.json({
    turnUrl: turnUrl.trim(),
    username: username.trim(),
    credential: credential.trim(),
  });
}
