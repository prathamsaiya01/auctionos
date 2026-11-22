'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Trophy, Mail, Lock, User, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { UserRole } from '@auctionos/shared';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>(UserRole.TOURNAMENT_ADMIN);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await api.post('/auth/register', {
        fullName,
        email,
        phone: phone || undefined,
        password,
        role
      });

      if (res.success && res.data) {
        setAuth(res.data.user, res.data.token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient gradient blurs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-premium border border-admin-border/80 overflow-hidden relative z-10">
        <div className="bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-600 p-8 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-yellow-300" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Create AuctionOS Account</h1>
          <p className="text-brand-100 text-xs mt-1">Organise, manage, and participate in cricket auctions</p>
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
        </div>

        <div className="p-8 space-y-4">
          {error && (
            <div className="p-3 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <Input
              label="Full Name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Dravid"
              icon={User}
            />

            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@example.com"
              icon={Mail}
            />

            <Input
              label="Phone Number (E.164 / WhatsApp)"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              icon={Phone}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              icon={Lock}
            />

            <Select
              label="Register As"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: UserRole.TOURNAMENT_ADMIN, label: 'Tournament Organizer (Full Admin)' },
                { value: UserRole.AUCTIONEER, label: 'Auctioneer / Live Host' },
                { value: UserRole.TEAM_OWNER, label: 'Franchise Team Owner' },
                { value: UserRole.PLAYER, label: 'Cricket Player' }
              ]}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={loading}
              icon={ArrowRight}
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </Button>
          </form>

          <p className="text-center text-xs text-admin-muted pt-2">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-brand-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
