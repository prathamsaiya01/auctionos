'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isLoading } = useAuthStore();

  const isPublicRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/invite/') ||
    pathname.startsWith('/display/') ||
    pathname.startsWith('/overlay/');

  useEffect(() => {
    if (!isLoading && !token && !isPublicRoute) {
      router.replace('/login');
    }
  }, [token, isLoading, isPublicRoute, router]);

  if (isLoading && !isPublicRoute) {
    return (
      <div className="flex h-screen items-center justify-center bg-admin-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-admin-muted">Authenticating AuctionOS Session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
