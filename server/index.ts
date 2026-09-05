import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import cors from 'cors';
import { setupSocketHandlers } from './socket/handler';
import net from 'net';
import { connectDB } from './db';

const defaultPort = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: process.cwd() });
const nextHandler = nextApp.getRequestHandler();

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => {
        resolve(false);
      })
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port);
  });
}

async function findAvailablePort(startPort: number, maxAttempts = 10): Promise<number> {
  let port = startPort;
  for (let i = 0; i < maxAttempts; i++) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
    console.warn(`⚠️ Port ${port} is currently in use. Automatically switching to port ${port + 1}...`);
    port++;
  }
  return port;
}

function listenServer(server: http.Server, targetPort: number, maxAttempts = 10): Promise<number> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tryListen = (p: number) => {
      attempts++;
      const onError = (err: any) => {
        server.removeListener('listening', onListening);
        if (err.code === 'EADDRINUSE' && attempts < maxAttempts) {
          console.warn(`⚠️ Port ${p} is in use (EADDRINUSE). Switching to port ${p + 1}...`);
          tryListen(p + 1);
        } else {
          reject(err);
        }
      };

      const onListening = () => {
        server.removeListener('error', onError);
        resolve(p);
      };

      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(p);
    };

    tryListen(targetPort);
  });
}

async function bootstrap() {
  // Connect to MongoDB
  await connectDB();

  await nextApp.prepare();

  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  setupSocketHandlers(io);

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Next.js App Router & Pages
  app.all('*', (req, res) => {
    return nextHandler(req, res);
  });

  const targetPort = await findAvailablePort(defaultPort);
  const activePort = await listenServer(server, targetPort);

  process.env.PORT = String(activePort);

  console.log(`\n======================================================`);
  console.log(`♠ ♥ CARD GAMES BY MADHAV - GAME SERVER ACTIVE ♦ ♣`);
  console.log(`Ready on: http://localhost:${activePort}`);
  console.log(`Environment: ${dev ? 'development' : 'production'}`);
  console.log(`======================================================\n`);
}

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});

process.on('exit', (code) => {
  console.log(`Node process exited with code: ${code}`);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM');
});

bootstrap().catch((err) => {
  console.error("Failed to start game server:", err);
  process.exit(1);
});
