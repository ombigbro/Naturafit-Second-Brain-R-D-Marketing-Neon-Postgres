import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { Settings, Sparkles, Plus } from 'lucide-react';

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full text-xs font-semibold tracking-wider uppercase mb-6 animate-pulse">
          <Sparkles className="h-3 w-3" />
          <span>Strategic Marketing Sparrow</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
          Incubate Your Next <span className="text-gradient">TikTok Shop Blockbuster</span>
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          An end-to-end AI-assisted R&D workflow: processing e-commerce raw data, suggesting formulations, synthesizing competitors, generating brand visuals, and exporting investor-ready pitch decks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Phase 1 card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 font-bold text-lg">
              I
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Data Ingestion</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Clean raw Kalodata, filter BPOM TR/MD certifications, and visualize market categories dynamically.
            </p>
          </div>
          <div className="mt-8 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Phase 1
          </div>
        </div>

        {/* Phase 2 card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 font-bold text-lg">
              II
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Strategic sparring</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Formulation debates, ingredient recommendations, and competitor live stream & video dashboarding.
            </p>
          </div>
          <div className="mt-8 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Phase 2
          </div>
        </div>

        {/* Phase 3 card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 font-bold text-lg">
              III
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Brand Book Gen</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Brainstorm naming concepts, compile prompts, and generate 2D layouts and 3D mockups.
            </p>
          </div>
          <div className="mt-8 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Phase 3
          </div>
        </div>

        {/* Phase 4 card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 font-bold text-lg">
              IV
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pitch Deck PDF</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Automated slide compilation mapping the collected states strictly to the Master template.
            </p>
          </div>
          <div className="mt-8 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Phase 4
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
        <Link
          href="/projects"
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-purple font-semibold text-white shadow-lg hover:shadow-purple-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          <span>Create New Project</span>
        </Link>

        {user.role === 'SUPER_ADMIN' && (
          <Link
            href="/settings"
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-zinc-900 border border-white/5 font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-300"
          >
            <Settings className="h-5 w-5" />
            <span>Configure Global settings</span>
          </Link>
        )}
      </div>
    </div>
  );
}
