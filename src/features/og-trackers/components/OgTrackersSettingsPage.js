'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function OgTrackersSettingsPage() {
  const { user } = useAuth();
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [codestudioUsername, setCodestudioUsername] = useState('');
  const [hackerrankUsername, setHackerrankUsername] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/og-trackers/settings', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setIsPremium(Boolean(data.isPremium));
      setLeetcodeUsername(data.leetcodeUsername || '');
      setCodestudioUsername(data.codestudioUsername || '');
      setHackerrankUsername(data.hackerrankUsername || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/og-trackers/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leetcodeUsername, codestudioUsername, hackerrankUsername }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Save failed');
      setMessage('Saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const refresh = async () => {
    if (cooldown > 0) return;
    setSyncing(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/og-trackers/sync/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Sync failed');
      setMessage(
        `Checked ${data.checked || 0} tracker problems · ${data.updated || 0} newly completed`
      );
      setCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-neutral-600">
        Sign in to manage OG Trackers settings.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link
        href="/og-trackers"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        OG Trackers
      </Link>
      <h1 className="text-2xl font-semibold text-neutral-900">Judge usernames</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Premium members can sync LeetCode, HackerRank, and CodeStudio progress.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 mt-8 text-neutral-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : !isPremium ? (
        <p className="mt-8 text-sm text-amber-700">
          Unlock OG Trackers Premium to save usernames and enable sync.
        </p>
      ) : (
        <form onSubmit={save} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-neutral-600">LeetCode username</span>
            <input
              value={leetcodeUsername}
              onChange={(e) => setLeetcodeUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              placeholder="your-leetcode-id"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-neutral-600">HackerRank username</span>
            <input
              value={hackerrankUsername}
              onChange={(e) => setHackerrankUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              placeholder="your-hackerrank-id"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-neutral-600">CodeStudio username</span>
            <input
              value={codestudioUsername}
              onChange={(e) => setCodestudioUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              placeholder="your-codestudio-id"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              disabled={syncing || cooldown > 0}
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Refresh (${cooldown}s)` : 'Refresh my progress'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
