'use strict';
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Key,
  MessageSquare,
  FileText,
  AlertTriangle,
  Upload,
  Save,
  CheckCircle,
  FileCode,
  Trash2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface SettingsData {
  ai_text_key: string;
  ai_text_model: string;
  ai_image_key: string;
  ai_image_model: string;
  master_template_url: string | null;
  phase_1_prompt: string;
  phase_2_prompt: string;
  phase_3_prompt: string;
  phase_4_prompt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [wipeLoading, setWipeLoading] = useState(false);
  
  // UI States
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  // Danger Zone Double Confirmation
  const [wipeConfirmStep, setWipeConfirmStep] = useState(0);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      } else {
        setError('Failed to load settings.');
      }
    } catch {
      setError('An error occurred while loading settings.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setError(null);
    setSuccess(null);
    setSaveLoading(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('Global configuration updated successfully.');
        setSettings(data.settings);
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.error || 'Failed to save settings.');
      }
    } catch {
      setError('An error occurred while saving.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extensions
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pptx' && ext !== '.pdf') {
      setError('Invalid template format. Please upload a .pptx or .pdf file.');
      return;
    }

    setUploadLoading(true);
    setUploadSuccess(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/settings/upload-template', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUploadSuccess(`Template "${data.filename}" uploaded successfully!`);
        setSettings((prev) => prev ? { ...prev, master_template_url: data.url } : null);
        setTimeout(() => setUploadSuccess(null), 4000);
      } else {
        setError(data.error || 'Template upload failed.');
      }
    } catch {
      setError('An error occurred during template upload.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleWipeData = async () => {
    if (wipeConfirmStep < 2) {
      setWipeConfirmStep(wipeConfirmStep + 1);
      return;
    }

    setWipeLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/settings/wipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('All storage data, projects, and templates have been forcefully wiped.');
        setWipeConfirmStep(0);
        // Refresh settings since template url got reset
        fetchSettings();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'Failed to wipe data.');
      }
    } catch {
      setError('An error occurred while wiping storage.');
    } finally {
      setWipeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-400">
        <Settings className="h-10 w-10 text-purple-500 animate-spin mb-4" />
        <span className="font-semibold text-sm">Loading global settings dashboard...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-400">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
        <span className="font-semibold text-sm">Settings not loaded. Try logging in as Super Admin.</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-8 mb-8 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="h-3 w-3" />
            <span>Super Admin Settings</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Global Configurations</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Exclusively manage global AI engines, dynamic system prompts, and master templates.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saveLoading}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-purple hover:shadow-purple-500/20 shadow-lg text-white font-semibold text-sm rounded-xl transition-all duration-300 transform active:scale-95 disabled:opacity-50"
        >
          {saveLoading ? <span className="animate-pulse">Saving...</span> : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2.5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-medium mb-6">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-medium mb-6">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* API Configurations */}
        <section className="glass-panel p-6 rounded-2xl border border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center mb-6">
            <Key className="h-5 w-5 text-purple-400 mr-2" />
            <span>API Configurations</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Text engine settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-300 border-b border-white/5 pb-2">AI Text & Sparring Engine</h3>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 block">AI Text Provider API Key</label>
                <input
                  type="password"
                  placeholder="Enter API Key"
                  value={settings.ai_text_key}
                  onChange={(e) => setSettings({ ...settings, ai_text_key: e.target.value })}
                  className="form-input w-full px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 block">Model Selection</label>
                <select
                  value={settings.ai_text_model}
                  onChange={(e) => setSettings({ ...settings, ai_text_model: e.target.value })}
                  className="form-input w-full px-3 py-2 text-sm bg-zinc-900 border border-white/5 text-white"
                >
                  <option value="gpt-4">GPT-4 (Recommended)</option>
                  <option value="gpt-4o">GPT-4o (High Speed)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                </select>
              </div>
            </div>

            {/* Image engine settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-300 border-b border-white/5 pb-2">AI Image Generation Engine</h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 block">AI Image Provider API Key</label>
                <input
                  type="password"
                  placeholder="Enter API Key"
                  value={settings.ai_image_key}
                  onChange={(e) => setSettings({ ...settings, ai_image_key: e.target.value })}
                  className="form-input w-full px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 block">Model Selection</label>
                <select
                  value={settings.ai_image_model}
                  onChange={(e) => setSettings({ ...settings, ai_image_model: e.target.value })}
                  className="form-input w-full px-3 py-2 text-sm bg-zinc-900 border border-white/5 text-white"
                >
                  <option value="dall-e-3">DALL-E 3 (Recommended)</option>
                  <option value="dall-e-2">DALL-E 2</option>
                  <option value="stable-diffusion-xl">Stable Diffusion XL</option>
                  <option value="midjourney-v6">Midjourney v6 API</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic prompts */}
        <section className="glass-panel p-6 rounded-2xl border border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center mb-6">
            <MessageSquare className="h-5 w-5 text-purple-400 mr-2" />
            <span>Dynamic AI Prompts (Phases 1-4)</span>
          </h2>
          <div className="space-y-6">
            {/* Phase 1 prompt */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center uppercase tracking-wide">
                <span className="text-purple-400 mr-1.5 font-bold">Phase 1:</span>
                System Prompt - Data Analyst Persona
              </label>
              <textarea
                value={settings.phase_1_prompt}
                onChange={(e) => setSettings({ ...settings, phase_1_prompt: e.target.value })}
                className="form-input w-full px-4 py-3 text-sm font-mono min-h-[160px] leading-relaxed"
                placeholder="Instruct the AI how to parse, clean (BPOM TR/MD), and aggregate revenue statistics..."
              />
            </div>

            {/* Phase 2 prompt */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center uppercase tracking-wide">
                <span className="text-purple-400 mr-1.5 font-bold">Phase 2:</span>
                System Prompt - Strategy Sparring Persona
              </label>
              <textarea
                value={settings.phase_2_prompt}
                onChange={(e) => setSettings({ ...settings, phase_2_prompt: e.target.value })}
                className="form-input w-full px-4 py-3 text-sm font-mono min-h-[160px] leading-relaxed"
                placeholder="Instruct the AI sparring partner how to recommend ingredients and debate formulations..."
              />
            </div>

            {/* Phase 3 prompt */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center uppercase tracking-wide">
                <span className="text-purple-400 mr-1.5 font-bold">Phase 3:</span>
                System Prompt - Brand Brainstorm Persona
              </label>
              <textarea
                value={settings.phase_3_prompt}
                onChange={(e) => setSettings({ ...settings, phase_3_prompt: e.target.value })}
                className="form-input w-full px-4 py-3 text-sm font-mono min-h-[160px] leading-relaxed"
                placeholder="Instruct the AI how to brainstorm product name combinations and aesthetics assets..."
              />
            </div>

            {/* Phase 4 prompt */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center uppercase tracking-wide">
                <span className="text-purple-400 mr-1.5 font-bold">Phase 4:</span>
                System Prompt - Pitch Deck Compiler Persona
              </label>
              <textarea
                value={settings.phase_4_prompt}
                onChange={(e) => setSettings({ ...settings, phase_4_prompt: e.target.value })}
                className="form-input w-full px-4 py-3 text-sm font-mono min-h-[160px] leading-relaxed"
                placeholder="Instruct the AI how to compile JSON contexts strictly mapping key slides..."
              />
            </div>
          </div>
        </section>

        {/* Master template */}
        <section className="glass-panel p-6 rounded-2xl border border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center mb-6">
            <FileText className="h-5 w-5 text-purple-400 mr-2" />
            <span>Master Pitch Deck Template</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <p className="text-sm text-zinc-400 leading-relaxed">
                Upload the master pitch deck PowerPoint (.pptx) or PDF template. In Phase 4, the PDF compiler engine will inject data mapping variables into the slides of this template.
              </p>
              {settings.master_template_url ? (
                <div className="mt-4 inline-flex items-center space-x-2 p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs">
                  <FileCode className="h-4 w-4" />
                  <span>Current Template:</span>
                  <a
                    href={settings.master_template_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold hover:text-white"
                  >
                    View File
                  </a>
                </div>
              ) : (
                <div className="mt-4 text-xs text-zinc-500 italic">No master template currently uploaded.</div>
              )}
            </div>

            <div className="relative">
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 hover:border-purple-500/40 rounded-xl cursor-pointer hover:bg-white/5 transition-all text-center">
                <Upload className="h-6 w-6 text-zinc-400 mb-2" />
                <span className="text-xs font-semibold text-zinc-300">
                  {uploadLoading ? 'Uploading...' : 'Choose Template File'}
                </span>
                <span className="text-[9px] text-zinc-500 mt-1 uppercase">.pptx or .pdf only</span>
                <input
                  type="file"
                  accept=".pptx,.pdf"
                  onChange={handleFileUpload}
                  disabled={uploadLoading}
                  className="hidden"
                />
              </label>
              {uploadSuccess && (
                <div className="absolute -bottom-10 left-0 right-0 text-center text-xs text-emerald-400 font-semibold animate-pulse">
                  {uploadSuccess}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section className="border border-red-500/25 bg-red-500/5 p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-red-400 flex items-center mb-2">
            <Trash2 className="h-5 w-5 mr-2" />
            <span>Danger Zone</span>
          </h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Actions here are destructive and cannot be undone. You will wipe all local storage data, including templates, competitor spreadsheet files, product name states, and database project entries.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-950/60 rounded-xl border border-red-500/10 gap-4">
            <div>
              <span className="text-sm font-bold text-white block">Wipe All Server Storage Data</span>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">Resets settings, wipes uploads & databases</span>
            </div>

            <button
              onClick={handleWipeData}
              disabled={wipeLoading}
              className={`flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-300 ${
                wipeConfirmStep === 0
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                  : wipeConfirmStep === 1
                  ? 'bg-amber-600 text-white hover:bg-amber-700 animate-bounce'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>
                {wipeLoading ? 'Wiping...' : 
                 wipeConfirmStep === 0 ? 'Wipe Storage Data' : 
                 wipeConfirmStep === 1 ? 'Double Confirmation Needed' : 
                 'Are you sure? Wipe everything!'}
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
