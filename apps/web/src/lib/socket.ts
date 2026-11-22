import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(token?: string, teamId?: string): Socket {
  if (!socket) {
    const savedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auctionos_token') || '' : '');

    socket = io(SOCKET_URL, {
      auth: {
        token: savedToken,
        teamId
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
