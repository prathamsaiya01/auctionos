'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { Trophy, ShieldCheck, Gavel, UserCheck, ArrowRight, Lock, Mail } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-yellow-300" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">AUCTIONOS</h1>
          <p className="text-blue-100 text-xs mt-1 font-medium">
            Every Bid. Every Player. Every Tournament. One Platform.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">
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
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@auctionos.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Platform'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
              Quick Role-Based Demo Logins
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleLogin('admin@auctionos.com', 'Password123!')}
                className="p-2.5 border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl text-left transition-all"
              >
                <div className="flex items-center gap-1.5 font-bold text-gray-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Super Admin
                </div>
                <div className="text-[10px] text-gray-400 truncate">admin@auctionos.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleLogin('auctioneer@mpl.com', 'Password123!')}
                className="p-2.5 border border-gray-200 hover:border-purple-500 hover:bg-purple-50/50 rounded-xl text-left transition-all"
              >
                <div className="flex items-center gap-1.5 font-bold text-gray-800">
                  <Gavel className="w-3.5 h-3.5 text-purple-600" />
                  Auctioneer Host
                </div>
                <div className="text-[10px] text-gray-400 truncate">auctioneer@mpl.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleLogin('owner.strikers@mpl.com', 'Password123!')}
                className="p-2.5 border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl text-left transition-all"
              >
                <div className="flex items-center gap-1.5 font-bold text-gray-800">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Strikers Owner
                </div>
                <div className="text-[10px] text-gray-400 truncate">owner.strikers@mpl.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleLogin('owner.blasters@mpl.com', 'Password123!')}
                className="p-2.5 border border-gray-200 hover:border-red-500 hover:bg-red-50/50 rounded-xl text-left transition-all"
              >
                <div className="flex items-center gap-1.5 font-bold text-gray-800">
                  <UserCheck className="w-3.5 h-3.5 text-red-600" />
                  Blasters Owner
                </div>
                <div className="text-[10px] text-gray-400 truncate">owner.blasters@mpl.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
