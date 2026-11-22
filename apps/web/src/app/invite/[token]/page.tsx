'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Trophy, ShieldCheck, Users, Check, ArrowRight, Lock } from 'lucide-react';

export default function InviteAcceptPage() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();

  const { user, token: authToken, setAuth } = useAuthStore();

  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: invite, isLoading } = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const res: any = await api.get(`/invitations/${token}`);
      return res.data;
    },
    enabled: !!token
  });

  const handleAccept = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // If user not authenticated, register / login with invite details
      if (!authToken) {
        if (!password) {
          setError('Please set a password to create your team owner account.');
          setSubmitting(false);
          return;
        }

        const authRes: any = await api.post('/auth/register', {
          fullName: invite.fullName,
          email: invite.email,
          password,
          role: 'TEAM_OWNER'
        });

        setAuth(authRes.data.user, authRes.data.token);
      }

      // Accept invitation
      await api.post(`/invitations/${token}/accept`);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-sm font-semibold text-gray-500">Verifying invitation token...</p>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <p className="text-sm font-bold text-red-600">Invitation not found or link has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-yellow-300" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">
            OFFICIAL TEAM INVITATION
          </span>
          <h1 className="text-2xl font-black mt-1">{invite.tournament.name}</h1>
        </div>

        {/* Card Content */}
        <div className="p-8 space-y-6">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0"
              style={{ backgroundColor: invite.team.color || '#2563EB' }}
            >
              {invite.team.abbreviation}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Assigned Franchise</span>
              <h3 className="font-black text-lg text-gray-900 leading-tight">{invite.team.name}</h3>
              <p className="text-xs text-gray-500">Role: {invite.role.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="text-xs text-gray-600 leading-relaxed">
            Hello <span className="font-bold text-gray-900">{invite.fullName}</span>! You have been invited by{' '}
            <span className="font-bold text-gray-900">{invite.invitedBy?.fullName || 'the tournament committee'}</span> to
            take ownership of {invite.team.name} and participate in the live cricket player auction.
          </div>

          {error && (
            <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {!user && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Set Account Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 6 chars)"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleAccept}
            disabled={submitting}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Confirming Ownership...' : 'Accept Team Ownership & Proceed'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
