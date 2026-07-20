'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BrainCircuit, Settings, LogOut, FolderHeart } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // Re-fetch on pathname change to update status
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        router.push('/login');
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  if (loading) {
    return (
      <header className="h-16 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between px-6">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-purple-500 animate-pulse" />
          <span className="font-bold text-lg text-white">Second Brain R&D</span>
        </div>
        <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
      </header>
    );
  }

  // If not authenticated or on login page, hide navbar controls (just show title)
  if (!user || pathname === '/login') {
    return (
      <header className="h-16 border-b border-white/5 bg-[#030303] flex items-center px-6">
        <Link href="/" className="flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-purple-500" />
          <span className="font-bold text-lg text-white tracking-wide">Second Brain R&D</span>
        </Link>
      </header>
    );
  }

  return (
    <header className="h-16 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
      <div className="flex items-center space-x-8">
        <Link href="/" className="flex items-center space-x-2 group">
          <BrainCircuit className="h-6 w-6 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
          <span className="font-bold text-lg text-white tracking-wide">Second Brain R&D</span>
          <span className="text-xs px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full font-medium">v4.0</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-1">
          <Link
            href="/projects"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              pathname.startsWith('/projects') || pathname === '/'
                ? 'bg-white/5 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderHeart className="h-4 w-4" />
            <span>Projects</span>
          </Link>

          {user.role === 'SUPER_ADMIN' && (
            <Link
              href="/settings"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                pathname === '/settings'
                  ? 'bg-white/5 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Global Settings</span>
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex flex-col items-end text-xs">
          <span className="font-semibold text-zinc-200">{user.email}</span>
          <span className={`text-[10px] uppercase tracking-wider font-bold ${
            user.role === 'SUPER_ADMIN' ? 'text-purple-400' : 'text-zinc-500'
          }`}>
            {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center p-2 rounded-lg bg-zinc-800/50 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 border border-white/5 transition-all"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
