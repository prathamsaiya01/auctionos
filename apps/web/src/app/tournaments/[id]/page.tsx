'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminNavbar } from '@/components/layout/AdminNavbar';
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
  Layers
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
      <div className="flex min-h-screen bg-admin-secondary">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm font-semibold text-gray-400">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen bg-admin-secondary">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <p className="text-sm font-semibold text-red-500">Tournament not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-admin-secondary">
      <AdminSidebar tournamentId={tournament.id} auctionId={auction?.id} />

      <main className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          title={tournament.name}
          subtitle={`${tournament.sport} • Season ${tournament.season} • ${tournament.location || 'Central Venue'}`}
          actions={
            auction ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/auctions/${auction.id}/auctioneer`}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Gavel className="w-3.5 h-3.5" />
                  <span>Launch Auctioneer Console</span>
                </Link>
                <Link
                  href={`/display/${auction.id}`}
                  target="_blank"
                  className="flex items-center gap-2 px-3.5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Projector</span>
                </Link>
              </div>
            ) : null
          }
        />

        <div className="p-8 space-y-8">
          {/* Hero Banner Card */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold mb-4 border border-white/20">
                <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                <span>{tournament.status}</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight">{tournament.name}</h2>
              <p className="text-blue-100 text-sm mt-2 leading-relaxed">
                {tournament.description || 'Complete real-time cricket player auction with multiplayer bidding, automated WhatsApp notifications and team purse controls.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-blue-200 block">Initial Purse</span>
                  <span className="text-lg font-black">₹{Number(tournament.settings?.initialPurse || 50000).toLocaleString()}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-blue-200 block">Squad Limits</span>
                  <span className="text-lg font-black">{tournament.settings?.minSquadLimit || 5} to {tournament.settings?.maxSquadLimit || 15} Players</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Modules Quick Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href={`/tournaments/${tournament.id}/teams`}
              className="bg-white p-6 rounded-2xl border border-admin-border shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-admin-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center justify-between">
                Teams & Franchise Purses
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {tournament.teams?.length || 0} teams registered. Invite owners via WhatsApp / email, track purse deductions.
              </p>
            </Link>

            <Link
              href={`/tournaments/${tournament.id}/players`}
              className="bg-white p-6 rounded-2xl border border-admin-border shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-50 text-admin-success flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center justify-between">
                Player Database
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {tournament._count?.players || 0} players registered. Complete cricket stats, base prices and verification statuses.
              </p>
            </Link>

            <Link
              href={`/tournaments/${tournament.id}/import`}
              className="bg-white p-6 rounded-2xl border border-admin-border shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center justify-between">
                Excel / CSV Import Engine
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Upload hundreds of players in seconds with intelligent column auto-mapping and direct auction pool queuing.
              </p>
            </Link>
          </div>

          {/* Teams Summary Table */}
          <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Participating Teams</h3>
              <Link
                href={`/tournaments/${tournament.id}/teams`}
                className="text-xs font-bold text-admin-primary hover:underline"
              >
                View all team ledgers →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tournament.teams?.map((team: any) => (
                <div key={team.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.abbreviation}
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-sm text-gray-900 truncate">{team.name}</h4>
                      <p className="text-[11px] text-gray-500">
                        Purse: <span className="font-bold text-gray-800">₹{Number(team.remainingPurse).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Purchases</span>
                    <span className="font-bold text-blue-600">{team._count?.purchases || 0} Players</span>
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
