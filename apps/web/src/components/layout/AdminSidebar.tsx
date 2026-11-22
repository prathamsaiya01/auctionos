'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Tv
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface SidebarProps {
  tournamentId?: string;
  auctionId?: string;
}

export function AdminSidebar({ tournamentId, auctionId }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navItems = [
    {
      label: 'Tournaments',
      href: '/dashboard',
      icon: Trophy,
      active: pathname === '/dashboard'
    },
    ...(tournamentId
      ? [
          {
            label: 'Tournament Overview',
            href: `/tournaments/${tournamentId}`,
            icon: Layers,
            active: pathname === `/tournaments/${tournamentId}`
          },
          {
            label: 'Teams & Purse',
            href: `/tournaments/${tournamentId}/teams`,
            icon: Users,
            active: pathname.includes('/teams')
          },
          {
            label: 'Players Roster',
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
            label: 'Notifications Log',
            href: `/tournaments/${tournamentId}/notifications`,
            icon: Bell,
            active: pathname.includes('/notifications')
          }
        ]
      : [])
  ];

  return (
    <aside className="w-64 bg-white border-r border-admin-border flex flex-col justify-between h-screen sticky top-0 shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-admin-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-admin-primary to-admin-purple flex items-center justify-center text-white font-bold text-lg shadow-sm">
              A
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-admin-text">AUCTION</span>
              <span className="font-extrabold text-xl tracking-tight text-admin-primary">OS</span>
            </div>
          </Link>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            SaaS v1.0
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-admin-muted px-3 py-2">
            Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-blue-50 text-admin-primary font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.active ? 'text-admin-primary' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}

          {auctionId && (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-admin-muted px-3 pt-5 pb-2">
                Live Auction Links
              </div>
              <Link
                href={`/auctions/${auctionId}/auctioneer`}
                target="_blank"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-black transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Gavel className="w-4 h-4 text-purple-400" />
                  <span>Auctioneer Console</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </Link>
              <Link
                href={`/display/${auctionId}`}
                target="_blank"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Tv className="w-4 h-4 text-blue-500" />
                  <span>Projector Display</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-admin-border bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.fullName || 'Organizer'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.role || 'TOURNAMENT_ADMIN'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
