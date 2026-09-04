import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    // When running unified server, connect to window.location.origin
    const url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    
    socketInstance = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Connected to Card Games By Madhav server:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('⚠️ Disconnected from server:', reason);
    });
  }

  return socketInstance;
}
