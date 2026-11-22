'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminNavbar } from '@/components/layout/AdminNavbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Trophy,
  Users,
  UserCheck,
  Gavel,
  Tv,
  FileSpreadsheet,
  ArrowRight,
  Play,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  MapPin,
  Calendar,
  Wallet
} from 'lucide-react';

export default function TournamentDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const res: any = await api.get(`/tournaments/${id}`);
      return res.data;
    },
    enabled: !!id
  });

  const auction = tournament?.auctions?.[0];

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-admin-bg">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-admin-muted">Loading tournament details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen bg-admin-bg">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <p className="text-sm font-bold text-red-500">Tournament not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-admin-bg">
      <AdminSidebar tournamentId={tournament.id} auctionId={auction?.id} />

      <main className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          title={tournament.name}
          breadcrumbs={[
            { label: 'Tournaments', href: '/dashboard' },
            { label: tournament.name }
          ]}
          actions={
            auction ? (
              <div className="flex items-center gap-2">
                <Link href={`/auctions/${auction.id}/auctioneer`} target="_blank">
                  <Button variant="primary" size="sm" icon={<Gavel className="w-3.5 h-3.5" />}>
                    Launch Console
                  </Button>
                </Link>
                <Link href={`/display/${auction.id}`} target="_blank">
                  <Button variant="dark" size="sm" icon={<Tv className="w-3.5 h-3.5" />}>
                    Projector
                  </Button>
                </Link>
              </div>
            ) : null
          }
        />

        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Hero Banner Card */}
          <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl overflow-hidden border border-slate-800">
            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-purple-300 border border-white/10">
                  {tournament.sport} • Season {tournament.season}
                </span>
                <Badge variant={tournament.status === 'AUCTION_LIVE' ? 'live' : 'success'} size="xs" dot>
                  {tournament.status.replace('_', ' ')}
                </Badge>
              </div>

              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                {tournament.name}
              </h2>
              <p className="text-gray-300 text-xs md:text-sm mt-2 leading-relaxed max-w-2xl font-medium">
                {tournament.description || 'Complete real-time cricket player auction with multiplayer bidding, automated WhatsApp notifications and team purse controls.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Initial Franchise Purse</span>
                    <span className="text-base font-black text-white tabular-nums">
                      ₹{Number(tournament.settings?.initialPurse || 50000).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
                  <Users className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Squad Limits</span>
                    <span className="text-base font-black text-white">
                      {tournament.settings?.minSquadLimit || 5} to {tournament.settings?.maxSquadLimit || 15} Players
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Venue</span>
                    <span className="text-base font-black text-white">
                      {tournament.location || 'Central Arena'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live broadcast pill on the right */}
            {auction && (
              <div className="absolute right-8 top-8 hidden xl:flex flex-col items-end gap-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Live Auction Ready
                </span>
                <span className="text-xs text-gray-400">{auction.name}</span>
              </div>
            )}
          </div>

          {/* Core Modules 3-Column Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href={`/tournaments/${tournament.id}/teams`}
              className="bg-white p-6 rounded-3xl border border-admin-border/80 shadow-xs hover:shadow-premium hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-blue-100">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-black text-admin-text text-lg tracking-tight group-hover:text-brand-600 transition-colors flex items-center justify-between">
                  Franchise Teams & Purse
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-admin-muted mt-1.5 leading-relaxed">
                  {tournament.teams?.length || 0} teams registered. Invite owners via WhatsApp / email, track purse deductions.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-bold">
                <span>{tournament.teams?.length || 0} Franchises</span>
                <span className="text-brand-600">Open Roster →</span>
              </div>
            </Link>

            <Link
              href={`/tournaments/${tournament.id}/players`}
              className="bg-white p-6 rounded-3xl border border-admin-border/80 shadow-xs hover:shadow-premium hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-emerald-100">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="font-black text-admin-text text-lg tracking-tight group-hover:text-brand-600 transition-colors flex items-center justify-between">
                  Player Database
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-admin-muted mt-1.5 leading-relaxed">
                  {tournament._count?.players || 0} players registered. Full stats, base prices, categories, and verification status.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-bold">
                <span>{tournament._count?.players || 0} Cricketers</span>
                <span className="text-brand-600">View Roster →</span>
              </div>
            </Link>

            <Link
              href={`/tournaments/${tournament.id}/import`}
              className="bg-white p-6 rounded-3xl border border-admin-border/80 shadow-xs hover:shadow-premium hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-amber-100">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="font-black text-admin-text text-lg tracking-tight group-hover:text-brand-600 transition-colors flex items-center justify-between">
                  Excel & CSV Import
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-admin-muted mt-1.5 leading-relaxed">
                  Upload spreadsheets with smart column mapping. Automatically queue players directly into live auction lots.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-bold">
                <span>Bulk Importer</span>
                <span className="text-brand-600">Start Import →</span>
              </div>
            </Link>
          </div>

          {/* Franchise Teams Ledger Summary */}
          <div className="bg-white rounded-3xl border border-admin-border shadow-xs p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-admin-text tracking-tight">Franchise Teams & Purses</h3>
                <p className="text-xs text-admin-muted">Live purse balances, spending, and squad acquisitions</p>
              </div>

              <Link href={`/tournaments/${tournament.id}/teams`}>
                <Button variant="outline" size="xs">
                  Manage Franchises
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tournament.teams?.map((team: any) => (
                <div
                  key={team.id}
                  className="p-5 rounded-2xl border border-admin-border bg-gray-50/50 hover:bg-white hover:shadow-subtle transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-xs shrink-0"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.abbreviation}
                    </div>
                    <div className="truncate">
                      <h4 className="font-black text-sm text-admin-text truncate">{team.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {team.abbreviation} Franchise
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">Purse Left</span>
                      <span className="font-black text-brand-600 tabular-nums">
                        ₹{Number(team.remainingPurse).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">Purchased</span>
                      <span className="font-black text-gray-900">
                        {team._count?.purchases || 0} Players
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
