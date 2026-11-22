import http from 'http';
import { createApp } from './app';
import { setupSocketServer } from './sockets/socketServer';
import { config } from './config/env';
import { startOutboxWorker } from './jobs/outboxWorker';
import { prisma } from '@auctionos/database';

async function bootstrap() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('✅ PostgreSQL Database connection established.');

    const app = createApp();
    const server = http.createServer(app);

    // Initialize real-time Socket.io server
    setupSocketServer(server);
    console.log('✅ Socket.io Real-time server initialized.');

    // Start background outbox notification worker
    startOutboxWorker(3000);

    server.listen(config.port, () => {
      console.log(`🚀 AUCTIONOS API Server running on http://localhost:${config.port}`);
      console.log(`📡 Socket.io Server listening on ws://localhost:${config.port}`);
    });
  } catch (err) {
    console.error('Fatal error starting AUCTIONOS API server:', err);
    process.exit(1);
  }
}

bootstrap();
