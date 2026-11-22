import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { SOCKET_EVENTS, SOCKET_ROOMS, UserRole } from '@auctionos/shared';

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    teamId?: string | null;
  };
}

let ioInstance: Server | null = null;

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized!');
  }
  return ioInstance;
}

export function setupSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow web app, public display, OBS overlays
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  ioInstance = io;

  // Socket Auth Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token || typeof token !== 'string') {
      // Spectator / Public viewer without token
      socket.user = {
        id: 'anonymous',
        email: 'anonymous@spectator.com',
        role: UserRole.SPECTATOR
      };
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      socket.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        teamId: socket.handshake.auth?.teamId || null
      };
      next();
    } catch (err) {
      // Allow fallback to public spectator
      socket.user = {
        id: 'anonymous',
        email: 'anonymous@spectator.com',
        role: UserRole.SPECTATOR
      };
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`[Socket] Connected: ${socket.id} (User: ${socket.user?.email}, Role: ${socket.user?.role})`);

    // Handle Join Auction Room
    socket.on(SOCKET_EVENTS.AUCTION_JOIN, (data: { auctionId: string; tournamentId?: string; teamId?: string }) => {
      const { auctionId, tournamentId, teamId } = data;
      if (!auctionId) return;

      // Join generic auction room
      socket.join(SOCKET_ROOMS.auction(auctionId));
      socket.join(SOCKET_ROOMS.auctionPublic(auctionId));

      if (tournamentId) {
        socket.join(SOCKET_ROOMS.tournament(tournamentId));
      }

      // If Admin/Auctioneer, join admin room
      if (
        socket.user?.role === UserRole.SUPER_ADMIN ||
        socket.user?.role === UserRole.ORG_ADMIN ||
        socket.user?.role === UserRole.TOURNAMENT_ADMIN ||
        socket.user?.role === UserRole.AUCTIONEER ||
        socket.user?.role === UserRole.ASSISTANT_AUCTIONEER
      ) {
        socket.join(SOCKET_ROOMS.auctionAdmins(auctionId));
      }

      // If team owner, join team room
      const activeTeamId = teamId || socket.user?.teamId;
      if (activeTeamId) {
        socket.join(SOCKET_ROOMS.auctionTeam(auctionId, activeTeamId));
      }

      socket.emit(SOCKET_EVENTS.AUCTION_JOINED, {
        auctionId,
        socketId: socket.id,
        serverTime: new Date().toISOString()
      });
    });

    socket.on(SOCKET_EVENTS.AUCTION_LEAVE, (data: { auctionId: string }) => {
      if (data?.auctionId) {
        socket.leave(SOCKET_ROOMS.auction(data.auctionId));
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}
