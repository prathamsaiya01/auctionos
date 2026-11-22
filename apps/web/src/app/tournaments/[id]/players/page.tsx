'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminNavbar } from '@/components/layout/AdminNavbar';
import { TradingCard } from '@/components/ui/TradingCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardLoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Award,
  Sparkles,
  LayoutGrid,
  List,
  Flame,
  TrendingUp,
  X,
  Phone,
  MapPin,
  Calendar,
  Trophy,
  Activity,
  Layers,
  ChevronRight,
  IndianRupee
} from 'lucide-react';

export default function PlayersPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [roleFilter, setRoleFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pool' | 'sold'>('all');
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New player state
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('ALL_ROUNDER');
  const [category, setCategory] = useState('Regular');
  const [basePrice, setBasePrice] = useState(1000);
  const [age, setAge] = useState(24);
  const [city, setCity] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [battingStyle, setBattingStyle] = useState('RIGHT_HAND');
  const [bowlingStyle, setBowlingStyle] = useState('RIGHT_ARM_MEDIUM');

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

  const rawPlayers: any[] = playersData || [];

  // Filter by status (in pool vs sold)
  const players = useMemo(() => {
    return rawPlayers.filter((p) => {
      const isSold = p.purchases && p.purchases.length > 0;
      if (statusFilter === 'sold') return isSold;
      if (statusFilter === 'pool') return !isSold;
      return true;
    });
  }, [rawPlayers, statusFilter]);

  // Aggregate stats
  const metrics = useMemo(() => {
    const total = rawPlayers.length;
    const marquee = rawPlayers.filter((p) => p.playerCategory === 'Marquee').length;
    const sold = rawPlayers.filter((p) => p.purchases && p.purchases.length > 0).length;
    const inPool = total - sold;
    const totalBaseVal = rawPlayers.reduce((acc, p) => acc + (Number(p.basePrice) || 0), 0);
    return { total, marquee, sold, inPool, totalBaseVal };
  }, [rawPlayers]);

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;
    setIsSubmitting(true);
    try {
      await api.post('/players', {
        tournamentId,
        fullName,
        displayName: displayName || fullName.split(' ')[0],
        role,
        battingStyle,
        bowlingStyle,
        playerCategory: category,
        basePrice: Number(basePrice),
        age: Number(age),
        city,
        mobileNumber: mobileNumber || undefined
      });
      setShowAddModal(false);
      resetForm();
      refetch();
    } catch (err: any) {
      alert(err.message || 'Error creating player');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setDisplayName('');
    setRole('ALL_ROUNDER');
    setCategory('Regular');
    setBasePrice(1000);
    setAge(24);
    setCity('');
    setMobileNumber('');
    setBattingStyle('RIGHT_HAND');
    setBowlingStyle('RIGHT_ARM_MEDIUM');
  };

  const handleVerify = async (playerId: string) => {
    try {
      await api.patch(`/players/${playerId}/verify`);
      refetch();
      if (selectedPlayer && selectedPlayer.id === playerId) {
        setSelectedPlayer({ ...selectedPlayer, isVerified: true });
      }
    } catch (err: any) {
      alert(err.message || 'Error verifying player');
    }
  };

  return (
    <div className="flex min-h-screen bg-admin-secondary">
      <AdminSidebar tournamentId={tournamentId} />

      <main className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          title="Player Directory"
          subtitle="Manage tournament players, verify cricket credentials, and set base prices"
          actions={
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setShowAddModal(true)}
            >
              Register Player
            </Button>
          }
        />

        <div className="p-8 space-y-6">
          {/* Top Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-admin-border/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Total Registered</span>
                <p className="text-2xl font-black text-admin-text tracking-tight mt-0.5 tabular-nums">{metrics.total}</p>
              </div>
              <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-admin-border/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Marquee Stars</span>
                <p className="text-2xl font-black text-purple-600 tracking-tight mt-0.5 tabular-nums">{metrics.marquee}</p>
              </div>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-admin-border/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Sold to Franchises</span>
                <p className="text-2xl font-black text-emerald-600 tracking-tight mt-0.5 tabular-nums">{metrics.sold}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-admin-border/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Available in Pool</span>
                <p className="text-2xl font-black text-blue-600 tracking-tight mt-0.5 tabular-nums">{metrics.inPool}</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-admin-border/80 shadow-xs flex items-center justify-between col-span-2 md:col-span-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Base Valuation</span>
                <p className="text-xl font-black text-admin-text tracking-tight mt-0.5 tabular-nums">
                  ₹{metrics.totalBaseVal.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filters & View Mode Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-admin-border/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-admin-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search player name, city, nickname..."
                  className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-admin-border rounded-xl text-xs font-medium text-admin-text focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-admin-border rounded-xl text-xs font-bold text-admin-text focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                className="px-3 py-2 bg-slate-50 border border-admin-border rounded-xl text-xs font-bold text-admin-text focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Categories</option>
                <option value="Marquee">Marquee</option>
                <option value="A-Grade">A-Grade</option>
                <option value="B-Grade">B-Grade</option>
                <option value="Regular">Regular</option>
              </select>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-admin-border text-xs font-bold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'all'
                      ? 'bg-white text-brand-600 shadow-xs'
                      : 'text-admin-muted hover:text-admin-text'
                  }`}
                >
                  All ({rawPlayers.length})
                </button>
                <button
                  onClick={() => setStatusFilter('pool')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'pool'
                      ? 'bg-white text-brand-600 shadow-xs'
                      : 'text-admin-muted hover:text-admin-text'
                  }`}
                >
                  Pool ({metrics.inPool})
                </button>
                <button
                  onClick={() => setStatusFilter('sold')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'sold'
                      ? 'bg-white text-emerald-600 shadow-xs'
                      : 'text-admin-muted hover:text-admin-text'
                  }`}
                >
                  Sold ({metrics.sold})
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-admin-border">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-brand-600 shadow-xs'
                      : 'text-admin-muted hover:text-admin-text'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-brand-600 shadow-xs'
                      : 'text-admin-muted hover:text-admin-text'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <CardLoadingSkeleton key={i} />
              ))}
            </div>
          ) : players.length === 0 ? (
            <EmptyState
              title="No Cricketers Found"
              description="No player profiles match your active search, category, or role filters. Clear your filters or register a new player."
              actionLabel="Register Player"
              onAction={() => setShowAddModal(true)}
            />
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {players.map((p) => (
                <TradingCard
                  key={p.id}
                  player={p}
                  onViewProfile={() => setSelectedPlayer(p)}
                  onVerify={() => handleVerify(p.id)}
                />
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-3xl border border-admin-border/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 text-admin-muted font-bold uppercase tracking-wider border-b border-admin-border/70">
                    <tr>
                      <th className="py-4 px-5">Player Profile</th>
                      <th className="py-4 px-4">Role & Batting</th>
                      <th className="py-4 px-4">Category</th>
                      <th className="py-4 px-4">Cricket Statistics</th>
                      <th className="py-4 px-4">Base Price</th>
                      <th className="py-4 px-4">Auction Status</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {players.map((p: any) => {
                      const purchase = p.purchases?.[0];

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                          onClick={() => setSelectedPlayer(p)}
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              {p.photoUrl ? (
                                <img
                                  src={p.photoUrl}
                                  alt={p.fullName}
                                  className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-100 to-indigo-100 text-brand-600 font-black flex items-center justify-center text-sm shadow-2xs">
                                  {p.fullName.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-black text-admin-text text-sm group-hover:text-brand-600 transition-colors">
                                    {p.fullName}
                                  </p>
                                  {p.isVerified && (
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-admin-muted font-medium">
                                  {p.city ? `${p.city} • ` : ''}Age {p.age || '—'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-admin-text block">{p.role.replace('_', ' ')}</span>
                            <span className="text-[11px] text-admin-muted font-medium">
                              {p.battingStyle?.replace(/_/g, ' ') || 'Right Hand'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              p.playerCategory === 'Marquee'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : p.playerCategory === 'A-Grade'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {p.playerCategory || 'Regular'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {p.stats ? (
                              <div className="flex items-center gap-2 text-[11px] font-bold text-admin-text tabular-nums">
                                <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                  {p.stats.matches ?? 0} M
                                </span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                  {p.stats.runs ?? 0} R
                                </span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                  {p.stats.wickets ?? 0} W
                                </span>
                              </div>
                            ) : (
                              <span className="text-admin-muted text-[11px]">No stats logged</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-black text-admin-text tabular-nums text-sm">
                            ₹{Number(p.basePrice).toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4">
                            {purchase ? (
                              <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                SOLD: {purchase.team?.abbreviation || purchase.team?.name}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-blue-500" />
                                IN POOL
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {!p.isVerified ? (
                                <button
                                  onClick={() => handleVerify(p.id)}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-colors"
                                >
                                  Verify
                                </button>
                              ) : (
                                <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Verified
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPlayer(p)}
                              >
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Player Profile Detail Modal */}
      {selectedPlayer && (
        <Modal
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          title="Player Profile"
          subtitle={`${selectedPlayer.fullName} • ${selectedPlayer.role.replace('_', ' ')}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Header Showcase */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-admin-border">
              {selectedPlayer.photoUrl ? (
                <img
                  src={selectedPlayer.photoUrl}
                  alt={selectedPlayer.fullName}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-md">
                  {selectedPlayer.fullName.charAt(0)}
                </div>
              )}

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-xl font-black text-admin-text">{selectedPlayer.fullName}</h3>
                  {selectedPlayer.isVerified ? (
                    <Badge variant="success" size="sm">
                      <ShieldCheck className="w-3 h-3 mr-1 inline" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">Unverified</Badge>
                  )}
                  <Badge variant="purple" size="sm">{selectedPlayer.playerCategory || 'Regular'}</Badge>
                </div>

                <p className="text-xs text-admin-muted font-medium mt-1">
                  {selectedPlayer.displayName && `Nickname: "${selectedPlayer.displayName}" • `}
                  {selectedPlayer.city ? `${selectedPlayer.city} • ` : ''}
                  Age {selectedPlayer.age || '—'}
                </p>

                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  <span className="px-2.5 py-1 bg-white rounded-lg text-xs font-bold text-gray-700 border border-gray-200">
                    🏏 {selectedPlayer.battingStyle ? selectedPlayer.battingStyle.replace(/_/g, ' ') : 'Right Hand Bat'}
                  </span>
                  <span className="px-2.5 py-1 bg-white rounded-lg text-xs font-bold text-gray-700 border border-gray-200">
                    ⚡ {selectedPlayer.bowlingStyle ? selectedPlayer.bowlingStyle.replace(/_/g, ' ') : 'Medium Pace'}
                  </span>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted block">Base Price</span>
                <span className="text-xl font-black text-brand-600 tabular-nums">
                  ₹{Number(selectedPlayer.basePrice).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Cricket Career Statistics Matrix */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-admin-muted mb-3 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-600" />
                <span>Cricket Performance Statistics</span>
              </h4>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-admin-border/80">
                  <span className="text-[10px] font-bold text-admin-muted uppercase block">Matches</span>
                  <span className="text-base font-black text-admin-text tabular-nums">
                    {selectedPlayer.stats?.matches ?? '0'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-admin-border/80">
                  <span className="text-[10px] font-bold text-admin-muted uppercase block">Runs</span>
                  <span className="text-base font-black text-admin-text tabular-nums">
                    {selectedPlayer.stats?.runs ?? '0'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-admin-border/80">
                  <span className="text-[10px] font-bold text-admin-muted uppercase block">High Score</span>
                  <span className="text-base font-black text-admin-text tabular-nums">
                    {selectedPlayer.stats?.highestScore ?? '—'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-admin-border/80">
                  <span className="text-[10px] font-bold text-admin-muted uppercase block">Bat Avg</span>
                  <span className="text-base font-black text-admin-text tabular-nums">
                    {selectedPlayer.stats?.battingAverage ?? '—'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-admin-border/80">
                  <span className="text-[10px] font-bold text-admin-muted uppercase block">Strike Rate</span>
                  <span className="text-base font-black text-admin-text tabular-nums">
                    {selectedPlayer.stats?.strikeRate ?? '—'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-admin-border/80">
                  <span className="text-[10px] font-bold text-admin-muted uppercase block">Wickets</span>
                  <span className="text-base font-black text-admin-text tabular-nums">
                    {selectedPlayer.stats?.wickets ?? '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Auction Acquisition Status */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-admin-muted mb-3 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Auction Status</span>
              </h4>

              {selectedPlayer.purchases && selectedPlayer.purchases.length > 0 ? (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-xs"
                      style={{ backgroundColor: selectedPlayer.purchases[0].team?.color || '#16A34A' }}
                    >
                      {selectedPlayer.purchases[0].team?.abbreviation || 'TM'}
                    </div>
                    <div>
                      <p className="font-black text-emerald-950 text-sm">
                        Acquired by {selectedPlayer.purchases[0].team?.name}
                      </p>
                      <p className="text-xs font-semibold text-emerald-700">
                        Final Winning Bid: ₹{Number(selectedPlayer.purchases[0].purchasePrice).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">SOLD</Badge>
                </div>
              ) : (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-900 text-xs font-bold">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Currently Available in Tournament Auction Pool</span>
                  </div>
                  <Badge variant="info">IN POOL</Badge>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-admin-border">
              <div>
                {!selectedPlayer.isVerified && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => handleVerify(selectedPlayer.id)}
                  >
                    Verify Profile Credentials
                  </Button>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedPlayer(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Player Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Register Cricket Player"
          subtitle="Add player credentials, role, and initial base auction price"
          maxWidth="lg"
        >
          <form onSubmit={handleCreatePlayer} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input
                  label="Full Name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Virat Kohli"
                />
              </div>

              <div>
                <Input
                  label="Display Name / Nickname"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. King Kohli"
                />
              </div>

              <div>
                <Input
                  label="Mobile Number (WhatsApp)"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+919876543210"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Playing Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={[
                  { value: 'ALL_ROUNDER', label: 'All-Rounder' },
                  { value: 'BATSMAN', label: 'Batsman' },
                  { value: 'BOWLER', label: 'Bowler' },
                  { value: 'WICKET_KEEPER', label: 'Wicket-Keeper' }
                ]}
              />

              <Select
                label="Player Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { value: 'Marquee', label: 'Marquee Star' },
                  { value: 'A-Grade', label: 'A-Grade' },
                  { value: 'B-Grade', label: 'B-Grade' },
                  { value: 'Regular', label: 'Regular' }
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Batting Style"
                value={battingStyle}
                onChange={(e) => setBattingStyle(e.target.value)}
                options={[
                  { value: 'RIGHT_HAND', label: 'Right-Hand Bat' },
                  { value: 'LEFT_HAND', label: 'Left-Hand Bat' }
                ]}
              />

              <Select
                label="Bowling Style"
                value={bowlingStyle}
                onChange={(e) => setBowlingStyle(e.target.value)}
                options={[
                  { value: 'RIGHT_ARM_FAST', label: 'Right-arm Fast' },
                  { value: 'RIGHT_ARM_MEDIUM', label: 'Right-arm Medium' },
                  { value: 'RIGHT_ARM_SPIN', label: 'Right-arm Spin' },
                  { value: 'LEFT_ARM_FAST', label: 'Left-arm Fast' },
                  { value: 'LEFT_ARM_SPIN', label: 'Left-arm Spin' }
                ]}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Input
                  label="Base Price (₹)"
                  type="number"
                  required
                  min="100"
                  step="500"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                />
              </div>

              <div>
                <Input
                  label="Age"
                  type="number"
                  min="14"
                  max="65"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                />
              </div>

              <div>
                <Input
                  label="City / District"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-admin-border">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={isSubmitting}
                icon={Plus}
              >
                Register Player
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
