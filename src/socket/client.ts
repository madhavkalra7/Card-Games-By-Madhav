import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    // Check for custom backend URL (for Vercel deployments), otherwise fallback to current origin
    const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const url = envUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    socketInstance = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      timeout: 8000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Connected to Card Games By Madhav server at:', url, '| Socket ID:', socketInstance?.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error to', url, ':', err.message);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('⚠️ Disconnected from server:', reason);
    });
  }

  return socketInstance;
}
