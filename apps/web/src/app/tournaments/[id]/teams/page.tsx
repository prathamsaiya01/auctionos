'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminNavbar } from '@/components/layout/AdminNavbar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardLoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Wallet,
  UserPlus,
  Trophy,
  IndianRupee,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  UserCheck
} from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Gold / Yellow', hex: '#EAB308' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Electric Purple', hex: '#7C3AED' },
  { name: 'Cyan Sky', hex: '#0284C7' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Dark Navy', hex: '#1E293B' },
  { name: 'Hot Orange', hex: '#EA580C' }
];

export default function TeamsPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeamForSquad, setSelectedTeamForSquad] = useState<any | null>(null);
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState<any | null>(null);

  // New team form state
  const [teamName, setTeamName] = useState('');
  const [teamAbbr, setTeamAbbr] = useState('');
  const [teamColor, setTeamColor] = useState('#2563EB');
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);

  // Owner invite form state
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerRole, setOwnerRole] = useState('PRIMARY_OWNER');
  const [generatedInvite, setGeneratedInvite] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  const { data: teamsData, isLoading, refetch } = useQuery({
    queryKey: ['teams', tournamentId],
    queryFn: async () => {
      const res: any = await api.get(`/teams/tournament/${tournamentId}`);
      return res.data;
    },
    enabled: !!tournamentId
  });

  const teams: any[] = teamsData || [];

  // Metrics summary
  const metrics = useMemo(() => {
    const totalTeams = teams.length;
    const totalAllocated = teams.reduce((acc, t) => acc + (Number(t.initialPurse) || 0), 0);
    const totalSpent = teams.reduce((acc, t) => acc + (Number(t.spentPurse) || 0), 0);
    const totalRemaining = teams.reduce((acc, t) => acc + (Number(t.remainingPurse) || 0), 0);
    const totalPlayersAcquired = teams.reduce((acc, t) => acc + (t.purchases?.length || 0), 0);
    return { totalTeams, totalAllocated, totalSpent, totalRemaining, totalPlayersAcquired };
  }, [teams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !teamAbbr) return;
    setIsSubmittingTeam(true);
    try {
      await api.post('/teams', {
        tournamentId,
        name: teamName,
        abbreviation: teamAbbr.toUpperCase(),
        color: teamColor
      });
      setShowAddTeamModal(false);
      setTeamName('');
      setTeamAbbr('');
      setTeamColor('#2563EB');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Error creating team');
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamForInvite) return;
    setIsSubmittingInvite(true);
    try {
      const res: any = await api.post(`/teams/${selectedTeamForInvite.id}/invite`, {
        fullName: ownerName,
        email: ownerEmail,
        phone: ownerPhone,
        role: ownerRole
      });

      setGeneratedInvite(res.data);
    } catch (err: any) {
      alert(err.message || 'Error sending invitation');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const copyInviteLink = () => {
    if (generatedInvite?.inviteUrl) {
      navigator.clipboard.writeText(generatedInvite.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen bg-admin-secondary">
      <AdminSidebar tournamentId={tournamentId} />

      <main className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          title="Franchise Teams & Owners"
          subtitle="Manage franchise squads, monitor purse deductions, and onboard authorized team owners"
          actions={
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setShowAddTeamModal(true)}
            >
              Add Franchise
            </Button>
          }
        />

        <div className="p-8 space-y-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-admin-border/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Franchise Teams</span>
                <p className="text-2xl font-black text-admin-text tracking-tight mt-0.5 tabular-nums">{metrics.totalTeams}</p>
              </div>
              <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                <Trophy className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-admin-border/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Total Purse Budget</span>
                <p className="text-xl font-black text-admin-text tracking-tight mt-0.5 tabular-nums">
                  ₹{metrics.totalAllocated.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-admin-border/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Total Spent</span>
                <p className="text-xl font-black text-rose-600 tracking-tight mt-0.5 tabular-nums">
                  ₹{metrics.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-admin-border/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Players Acquired</span>
                <p className="text-2xl font-black text-emerald-600 tracking-tight mt-0.5 tabular-nums">{metrics.totalPlayersAcquired}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Teams Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <CardLoadingSkeleton key={i} />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <EmptyState
              title="No Franchise Teams Created"
              description="Create franchise teams to participate in this cricket tournament auction, allocate team purses, and assign owners."
              actionLabel="Add First Team"
              onAction={() => setShowAddTeamModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => {
                const owner = team.memberships?.find((m: any) => m.role === 'PRIMARY_OWNER')?.user;
                const squadSize = team.purchases?.length || 0;
                const spentPct = team.initialPurse > 0
                  ? Math.min(100, Math.round(((team.spentPurse || 0) / team.initialPurse) * 100))
                  : 0;

                return (
                  <div
                    key={team.id}
                    className="bg-white rounded-3xl border border-admin-border/80 shadow-xs hover:shadow-premium transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* Color Header Banner */}
                      <div
                        className="p-5 text-white flex items-center justify-between relative overflow-hidden"
                        style={{ backgroundColor: team.color || '#2563EB' }}
                      >
                        <div className="flex items-center gap-3.5 z-10">
                          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-white text-lg border border-white/30 shadow-inner">
                            {team.abbreviation}
                          </div>
                          <div>
                            <h3 className="font-black text-white text-lg tracking-tight leading-tight">{team.name}</h3>
                            <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">
                              {team.abbreviation} Franchise
                            </span>
                          </div>
                        </div>

                        <div className="z-10">
                          <button
                            onClick={() => {
                              setSelectedTeamForInvite(team);
                              setGeneratedInvite(null);
                              setOwnerName('');
                              setOwnerEmail('');
                              setOwnerPhone('');
                              setShowInviteModal(true);
                            }}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/25 shadow-2xs backdrop-blur-xs"
                            title="Invite Team Owner"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Invite</span>
                          </button>
                        </div>

                        {/* Subtle background glow */}
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                      </div>

                      {/* Content Body */}
                      <div className="p-5 space-y-4">
                        {/* Purse Gauge Bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Purse Utilization</span>
                            <span className="font-black text-admin-text tabular-nums">{spentPct}% Spent</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${spentPct}%`,
                                backgroundColor: team.color || '#2563EB'
                              }}
                            />
                          </div>
                        </div>

                        {/* Purse Metrics Cards */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50 p-3 rounded-2xl border border-admin-border/80">
                            <span className="text-[10px] font-bold text-admin-muted uppercase tracking-wider block">
                              Remaining Purse
                            </span>
                            <span className="text-base font-black text-emerald-600 tabular-nums">
                              ₹{Number(team.remainingPurse).toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl border border-admin-border/80">
                            <span className="text-[10px] font-bold text-admin-muted uppercase tracking-wider block">
                              Purse Spent
                            </span>
                            <span className="text-base font-black text-rose-600 tabular-nums">
                              ₹{Number(team.spentPurse || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Owner Section */}
                        <div>
                          <span className="text-[10px] font-bold text-admin-muted uppercase tracking-wider block mb-1.5">
                            Authorized Owner
                          </span>
                          {owner ? (
                            <div className="flex items-center justify-between p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                                  {owner.fullName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-emerald-950 text-xs">{owner.fullName}</p>
                                  <p className="text-[10px] text-emerald-700 truncate max-w-[170px]">{owner.email}</p>
                                </div>
                              </div>
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80">
                              <div className="text-[11px] text-amber-900 font-semibold">
                                No owner onboarded yet.
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedTeamForInvite(team);
                                  setGeneratedInvite(null);
                                  setShowInviteModal(true);
                                }}
                                className="text-[11px] font-bold text-amber-800 underline hover:text-amber-900"
                              >
                                Send Link
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Squad Footer with Roster Drawer Trigger */}
                    <div className="p-4 bg-slate-50/80 border-t border-admin-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-admin-muted" />
                        <span className="text-xs font-bold text-admin-text tabular-nums">
                          {squadSize} Players Acquired
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedTeamForSquad(team)}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
                      >
                        <span>View Squad</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Team Squad Roster Modal */}
      {selectedTeamForSquad && (
        <Modal
          isOpen={!!selectedTeamForSquad}
          onClose={() => setSelectedTeamForSquad(null)}
          title={`${selectedTeamForSquad.name} Squad Roster`}
          subtitle={`${selectedTeamForSquad.purchases?.length || 0} players acquired • ₹${Number(selectedTeamForSquad.spentPurse || 0).toLocaleString()} spent`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {selectedTeamForSquad.purchases && selectedTeamForSquad.purchases.length > 0 ? (
              <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                {selectedTeamForSquad.purchases.map((pur: any) => (
                  <div key={pur.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {pur.player.photoUrl ? (
                        <img
                          src={pur.player.photoUrl}
                          alt={pur.player.fullName}
                          className="w-10 h-10 rounded-2xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-xs">
                          {pur.player.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-admin-text text-sm">{pur.player.fullName}</p>
                        <div className="flex items-center gap-2 text-[11px] text-admin-muted">
                          <span className="font-semibold text-brand-600 uppercase">
                            {pur.player.role?.replace(/_/g, ' ')}
                          </span>
                          <span>•</span>
                          <span>{pur.player.playerCategory || 'Regular'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-admin-muted uppercase block">Winning Bid</span>
                      <span className="text-sm font-black text-emerald-600 tabular-nums">
                        ₹{Number(pur.purchasePrice).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-admin-muted text-sm font-medium">
                No players have been acquired by this team yet. Live auction acquisitions will appear here automatically.
              </div>
            )}

            <div className="pt-3 border-t border-admin-border flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedTeamForSquad(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <Modal
          isOpen={showAddTeamModal}
          onClose={() => setShowAddTeamModal(false)}
          title="Add Franchise Team"
          subtitle="Register a new team for this tournament and assign theme color"
          maxWidth="md"
        >
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <Input
              label="Franchise Team Name"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Pune Supergiants"
            />

            <Input
              label="Abbreviation (2-4 uppercase characters)"
              required
              maxLength={4}
              value={teamAbbr}
              onChange={(e) => setTeamAbbr(e.target.value.toUpperCase())}
              placeholder="e.g. PSG"
            />

            <div>
              <label className="block text-xs font-bold text-admin-text mb-2">Team Brand Color</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setTeamColor(preset.hex)}
                    className={`h-9 rounded-xl flex items-center justify-center border transition-all ${
                      teamColor === preset.hex ? 'border-brand-600 ring-2 ring-brand-500/30' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  >
                    {teamColor === preset.hex && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-admin-border">
                <input
                  type="color"
                  value={teamColor}
                  onChange={(e) => setTeamColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <span className="text-xs font-mono font-bold text-admin-text">{teamColor}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-admin-border">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowAddTeamModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={isSubmittingTeam}
                icon={Plus}
              >
                Create Franchise
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Invite Owner Modal */}
      {showInviteModal && selectedTeamForInvite && (
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite Franchise Owner"
          subtitle={`Authorize an owner or bidder for ${selectedTeamForInvite.name}`}
          maxWidth="md"
        >
          {!generatedInvite ? (
            <form onSubmit={handleSendInvite} className="space-y-4">
              <Input
                label="Owner Full Name"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Rajesh Mehra"
              />

              <Input
                label="Email Address"
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@company.com"
              />

              <Input
                label="WhatsApp / Phone Number"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="+919876543210"
              />

              <Select
                label="Owner Role"
                value={ownerRole}
                onChange={(e) => setOwnerRole(e.target.value)}
                options={[
                  { value: 'PRIMARY_OWNER', label: 'Primary Franchise Owner (Full Control)' },
                  { value: 'CO_OWNER', label: 'Co-Owner (Authorized Bidder)' },
                  { value: 'ANALYST', label: 'Team Analyst (Read-Only)' }
                ]}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-admin-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isSubmittingInvite}
                  icon={UserPlus}
                >
                  Generate Invitation
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 text-xs">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Invitation Created Successfully!
                </p>
                <p className="text-[11px] text-emerald-700">
                  Share this secure single-use link with {generatedInvite.fullName}. They can join without complex passwords.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-admin-border flex items-center justify-between gap-2">
                <span className="text-xs text-admin-text truncate font-mono select-all">
                  {generatedInvite.inviteUrl}
                </span>
                <button
                  onClick={copyInviteLink}
                  className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-admin-border text-admin-text text-xs font-bold shrink-0 transition-colors shadow-2xs"
                  title="Copy link to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <a
                href={`https://wa.me/${ownerPhone ? ownerPhone.replace(/[\+\s\-]/g, '') : ''}?text=${encodeURIComponent(
                  `Hi ${ownerName}, you have been invited to manage ${selectedTeamForInvite.name} on AuctionOS! Join here: ${generatedInvite.inviteUrl}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Directly on WhatsApp</span>
              </a>

              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={() => {
                  setShowInviteModal(false);
                  refetch();
                }}
              >
                Done
              </Button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
