'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  ShieldCheck,
  ChevronDown,
  LogOut,
  User as UserIcon,
  HelpCircle,
  Trophy,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { disconnectSocket } from '@/lib/socket';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface AdminNavbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function AdminNavbar({ title, subtitle, actions, breadcrumbs }: AdminNavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleConfirmLogout = () => {
    disconnectSocket();
    logout();
    setShowProfileMenu(false);
    setShowLogoutDialog(false);
    router.replace('/login');
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-admin-border px-6 md:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        {/* Left: Title & Breadcrumbs */}
        <div className="flex flex-col justify-center min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 mb-0.5">
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={i}>
                  {b.href ? (
                    <Link href={b.href} className="hover:text-brand-600 transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-gray-600">{b.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <span>/</span>}
                </React.Fragment>
              ))}
            </div>
          )}
          <h1 className="text-lg md:text-xl font-black text-admin-text tracking-tight truncate">
            {title}
          </h1>
          {subtitle && !breadcrumbs && (
            <p className="text-[11px] text-admin-muted truncate">{subtitle}</p>
          )}
        </div>

        {/* Right: Actions & User Section */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          {actions}

          <div className="h-5 w-px bg-gray-200 hidden md:block" />

          {/* Database Live Sync Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/80 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px]">Database Active</span>
          </div>

          {/* Profile Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-admin-border p-2 z-50 animate-scale-up">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-black text-gray-900 truncate">{user?.fullName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md text-[9px] font-black uppercase">
                    {user?.role}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutDialog(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out of AuctionOS"
        description="Are you sure you want to end your current session? You will be redirected to the sign-in portal."
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        variant="danger"
        iconType="logout"
      />
    </>
  );
}
