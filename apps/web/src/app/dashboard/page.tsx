'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminNavbar } from '@/components/layout/AdminNavbar';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState, SkeletonCard } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import {
  Trophy,
  Users,
  UserCheck,
  Plus,
  ArrowRight,
  Calendar,
  MapPin,
  Gavel,
  ShieldAlert,
  Tv,
  Sparkles,
  FileSpreadsheet,
  Clock,
  TrendingUp,
  Layers
} from 'lucide-react';

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTourName, setNewTourName] = useState('');
  const [newTourSport, setNewTourSport] = useState('Cricket');
  const [newTourPurse, setNewTourPurse] = useState(50000);
  const [newMinSquad, setNewMinSquad] = useState(5);
  const [newMaxSquad, setNewMaxSquad] = useState(15);
  const [newLocation, setNewLocation] = useState('Wankhede Stadium, Mumbai');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tournamentsData, isLoading, refetch } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res: any = await api.get('/tournaments');
      return res.data;
    }
  });

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const orgs: any = await api.get('/organizations');
      const orgId = orgs.data?.[0]?.id;

      if (!orgId) {
        alert('No organization found. Please seed or create an organization first.');
        return;
      }

      await api.post('/tournaments', {
        organizationId: orgId,
        name: newTourName,
        sport: newTourSport,
        initialPurse: Number(newTourPurse),
        location: newLocation,
        season: '2027',
        minSquadSize: Number(newMinSquad),
        maxSquadSize: Number(newMaxSquad)
      });

      setShowCreateModal(false);
      setNewTourName('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Error creating tournament');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tournaments = tournamentsData || [];

  const totalTeams = tournaments.reduce((acc: number, t: any) => acc + (t._count?.teams || 0), 0);
  const totalPlayers = tournaments.reduce((acc: number, t: any) => acc + (t._count?.players || 0), 0);
  const totalAuctions = tournaments.reduce((acc: number, t: any) => acc + (t._count?.auctions || 0), 0);

  return (
    <div className="flex min-h-screen bg-admin-bg">
      <AdminSidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          title="Tournament Management Hub"
          subtitle="Directory and live analytics for all sports franchise tournaments"
          actions={
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Tournament
            </Button>
          }
        />

        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Welcome Banner Card */}
          <div className="relative rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-700 to-blue-700 p-8 text-white shadow-xl overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-purple-200 border border-white/15 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Premier Sports Tech SaaS</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                Good evening, Organizer
              </h2>
              <p className="text-blue-100 text-xs md:text-sm mt-1.5 leading-relaxed font-medium">
                Here's what's happening across your tournaments. Manage franchise purses, conduct real-time multiplayer auctions, and broadcast live to spectators.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-6">
                <Button
                  variant="dark"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  icon={<Plus className="w-4 h-4" />}
                >
                  New Tournament
                </Button>
                {tournaments[0] && (
                  <Link href={`/tournaments/${tournaments[0].id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xs"
                      icon={<ArrowRight className="w-4 h-4" />}
                      iconPosition="right"
                    >
                      Open {tournaments[0].name}
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute right-0 bottom-0 top-0 w-96 bg-gradient-to-l from-white/10 to-transparent pointer-events-none hidden lg:block" />
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard
              label="Tournaments"
              value={tournaments.length}
              subtitle="Active leagues"
              icon={<Trophy className="w-5 h-5" />}
              colorTheme="violet"
            />
            <MetricCard
              label="Franchise Teams"
              value={totalTeams}
              subtitle="Across all leagues"
              icon={<Users className="w-5 h-5" />}
              colorTheme="blue"
            />
            <MetricCard
              label="Registered Players"
              value={totalPlayers}
              subtitle="Verified cricketers"
              icon={<UserCheck className="w-5 h-5" />}
              colorTheme="emerald"
            />
            <MetricCard
              label="Auctions Ready"
              value={totalAuctions}
              subtitle="Live sync active"
              icon={<Gavel className="w-5 h-5" />}
              colorTheme="amber"
            />
          </div>

          {/* Tournaments Grid Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-admin-text tracking-tight">Active Tournaments</h3>
                <p className="text-xs text-admin-muted">Manage roster, franchise owners, and auction stage</p>
              </div>
              <Badge variant="neutral" size="sm">
                {tournaments.length} registered
              </Badge>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : tournaments.length === 0 ? (
              <EmptyState
                icon={<Trophy className="w-8 h-8" />}
                title="No Tournaments Created Yet"
                description="Get started by setting up your first cricket tournament, configuring franchise purse limits, and importing player rosters."
                actionLabel="Create Tournament"
                onAction={() => setShowCreateModal(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((tournament: any) => (
                  <div
                    key={tournament.id}
                    className="bg-white rounded-3xl border border-admin-border/80 shadow-xs hover:shadow-premium hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-brand-50 text-brand-600 rounded-full border border-brand-100">
                          {tournament.sport} • Season {tournament.season}
                        </span>
                        <Badge
                          variant={tournament.status === 'AUCTION_LIVE' ? 'live' : 'success'}
                          size="xs"
                          dot
                        >
                          {tournament.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <h4 className="text-lg font-black text-admin-text leading-snug group-hover:text-brand-600 transition-colors">
                        {tournament.name}
                      </h4>
                      <p className="text-xs text-admin-muted mt-1.5 line-clamp-2 leading-relaxed">
                        {tournament.description || 'Premier competitive player auction and league management.'}
                      </p>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-brand-500" />
                          <span className="font-bold text-gray-900">{tournament._count?.teams || 0}</span> Teams
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-emerald-500" />
                          <span className="font-bold text-gray-900">{tournament._count?.players || 0}</span> Players
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Gavel className="w-4 h-4 text-purple-500" />
                          <span className="font-bold text-gray-900">{tournament._count?.auctions || 0}</span> Auctions
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50/70 border-t border-admin-border flex items-center justify-between">
                      <Link
                        href={`/tournaments/${tournament.id}`}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                      >
                        <span>Manage Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tournaments/${tournament.id}/teams`}
                          className="px-2.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-[11px] font-bold text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors"
                        >
                          Teams
                        </Link>
                        <Link
                          href={`/tournaments/${tournament.id}/import`}
                          className="px-2.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-[11px] font-bold text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors"
                        >
                          Import
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Tournament Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Tournament"
        subtitle="Configure a new franchise league, initial purse rules and player limits."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTournament} className="space-y-4">
          <Input
            label="Tournament Name"
            required
            value={newTourName}
            onChange={(e) => setNewTourName(e.target.value)}
            placeholder="e.g. Bangalore Premier League 2027"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Sport"
              value={newTourSport}
              onChange={(e) => setNewTourSport(e.target.value)}
            >
              <option value="Cricket">Cricket</option>
              <option value="Football">Football</option>
              <option value="Badminton">Badminton</option>
              <option value="Kabaddi">Kabaddi</option>
            </Select>

            <Input
              label="Initial Purse (₹)"
              type="number"
              required
              min="1000"
              value={newTourPurse}
              onChange={(e) => setNewTourPurse(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min Squad Size"
              type="number"
              min="1"
              value={newMinSquad}
              onChange={(e) => setNewMinSquad(Number(e.target.value))}
            />
            <Input
              label="Max Squad Size"
              type="number"
              min="1"
              value={newMaxSquad}
              onChange={(e) => setNewMaxSquad(Number(e.target.value))}
            />
          </div>

          <Input
            label="Tournament Venue"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="e.g. Wankhede Stadium, Mumbai"
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-admin-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Create Tournament
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
