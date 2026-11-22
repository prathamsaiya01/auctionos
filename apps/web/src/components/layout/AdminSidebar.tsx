'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Trophy,
  Users,
  UserCheck,
  FileSpreadsheet,
  Gavel,
  Bell,
  Settings,
  Layers,
  LogOut,
  ExternalLink,
  Tv,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { disconnectSocket } from '@/lib/socket';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface SidebarProps {
  tournamentId?: string;
  auctionId?: string;
}

export function AdminSidebar({ tournamentId, auctionId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    // Disconnect any active sockets
    disconnectSocket();
    // Clear user state & storage
    logout();
    setIsLoggingOut(false);
    setShowLogoutDialog(false);
    // Explicit router redirect to login
    router.replace('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard'
    },
    ...(tournamentId
      ? [
          {
            label: 'Overview',
            href: `/tournaments/${tournamentId}`,
            icon: Layers,
            active: pathname === `/tournaments/${tournamentId}`
          },
          {
            label: 'Franchise Teams',
            href: `/tournaments/${tournamentId}/teams`,
            icon: Users,
            active: pathname.includes('/teams')
          },
          {
            label: 'Player Database',
            href: `/tournaments/${tournamentId}/players`,
            icon: UserCheck,
            active: pathname.includes('/players')
          },
          {
            label: 'Excel / CSV Import',
            href: `/tournaments/${tournamentId}/import`,
            icon: FileSpreadsheet,
            active: pathname.includes('/import')
          },
          {
            label: 'Notifications',
            href: `/tournaments/${tournamentId}/notifications`,
            icon: Bell,
            active: pathname.includes('/notifications')
          }
        ]
      : [])
  ];

  return (
    <>
      <aside
        className={`bg-white border-r border-admin-border flex flex-col justify-between h-screen sticky top-0 shrink-0 transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-admin-border flex items-center justify-between">
            {!collapsed ? (
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-500/20 shrink-0">
                  A
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-black text-lg tracking-tight text-admin-text">AUCTION</span>
                    <span className="font-black text-lg tracking-tight text-brand-500">OS</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 block -mt-1 tracking-wide">
                    {user?.organization?.name || 'Sports SaaS'}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="w-9 h-9 mx-auto rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-base shadow-sm">
                A
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors hidden md:block"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {!collapsed && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-admin-muted px-3 py-2">
                Tournament Hub
              </div>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    item.active
                      ? 'bg-brand-50 text-brand-600 shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-brand-500' : 'text-gray-400'}`} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}

            {/* Live Auction Broadcast Links */}
            {auctionId && (
              <>
                {!collapsed && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-admin-muted px-3 pt-5 pb-2">
                    Live Broadcast Hub
                  </div>
                )}
                <div className="space-y-1 pt-1">
                  <Link
                    href={`/auctions/${auctionId}/auctioneer`}
                    target="_blank"
                    title={collapsed ? 'Auctioneer Console' : undefined}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black bg-slate-950 text-white hover:bg-black transition-all shadow-md shadow-slate-950/20 ${
                      collapsed ? 'justify-center px-0' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Gavel className="w-4 h-4 text-purple-400 shrink-0" />
                      {!collapsed && <span>Host Console</span>}
                    </div>
                    {!collapsed && <ExternalLink className="w-3.5 h-3.5 text-gray-500" />}
                  </Link>

                  <Link
                    href={`/display/${auctionId}`}
                    target="_blank"
                    title={collapsed ? 'Projector Display' : undefined}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                      collapsed ? 'justify-center px-0' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Tv className="w-4 h-4 text-blue-500 shrink-0" />
                      {!collapsed && <span>Projector (4K)</span>}
                    </div>
                    {!collapsed && <ExternalLink className="w-3.5 h-3.5 text-gray-400" />}
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>

        {/* User Footer with Full Logout Flow */}
        <div className="p-3 border-t border-admin-border bg-gray-50/60">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            {!collapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-100 to-indigo-100 text-brand-700 flex items-center justify-center font-black text-xs shrink-0 border border-brand-200">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-admin-text truncate">{user?.fullName || 'Organizer'}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user?.role || 'ORGANIZER'}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowLogoutDialog(true)}
              title="Sign Out of AuctionOS"
              className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors shrink-0"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out of AuctionOS"
        description="Are you sure you want to end your current session? You will be redirected to the sign-in portal."
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        variant="danger"
        iconType="logout"
        isLoading={isLoggingOut}
      />
    </>
  );
}
