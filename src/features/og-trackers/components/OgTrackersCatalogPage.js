'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  PlayCircle,
  Code2,
  BookOpen,
  Loader2,
  AlertCircle,
  Crown,
  Map,
  Coffee,
  Globe,
  Database,
  Smartphone,
  Server,
  Brain,
  Terminal,
  Layers,
  Cpu,
  FileCode,
  Braces,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import OgPremiumCheckout from '@/features/og-trackers/components/OgPremiumCheckout';

const ICON_MAP = {
  Map,
  Code2,
  Coffee,
  Globe,
  Database,
  Smartphone,
  Server,
  Brain,
  BookOpen,
  Terminal,
  Layers,
  Cpu,
  FileCode,
  Braces,
  Sparkles,
};

function TrackerIcon({ name, className }) {
  const Icon = ICON_MAP[name] || Map;
  return <Icon className={className} />;
}

export default function OgTrackersCatalogPage() {
  const { user } = useAuth();
  const [paths, setPaths] = useState([]);
  const [stats, setStats] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setupHint, setSetupHint] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/og-trackers', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load');
      }
      setPaths(data.paths || []);
      setStats(data.stats || null);
      setIsPremium(Boolean(data.isPremium));
      setSetupHint(data.setupRequired ? data.setupHint : null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    const set = new Set();
    paths.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [paths]);

  const tags = useMemo(() => {
    const set = new Set();
    paths.forEach((p) => {
      (p.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [paths]);

  const filtered = useMemo(() => {
    return paths.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (tagFilter !== 'all' && !(p.tags || []).includes(tagFilter)) return false;
      return true;
    });
  }, [paths, categoryFilter, tagFilter]);

  return (
    <div className="min-h-[70vh] bg-neutral-50/80">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
            OG Trackers
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
            All trackers
          </h1>
          <p className="mt-2 text-sm text-neutral-600 max-w-xl">
            Pick a tracker — Java, Web Dev, DSA, and more. Each has its own videos and
            coding problems, managed by admins.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPremium ? (
            <Link
              href="/og-trackers/settings"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 shadow-sm"
            >
              <Crown className="w-4 h-4 text-amber-500" />
              Premium settings
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowCheckout(true)}
              disabled={!user}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              Unlock premium
            </button>
          )}
        </div>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Stat label="Videos done" value={stats.videosCompleted} icon={PlayCircle} />
          <Stat label="LeetCode" value={stats.leetcodeSolved} icon={Code2} />
          <Stat label="HackerRank" value={stats.hackerrankSolved} icon={Terminal} />
          <Stat label="CodeStudio" value={stats.codestudioSolved} icon={BookOpen} />
        </div>
      ) : null}

      {!loading && paths.length > 0 ? (
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={categoryFilter === 'all'}
              onClick={() => setCategoryFilter('all')}
              label="All categories"
            />
            {categories.map((c) => (
              <FilterChip
                key={c}
                active={categoryFilter === c}
                onClick={() => setCategoryFilter(c)}
                label={c}
              />
            ))}
          </div>
          {tags.length ? (
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={tagFilter === 'all'}
                onClick={() => setTagFilter('all')}
                label="All tags"
                muted
              />
              {tags.map((t) => (
                <FilterChip
                  key={t}
                  active={tagFilter === t}
                  onClick={() => setTagFilter(t)}
                  label={t}
                  muted
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {setupHint ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {setupHint}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-neutral-600">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading trackers…
        </div>
      ) : !filtered.length ? (
        <p className="text-center text-sm text-neutral-500 py-16">
          {paths.length
            ? 'No trackers match this filter.'
            : 'No trackers yet. Admins can create Java, Web Dev, DSA, and more under OG Trackers.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((path) => (
            <Link
              key={path.id}
              href={`/og-trackers/${path.slug}`}
              className="group rounded-2xl border border-neutral-200/80 bg-white p-5 hover:border-neutral-300 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white">
                    <TrackerIcon name={path.icon} className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-neutral-900 truncate">
                      {path.title}
                    </h2>
                    <p className="text-xs font-medium text-neutral-500 mt-0.5">
                      {path.category || 'General'}
                    </p>
                  </div>
                </div>
                {path.locked ? (
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                ) : path.isPremium ? (
                  <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                ) : null}
              </div>
              <p className="mt-3 text-sm text-neutral-600 line-clamp-2">{path.description}</p>
              {(path.tags || []).length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {path.tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-neutral-50 border border-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>
                    {path.completedResources}/{path.totalResources} done
                  </span>
                  <span className="tabular-nums font-medium text-neutral-800">{path.percent}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-neutral-900"
                    style={{ width: `${path.percent}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCheckout ? (
        <OgPremiumCheckout
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            load();
          }}
        />
      ) : null}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick, muted }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? 'bg-neutral-900 text-white border-neutral-900'
          : muted
            ? 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
            : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
      }`}
    >
      {label}
    </button>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900">{value ?? 0}</p>
    </div>
  );
}
