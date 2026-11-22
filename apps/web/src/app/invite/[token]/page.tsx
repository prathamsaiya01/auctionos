'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Trophy, ShieldCheck, Users, Check, ArrowRight, Lock, Sparkles } from 'lucide-react';

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
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span>Verifying invitation credentials...</span>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-admin-border">
          <p className="text-sm font-bold text-rose-600">Invitation not found or security token has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-admin-border/80 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-600 p-8 text-white text-center relative overflow-hidden">
          <div className="w-16 h-16 mx-auto mb-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-yellow-300" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-200">
            OFFICIAL FRANCHISE INVITATION
          </span>
          <h1 className="text-2xl font-black mt-1 tracking-tight">{invite.tournament?.name || 'Tournament'}</h1>

          {/* Background flare */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        </div>

        {/* Card Content */}
        <div className="p-8 space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-admin-border flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0 border border-white/20"
              style={{ backgroundColor: invite.team.color || '#2563EB' }}
            >
              {invite.team.abbreviation}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Assigned Franchise</span>
              <h3 className="font-black text-lg text-admin-text leading-tight">{invite.team.name}</h3>
              <p className="text-xs text-brand-600 font-bold mt-0.5">Role: {invite.role.replace(/_/g, ' ')}</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed font-medium">
            Welcome <span className="font-black text-admin-text">{invite.fullName}</span>! You have been authorized by{' '}
            <span className="font-black text-admin-text">{invite.invitedBy?.fullName || 'the tournament committee'}</span> to
            take ownership of <span className="font-bold text-admin-text">{invite.team.name}</span> and participate in the live cricket player auction.
          </div>

          {error && (
            <div className="p-3 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          {!user && (
            <div className="space-y-1.5">
              <Input
                label="Set Your Account Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password (min 6 characters)"
                icon={Lock}
                required
              />
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={submitting}
            onClick={handleAccept}
            icon={ArrowRight}
          >
            {submitting ? 'Confirming Ownership...' : 'Accept Team Ownership & Proceed'}
          </Button>
        </div>
      </div>
    </div>
  );
}
