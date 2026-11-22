'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Trophy, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface AdminNavbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminNavbar({ title, subtitle, actions }: AdminNavbarProps) {
  const { user } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b border-admin-border px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div>
        <h1 className="text-xl font-bold text-admin-text tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-admin-muted mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {actions}

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>PostgreSQL Active</span>
        </div>
      </div>
    </header>
  );
}
