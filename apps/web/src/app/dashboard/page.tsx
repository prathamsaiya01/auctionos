'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { AdminNavbar } from '../../components/layout/AdminNavbar';
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
  Tv
} from 'lucide-react';

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTourName, setNewTourName] = useState('');
  const [newTourSport, setNewTourSport] = useState('Cricket');
  const [newTourPurse, setNewTourPurse] = useState(50000);

  const { data: tournamentsData, isLoading, refetch } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res: any = await api.get('/tournaments');
      return res.data;
    }
  });

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
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
        season: '2027',
        minSquadSize: 5,
        maxSquadSize: 15
      });

      setShowCreateModal(false);
      setNewTourName('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Error creating tournament');
    }
  };

  const tournaments = tournamentsData || [];

  return (
    <div className="flex min-h-screen bg-admin-secondary">
      <AdminSidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          title="Tournament Directory"
          subtitle="Manage all tournaments, auctions, teams and player registrations"
          actions={
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-admin-primary hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Tournament</span>
            </button>
          }
        />

        <div className="p-8 space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-admin-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-admin-muted uppercase tracking-wider">Tournaments</p>
                <h3 className="text-2xl font-black text-admin-text mt-1">{tournaments.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-admin-primary flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-admin-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-admin-muted uppercase tracking-wider">Active Teams</p>
                <h3 className="text-2xl font-black text-admin-text mt-1">
                  {tournaments.reduce((acc: number, t: any) => acc + (t._count?.teams || 0), 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-admin-purple flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-admin-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-admin-muted uppercase tracking-wider">Total Players</p>
                <h3 className="text-2xl font-black text-admin-text mt-1">
                  {tournaments.reduce((acc: number, t: any) => acc + (t._count?.players || 0), 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-50 text-admin-success flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-admin-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-admin-muted uppercase tracking-wider">Auctions Ready</p>
                <h3 className="text-2xl font-black text-admin-text mt-1">
                  {tournaments.reduce((acc: number, t: any) => acc + (t._count?.auctions || 0), 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Gavel className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Tournaments Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-admin-text">Registered Tournaments</h2>
              <span className="text-xs font-semibold text-admin-muted">Showing all active tournaments</span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-sm font-semibold text-gray-400">Loading tournaments...</div>
            ) : tournaments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-bold text-gray-800">No tournaments created yet</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Get started by creating your first tournament, adding franchise teams and registering cricket players.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-admin-primary text-white text-xs font-bold rounded-xl"
                >
                  Create Tournament
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((tournament: any) => (
                  <div
                    key={tournament.id}
                    className="bg-white rounded-2xl border border-admin-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-admin-primary rounded-full uppercase tracking-wider">
                          {tournament.sport} • {tournament.season}
                        </span>
                        <span className="px-2.5 py-1 text-[11px] font-bold bg-green-50 text-green-700 rounded-full">
                          {tournament.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 leading-snug">{tournament.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {tournament.description || 'Premier competitive player auction and league management.'}
                      </p>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-800">{tournament._count?.teams || 0}</span> Teams
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-800">{tournament._count?.players || 0}</span> Players
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Gavel className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-800">{tournament._count?.auctions || 0}</span> Auctions
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50/70 border-t border-admin-border flex items-center justify-between">
                      <Link
                        href={`/tournaments/${tournament.id}`}
                        className="text-xs font-bold text-admin-primary hover:text-blue-800 flex items-center gap-1 transition-colors"
                      >
                        Manage Tournament
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tournaments/${tournament.id}/teams`}
                          className="px-2.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-[11px] font-bold text-gray-700 shadow-2xs"
                        >
                          Teams
                        </Link>
                        <Link
                          href={`/tournaments/${tournament.id}/import`}
                          className="px-2.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-[11px] font-bold text-gray-700 shadow-2xs"
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
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Create New Tournament</h3>
            <p className="text-xs text-gray-500 mb-4">Set up a new tournament with franchise purse rules.</p>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tournament Name</label>
                <input
                  type="text"
                  required
                  value={newTourName}
                  onChange={(e) => setNewTourName(e.target.value)}
                  placeholder="e.g. Bangalore Premier League 2027"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Sport</label>
                <select
                  value={newTourSport}
                  onChange={(e) => setNewTourSport(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Kabaddi">Kabaddi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Team Initial Purse (₹)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={newTourPurse}
                  onChange={(e) => setNewTourPurse(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-admin-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
                >
                  Create Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
