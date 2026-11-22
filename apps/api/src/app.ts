import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './modules/auth/authRoutes';
import orgRoutes from './modules/organizations/organizationRoutes';
import tournamentRoutes from './modules/tournaments/tournamentRoutes';
import teamRoutes from './modules/teams/teamRoutes';
import invitationRoutes from './modules/invitations/invitationRoutes';
import playerRoutes from './modules/players/playerRoutes';
import importRoutes from './modules/imports/importRoutes';
import auctionRoutes from './modules/auctions/auctionRoutes';
import notificationRoutes from './modules/notifications/notificationRoutes';
import publicRoutes from './modules/public/publicRoutes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): express.Application {
  const app = express();

  // Security & Utility Middleware
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({
    origin: '*',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'AUCTIONOS_API',
      timestamp: new Date().toISOString()
    });
  });

  // REST API Routes under /api/v1
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/organizations', orgRoutes);
  app.use('/api/v1/tournaments', tournamentRoutes);
  app.use('/api/v1/teams', teamRoutes);
  app.use('/api/v1/invitations', invitationRoutes);
  app.use('/api/v1/players', playerRoutes);
  app.use('/api/v1/imports', importRoutes);
  app.use('/api/v1/auctions', auctionRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/public', publicRoutes);

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
