'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Trophy, ShieldCheck, Gavel, UserCheck, ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    setError(null);
    setLoading(true);

    const targetEmail = loginEmail || email;
    const targetPassword = loginPassword || password;

    try {
      const res: any = await api.post('/auth/login', {
        email: targetEmail,
        password: targetPassword
      });

      if (res.success && res.data) {
        setAuth(res.data.user, res.data.token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
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
        {/* Header */}
        <div className="bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-600 p-8 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-yellow-300" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">AUCTIONOS</h1>
          <p className="text-brand-100 text-xs mt-1 font-medium">
            Every Bid. Every Player. Every Tournament. One Platform.
          </p>
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5">
          {error && (
            <div className="p-3 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@auctionos.com"
              icon={Mail}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={Lock}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              icon={ArrowRight}
            >
              {loading ? 'Authenticating...' : 'Sign In to Platform'}
            </Button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-admin-border">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
              Quick Role-Based Demo Logins
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleLogin('admin@auctionos.com', 'Password123!')}
                className="p-2.5 border border-admin-border hover:border-brand-500 hover:bg-brand-50/50 rounded-2xl text-left transition-all"
              >
                <div className="flex items-center gap-1.5 font-bold text-admin-text">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                  <span>Super Admin</span>
                </div>
                <div className="text-[10px] text-admin-muted truncate font-mono">admin@auctionos.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleLogin('auctioneer@mpl.com', 'Password123!')}
                className="p-2.5 border border-admin-border hover:border-purple-500 hover:bg-purple-50/50 rounded-2xl text-left transition-all"
              >
                <div className="flex items-center gap-1.5 font-bold text-admin-text">
                  <Gavel className="w-3.5 h-3.5 text-purple-600" />
                  <span>Auctioneer</span>
                </div>
                <div className="text-[10px] text-admin-muted truncate font-mono">auctioneer@mpl.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleLogin('owner.strikers@mpl.com', 'Password123!')}
                className="p-2.5 border border-admin-border hover:border-blue-500 hover:bg-blue-50/50 rounded-2xl text-left transition-all"
              >
                <div className="flex items-center gap-1.5 font-bold text-admin-text">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Strikers Owner</span>
                </div>
                <div className="text-[10px] text-admin-muted truncate font-mono">owner.strikers@mpl.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleLogin('owner.blasters@mpl.com', 'Password123!')}
                className="p-2.5 border border-admin-border hover:border-rose-500 hover:bg-rose-50/50 rounded-2xl text-left transition-all"
              >
                <div className="flex items-center gap-1.5 font-bold text-admin-text">
                  <UserCheck className="w-3.5 h-3.5 text-rose-600" />
                  <span>Blasters Owner</span>
                </div>
                <div className="text-[10px] text-admin-muted truncate font-mono">owner.blasters@mpl.com</div>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-admin-muted pt-2">
            Need a new tournament account?{' '}
            <Link href="/register" className="font-bold text-brand-600 hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
