'use strict';
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderHeart,
  Plus,
  Calendar,
  User,
  Loader2,
  X,
  ChevronRight
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  admin_id: string;
  createdAt: string;
  admin: {
    email: string;
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.error('Fetch projects error:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreateLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setNewProjectName('');
        setShowModal(false);
        fetchProjects();
      } else {
        setError(data.error || 'Failed to create project');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-400">
        <FolderHeart className="h-10 w-10 text-purple-500 animate-pulse mb-4" />
        <span className="font-semibold text-sm">Loading project directory...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full flex flex-col justify-start">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-8 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Active Brand Projects</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Initialize and track e-commerce product analysis pipelines and strategy sandboxes.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-purple hover:shadow-purple-500/20 shadow-lg text-white font-semibold text-sm rounded-xl transition-all duration-300 transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New R&D Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-white/5 rounded-2xl bg-zinc-950/20 max-w-xl mx-auto w-full my-8 text-center">
          <FolderHeart className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No Projects Found</h3>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Every product journey starts with a project sandbox. Set up your first brand incubator to ingest Kalodata records.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/5 text-xs font-semibold rounded-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="glass-card p-6 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full font-medium">
                    Incubating
                  </span>
                  <div className="flex items-center text-[10px] text-zinc-500 space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 tracking-tight line-clamp-1">{project.name}</h3>

                <div className="flex items-center space-x-1 text-xs text-zinc-400 mb-6">
                  <User className="h-3 w-3" />
                  <span>Owner: {project.admin.email}</span>
                </div>
              </div>

              {/* Progress Flow visualization */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                  <span>Pipeline Progress</span>
                  <span className="text-purple-400">Phase 1</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="bg-purple-500 rounded-full" title="Phase 1: Ingestion" />
                  <div className="bg-zinc-800 rounded-full" title="Phase 2: Sparring" />
                  <div className="bg-zinc-800 rounded-full" title="Phase 3: Branding" />
                  <div className="bg-zinc-800 rounded-full" title="Phase 4: Export" />
                </div>

                <button
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="w-full flex items-center justify-center space-x-1 py-2 rounded-xl bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/20 text-zinc-300 border border-white/5 text-xs font-semibold tracking-wide transition-all"
                >
                  <span>Launch Workflow</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-white/5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Create R&D Project</h3>
            <p className="text-zinc-400 text-xs mb-6">
              Enter a name for your new product incubator and sandbox space.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Slimming Herbal Jelly v1"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="form-input w-full px-3 py-2 text-sm"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-300 font-semibold text-xs hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !newProjectName.trim()}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-gradient-purple text-white font-semibold text-xs rounded-xl hover:shadow-purple-500/10 shadow-lg transition-all disabled:opacity-50"
                >
                  {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Create Project</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
