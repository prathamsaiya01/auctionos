'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminNavbar } from '@/components/layout/AdminNavbar';
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
  UserPlus
} from 'lucide-react';

export default function TeamsPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  // New team form state
  const [teamName, setTeamName] = useState('');
  const [teamAbbr, setTeamAbbr] = useState('');
  const [teamColor, setTeamColor] = useState('#2563EB');

  // Owner invite form state
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerRole, setOwnerRole] = useState('PRIMARY_OWNER');
  const [generatedInvite, setGeneratedInvite] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const { data: teamsData, isLoading, refetch } = useQuery({
    queryKey: ['teams', tournamentId],
    queryFn: async () => {
      const res: any = await api.get(`/teams/tournament/${tournamentId}`);
      return res.data;
    },
    enabled: !!tournamentId
  });

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/teams', {
        tournamentId,
        name: teamName,
        abbreviation: teamAbbr,
        color: teamColor
      });
      setShowAddTeamModal(false);
      setTeamName('');
      setTeamAbbr('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Error creating team');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      const res: any = await api.post(`/teams/${selectedTeam.id}/invite`, {
        fullName: ownerName,
        email: ownerEmail,
        phone: ownerPhone,
        role: ownerRole
      });

      setGeneratedInvite(res.data);
    } catch (err: any) {
      alert(err.message || 'Error sending invitation');
    }
  };

  const copyInviteLink = () => {
    if (generatedInvite?.inviteUrl) {
      navigator.clipboard.writeText(generatedInvite.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const teams = teamsData || [];

  return (
    <div className="flex min-h-screen bg-admin-secondary">
      <AdminSidebar tournamentId={tournamentId} />

      <main className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          title="Franchise Teams & Owners"
          subtitle="Manage franchise squads, monitor purse deductions, and invite team owners"
          actions={
            <button
              onClick={() => setShowAddTeamModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-admin-primary hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Team</span>
            </button>
          }
        />

        <div className="p-8 space-y-6">
          {isLoading ? (
            <div className="p-12 text-center text-sm font-semibold text-gray-400">Loading teams...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team: any) => {
                const owner = team.memberships?.find((m: any) => m.role === 'PRIMARY_OWNER')?.user;

                return (
                  <div
                    key={team.id}
                    className="bg-white rounded-2xl border border-admin-border shadow-sm p-6 flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* Team Header */}
                      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm"
                            style={{ backgroundColor: team.color }}
                          >
                            {team.abbreviation}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base">{team.name}</h3>
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                              {team.abbreviation} Franchise
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedTeam(team);
                            setGeneratedInvite(null);
                            setShowInviteModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-admin-primary rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Invite</span>
                        </button>
                      </div>

                      {/* Purse Metrics */}
                      <div className="grid grid-cols-2 gap-3 my-4">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Remaining Purse
                          </span>
                          <span className="text-base font-black text-admin-primary">
                            ₹{Number(team.remainingPurse).toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Squad Size
                          </span>
                          <span className="text-base font-black text-gray-900">
                            {team.purchases?.length || 0} Players
                          </span>
                        </div>
                      </div>

                      {/* Owner Information */}
                      <div className="mt-2 text-xs">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Authorized Owner
                        </span>
                        {owner ? (
                          <div className="flex items-center gap-2 p-2 bg-green-50/60 rounded-xl border border-green-100">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="font-bold text-gray-900">{owner.fullName}</p>
                              <p className="text-[10px] text-gray-500">{owner.email}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100 text-amber-800 text-[11px]">
                            No owner verified. Click "Invite" to send an onboarding link.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Squad Preview */}
                    <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span>Spent: ₹{Number(team.spentPurse || 0).toLocaleString()}</span>
                      <span className="font-semibold text-gray-700">{team.purchases?.length || 0} acquired</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Add Franchise Team</h3>
            <p className="text-xs text-gray-500 mb-4">Register a new team for this tournament.</p>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Pune Warriors"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Abbreviation (2-4 letters)</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={teamAbbr}
                  onChange={(e) => setTeamAbbr(e.target.value.toUpperCase())}
                  placeholder="e.g. PWR"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Brand Theme Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={teamColor}
                    onChange={(e) => setTeamColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200"
                  />
                  <span className="text-xs font-mono font-bold text-gray-600">{teamColor}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-admin-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Owner Modal */}
      {showInviteModal && selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Invite Team Owner</h3>
            <p className="text-xs text-gray-500 mb-4">
              Send an invitation to authorize an owner for <span className="font-bold text-gray-800">{selectedTeam.name}</span>.
            </p>

            {!generatedInvite ? (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Owner Full Name</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Rajesh Mehra"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@company.com"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp / Phone Number</label>
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-admin-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
                  >
                    Generate Invitation
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-900 text-xs">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <Check className="w-4 h-4 text-green-600" />
                    Invitation Link Created Successfully!
                  </p>
                  <p className="text-[11px] text-green-700">
                    Share this secure single-use invitation link with {generatedInvite.fullName}.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 truncate font-mono">{generatedInvite.inviteUrl}</span>
                  <button
                    onClick={copyInviteLink}
                    className="p-2 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold shrink-0 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <a
                  href={`https://wa.me/${ownerPhone ? ownerPhone.replace(/\+/g, '') : ''}?text=${encodeURIComponent(`Hi ${ownerName}, you have been invited to manage ${selectedTeam.name} on AuctionOS! Join here: ${generatedInvite.inviteUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share directly on WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    refetch();
                  }}
                  className="w-full py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
