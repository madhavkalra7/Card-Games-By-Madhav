import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import cors from 'cors';
import { setupSocketHandlers } from './socket/handler';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: process.cwd() });
const nextHandler = nextApp.getRequestHandler();

async function bootstrap() {
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

  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`♠ ♥ CARD GAMES BY MADHAV - GAME SERVER ACTIVE ♦ ♣`);
    console.log(`Ready on: http://localhost:${port}`);
    console.log(`Environment: ${dev ? 'development' : 'production'}`);
    console.log(`======================================================\n`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start game server:", err);
  process.exit(1);
});
