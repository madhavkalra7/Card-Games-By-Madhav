import { NextResponse } from 'next/server';

// Always execute dynamically on the server
export const dynamic = 'force-dynamic';

export async function GET() {
  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_SOCKET_URL ||
    process.env.SOCKET_URL ||
    '';

  return NextResponse.json({
    socketUrl: socketUrl ? socketUrl.trim().replace(/\/$/, '') : '',
  });
}
