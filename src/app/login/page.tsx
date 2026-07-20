'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Lock, Mail, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Force header update and redirect
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-[#030303] via-[#09090b] to-[#030303] relative overflow-hidden">
      {/* Decorative backdrop glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-4">
            <BrainCircuit className="h-10 w-10 text-purple-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back</h2>
          <p className="text-zinc-400 text-sm mt-2">Sign in to access your strategic marketing sandbox</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center space-x-2 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@secondbrain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input w-full pl-10 pr-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input w-full pl-10 pr-4 py-3 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-purple font-semibold text-white shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick login guidelines for testing */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-2">Default Accounts</span>
            <div className="flex flex-col space-y-1 text-xs text-zinc-400">
              <div>Super Admin: <code className="text-purple-400">superadmin@secondbrain.com</code> (SuperAdmin123!)</div>
              <div>Standard Admin: <code className="text-purple-400">admin@secondbrain.com</code> (Admin123!)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
