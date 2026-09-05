import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import cors from 'cors';
import { setupSocketHandlers } from './socket/handler';
import net from 'net';
import { connectDB, getGlobalLeaderboard, getUserFriendsList, addUserFriend } from './db';
import { authRouter } from './routes/auth';
import { verifyAuthToken } from '../src/lib/auth-token';

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

  // Authentication & Profile endpoints
  app.use('/api/auth', authRouter);

  // Global Leaderboard endpoint
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const leaderboard = await getGlobalLeaderboard(50);
      res.json({ success: true, leaderboard });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Friends endpoints
  app.get('/api/friends', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      if (!token && req.headers.cookie) {
        const match = req.headers.cookie.match(/cg_auth_token=([^;]+)/);
        if (match) token = match[1];
      }
      if (!token) return res.json({ success: false, friends: [] });
      const payload = verifyAuthToken(token);
      if (!payload) return res.json({ success: false, friends: [] });
      const friends = await getUserFriendsList(payload.userId);
      res.json({ success: true, friends });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/friends', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      if (!token && req.headers.cookie) {
        const match = req.headers.cookie.match(/cg_auth_token=([^;]+)/);
        if (match) token = match[1];
      }
      if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
      const payload = verifyAuthToken(token);
      if (!payload) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const { friendEmailOrName } = req.body || {};
      if (!friendEmailOrName) return res.status(400).json({ success: false, error: 'Provide friend name or email' });
      const result = await addUserFriend(payload.userId, friendEmailOrName);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
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
