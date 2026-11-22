import { create } from 'zustand';
import { UserRole } from '@auctionos/shared';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organization?: { id: string; name: string; slug: string } | null;
  teams?: Array<{
    teamId: string;
    teamName: string;
    abbreviation: string;
    color: string;
    role: string;
    canBid: boolean;
  }>;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auctionos_token', token);
      localStorage.setItem('auctionos_user', JSON.stringify(user));
    }
    set({ user, token, isLoading: false });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auctionos_token');
      localStorage.removeItem('auctionos_user');
    }
    set({ user: null, token: null, isLoading: false });
  },
  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auctionos_token');
      const userStr = localStorage.getItem('auctionos_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isLoading: false });
          return;
        } catch {
          // ignore parsing error
        }
      }
    }
    set({ isLoading: false });
  }
}));
