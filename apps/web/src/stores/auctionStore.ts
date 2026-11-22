import { create } from 'zustand';
import { AuctionSnapshot, SOCKET_EVENTS } from '@auctionos/shared';
import { getSocket } from '../lib/socket';

export type ConnectionState = 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED' | 'SYNCING';

interface AuctionState {
  snapshot: AuctionSnapshot | null;
  connectionState: ConnectionState;
  selectedTeamId: string | null;
  activeCountdown: number;
  setSnapshot: (snapshot: AuctionSnapshot) => void;
  setSelectedTeamId: (teamId: string | null) => void;
  setConnectionState: (state: ConnectionState) => void;
  initSocket: (auctionId: string, token?: string, teamId?: string) => void;
}

export const useAuctionStore = create<AuctionState>((set, get) => ({
  snapshot: null,
  connectionState: 'DISCONNECTED',
  selectedTeamId: null,
  activeCountdown: 30,

  setSnapshot: (snapshot) => set({ snapshot }),
  setSelectedTeamId: (teamId) => set({ selectedTeamId: teamId }),
  setConnectionState: (connectionState) => set({ connectionState }),

  initSocket: (auctionId: string, token?: string, teamId?: string) => {
    const socket = getSocket(token, teamId);

    set({ connectionState: 'SYNCING' });

    socket.on('connect', () => {
      set({ connectionState: 'CONNECTED' });
      socket.emit(SOCKET_EVENTS.AUCTION_JOIN, { auctionId, teamId });
    });

    socket.on('disconnect', () => {
      set({ connectionState: 'DISCONNECTED' });
    });

    socket.on('reconnect_attempt', () => {
      set({ connectionState: 'RECONNECTING' });
    });

    socket.on(SOCKET_EVENTS.AUCTION_STATE_SNAPSHOT, (newSnapshot: AuctionSnapshot) => {
      set({ snapshot: newSnapshot, connectionState: 'CONNECTED' });
    });
  }
}));
