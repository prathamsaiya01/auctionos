'use client';

import React, { useEffect } from 'react';
import './globals.css';
import { useAuthStore } from '../stores/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <html lang="en">
      <head>
        <title>AuctionOS — Sports Player Auction & Tournament Management SaaS</title>
        <meta name="description" content="Every Bid. Every Player. Every Tournament. One Platform." />
      </head>
      <body className="bg-admin-secondary text-admin-text min-h-screen antialiased">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
