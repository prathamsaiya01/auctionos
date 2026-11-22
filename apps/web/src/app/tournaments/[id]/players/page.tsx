'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminNavbar } from '@/components/layout/AdminNavbar';
import {
  UserCheck,
  Search,
  Filter,
  CheckCircle,
  Plus,
  ShieldCheck,
  Award,
  Sparkles
} from 'lucide-react';

export default function PlayersPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const [roleFilter, setRoleFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New player state
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('ALL_ROUNDER');
  const [category, setCategory] = useState('Regular');
  const [basePrice, setBasePrice] = useState(1000);
  const [age, setAge] = useState(24);
  const [city, setCity] = useState('');

  const { data: playersData, isLoading, refetch } = useQuery({
    queryKey: ['players', tournamentId, roleFilter, categoryFilter, search],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (roleFilter) q.append('role', roleFilter);
      if (categoryFilter) q.append('category', categoryFilter);
      if (search) q.append('search', search);

      const res: any = await api.get(`/players/tournament/${tournamentId}?${q.toString()}`);
      return res.data;
    },
    enabled: !!tournamentId
  });

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/players', {
        tournamentId,
        fullName,
        role,
        playerCategory: category,
        basePrice: Number(basePrice),
        age: Number(age),
        city
      });
      setShowAddModal(false);
      setFullName('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Error creating player');
    }
  };

  const handleVerify = async (playerId: string) => {
    try {
      await api.patch(`/players/${playerId}/verify`);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Error verifying player');
    }
  };

  const players = playersData || [];

  return (
    <div className="flex min-h-screen bg-admin-secondary">
      <AdminSidebar tournamentId={tournamentId} />

      <main className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          title="Player Directory"
          subtitle="Manage tournament players, verify cricket credentials, and set base prices"
          actions={
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-admin-primary hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register Player</span>
            </button>
          }
        />

        <div className="p-8 space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-admin-border shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search player name or city..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="BATSMAN">Batsman</option>
                <option value="BOWLER">Bowler</option>
                <option value="ALL_ROUNDER">All-Rounder</option>
                <option value="WICKET_KEEPER">Wicket-Keeper</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="Marquee">Marquee</option>
                <option value="A-Grade">A-Grade</option>
                <option value="B-Grade">B-Grade</option>
                <option value="Regular">Regular</option>
              </select>
            </div>
          </div>

          {/* Players Table */}
          <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">
                Total Players: <span className="text-blue-600 font-black">{players.length}</span>
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs font-semibold text-gray-400">Loading players...</div>
            ) : players.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500">
                No players match your search filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 px-4">Role & Style</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Cricket Statistics</th>
                      <th className="py-3 px-4">Base Price</th>
                      <th className="py-3 px-4">Auction Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {players.map((p: any) => {
                      const purchase = p.purchases?.[0];

                      return (
                        <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {p.photoUrl ? (
                                <img
                                  src={p.photoUrl}
                                  alt={p.fullName}
                                  className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                                  {p.fullName.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-gray-900">{p.fullName}</p>
                                <p className="text-[10px] text-gray-400">
                                  {p.city ? `${p.city} • ` : ''}Age {p.age || '—'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-800 block">{p.role.replace('_', ' ')}</span>
                            <span className="text-[10px] text-gray-400">
                              {p.battingStyle?.replace('_', ' ') || 'Right Hand'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                              {p.playerCategory}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="space-y-0.5 text-[11px]">
                              {p.stats ? (
                                <div>
                                  <span className="font-semibold text-gray-700">{p.stats.matches}</span> M •{' '}
                                  <span className="font-semibold text-gray-700">{p.stats.runs}</span> Runs •{' '}
                                  <span className="font-semibold text-gray-700">{p.stats.wickets}</span> Wkts
                                </div>
                              ) : (
                                <span className="text-gray-400">No stats logged</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 font-black text-gray-900">
                            ₹{Number(p.basePrice).toLocaleString()}
                          </td>

                          <td className="py-3 px-4">
                            {purchase ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                                SOLD: {purchase.team?.name}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                IN POOL
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {!p.isVerified ? (
                              <button
                                onClick={() => handleVerify(p.id)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold"
                              >
                                Verify Profile
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-green-600 inline-flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Player Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Register Cricket Player</h3>
            <p className="text-xs text-gray-500 mb-4">Add player details for tournament auction.</p>

            <form onSubmit={handleCreatePlayer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Virat Kohli"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Playing Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="BATSMAN">Batsman</option>
                    <option value="BOWLER">Bowler</option>
                    <option value="ALL_ROUNDER">All-Rounder</option>
                    <option value="WICKET_KEEPER">Wicket-Keeper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="Marquee">Marquee</option>
                    <option value="A-Grade">A-Grade</option>
                    <option value="B-Grade">B-Grade</option>
                    <option value="Regular">Regular</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-admin-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
                >
                  Register Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
