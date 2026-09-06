import { io, Socket } from 'socket.io-client';

const DEFAULT_REMOTE_BACKEND = 'https://card-casino-backend.onrender.com';

let socketInstance: Socket | null = null;
let currentTargetUrl: string | null = null;
let urlPromise: Promise<string> | null = null;

/**
 * Resolves the backend server URL.
 * 1. Checks build-time `NEXT_PUBLIC_SOCKET_URL`
 * 2. If running on Vercel and not set, queries `/api/socket-url` fallback (supports `NEXT_SOCKET_URL`)
 * 3. Falls back to DEFAULT_REMOTE_BACKEND for production/Vercel or localhost for dev
 */
export async function resolveBackendUrl(): Promise<string> {
  // If in browser:
  if (typeof window !== 'undefined') {
    const isLocalhostClient = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // 1. Check build-time public env variable
    const envPublic = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (envPublic && envPublic.trim() !== '') {
      const trimmed = envPublic.trim().replace(/\/$/, '');
      if (isLocalhostClient || (!trimmed.includes('localhost') && !trimmed.includes('127.0.0.1'))) {
        currentTargetUrl = trimmed;
        return currentTargetUrl;
      }
    }

    // 2. Query runtime server endpoint
    if (!urlPromise) {
      urlPromise = fetch('/api/socket-url')
        .then((res) => res.json())
        .then((data) => {
          if (data?.socketUrl && typeof data.socketUrl === 'string' && data.socketUrl.trim() !== '') {
            const url = data.socketUrl.trim().replace(/\/$/, '');
            // Only use if client is localhost OR socketUrl is not localhost
            if (isLocalhostClient || (!url.includes('localhost') && !url.includes('127.0.0.1'))) {
              currentTargetUrl = url;
              return url;
            }
          }
          return isLocalhostClient ? window.location.origin : DEFAULT_REMOTE_BACKEND;
        })
        .catch((err) => {
          console.warn('⚠️ Could not fetch /api/socket-url fallback:', err);
          return isLocalhostClient ? window.location.origin : DEFAULT_REMOTE_BACKEND;
        });
    }

    const fetchedUrl = await urlPromise;
    currentTargetUrl = fetchedUrl;
    return currentTargetUrl;
  }

  return `http://localhost:${process.env.PORT || '3000'}`;
}

export function getSocket(overrideUrl?: string): Socket {
  const isBrowser = typeof window !== 'undefined';
  const isLocalhostClient = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  let targetUrl = overrideUrl || currentTargetUrl || process.env.NEXT_PUBLIC_SOCKET_URL;
  
  // Mobile / Remote LAN / Vercel safety:
  // If running remotely, never allow localhost or Vercel origin (Vercel has no websockets)
  if (isBrowser && !isLocalhostClient) {
    if (!targetUrl || targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1') || targetUrl === window.location.origin) {
      targetUrl = DEFAULT_REMOTE_BACKEND;
    }
  }

  if (!targetUrl) {
    targetUrl = isBrowser ? (isLocalhostClient ? window.location.origin : DEFAULT_REMOTE_BACKEND) : `http://localhost:${process.env.PORT || '3000'}`;
  }
  targetUrl = targetUrl.trim().replace(/\/$/, '');

  // If socket already exists and target URL has changed, disconnect and reconnect
  if (socketInstance && (socketInstance as any).__connectedUrl !== targetUrl) {
    console.log(`🔄 Re-pointing socket from ${(socketInstance as any).__connectedUrl} to ${targetUrl}`);
    socketInstance.disconnect();
    socketInstance = null;
  }

  if (!socketInstance) {
    currentTargetUrl = targetUrl;
    socketInstance = io(targetUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    (socketInstance as any).__connectedUrl = targetUrl;

    socketInstance.on('connect', () => {
      console.log('⚡ Connected to Card Games By Madhav server at:', targetUrl, '| Socket ID:', socketInstance?.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error to', targetUrl, ':', err.message);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('⚠️ Disconnected from server:', reason);
    });
  }

  return socketInstance;
}

// Background auto-detection on browser load
if (typeof window !== 'undefined') {
  resolveBackendUrl().then((url) => {
    if (url && socketInstance && (socketInstance as any).__connectedUrl !== url) {
      getSocket(url);
    }
  });
}

