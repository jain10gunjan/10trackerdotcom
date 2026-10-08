'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Crown,
  Play,
  Code2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import OgYouTubePlayer from '@/features/og-trackers/components/OgYouTubePlayer';
import OgPremiumCheckout from '@/features/og-trackers/components/OgPremiumCheckout';

function StatusIcon({ status, active }) {
  if (status === 'COMPLETED') {
    return (
      <CheckCircle2
        className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-300' : 'text-emerald-600'}`}
      />
    );
  }
  if (status === 'IN_PROGRESS') {
    return (
      <Circle
        className={`w-4 h-4 shrink-0 ${
          active ? 'text-amber-300 fill-amber-900/40' : 'text-amber-500 fill-amber-100'
        }`}
      />
    );
  }
  return (
    <Circle
      className={`w-4 h-4 shrink-0 ${active ? 'text-neutral-500' : 'text-neutral-300'}`}
    />
  );
}

function typeLabel(type) {
  if (type === 'VIDEO') return 'Video';
  if (type === 'LEETCODE_PROBLEM') return 'LeetCode';
  if (type === 'CODESTUDIO_PROBLEM') return 'CodeStudio';
  if (type === 'HACKERRANK_PROBLEM') return 'HackerRank';
  return type;
}

export default function OgPathViewerPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [beaconTokens, setBeaconTokens] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [pathSyncing, setPathSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/og-trackers/${slug}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.setupHint || 'Failed to load path');
      }
      setData(json);
      setBeaconTokens(json.beaconTokens || {});
      setSelectedId((prev) => {
        if (prev && json.resources?.some((r) => r.id === prev)) return prev;
        return json.resources?.[0]?.id || null;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = data?.resources?.find((r) => r.id === selectedId) || null;

  const syncResource = async (resourceId) => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/og-trackers/sync/resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resourceId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Sync failed');
      }
      setSyncMsg(
        json.judgeStatus === 'SOLVED'
          ? 'Marked complete — solved on judge'
          : `Not solved yet (${json.slug || 'problem'})`
      );
      await load();
    } catch (err) {
      setSyncMsg(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const syncPathProblems = async () => {
    if (!data?.path?.id || pathSyncing) return;
    setPathSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/og-trackers/sync/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pathId: data.path.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Sync failed');
      }
      setSyncMsg(
        `Checked ${json.checked || 0} problems · ${json.updated || 0} newly completed`
      );
      await load();
    } catch (err) {
      setSyncMsg(err.message);
    } finally {
      setPathSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-neutral-600">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading tracker…
      </div>
    );
  }

  if (error || !data?.path) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-red-600 text-sm">{error || 'Tracker not found'}</p>
        <Link
          href="/og-trackers"
          className="mt-4 inline-block text-sm text-neutral-900 underline underline-offset-2"
        >
          Back to OG Trackers
        </Link>
      </div>
    );
  }

  const { path, resources, isPremium } = data;

  return (
    <div className="min-h-[70vh] bg-neutral-50/80">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Link
          href="/og-trackers"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          All trackers
        </Link>

        <header className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {path.category || 'General'}
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
              {path.title}
            </h1>
            {path.description ? (
              <p className="mt-2 text-sm text-neutral-600 max-w-2xl">{path.description}</p>
            ) : null}
            <div className="mt-4 max-w-sm">
              <div className="flex justify-between text-xs text-neutral-500 mb-1">
                <span>
                  {path.completedResources}/{path.totalResources} complete
                </span>
                <span className="tabular-nums font-medium text-neutral-800">{path.percent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-200/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-neutral-900"
                  style={{ width: `${path.percent}%` }}
                />
              </div>
            </div>
          </div>
          {path.locked ? (
            <button
              type="button"
              onClick={() => setShowCheckout(true)}
              disabled={!user}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              Unlock premium
            </button>
          ) : isPremium && user ? (
            <button
              type="button"
              onClick={syncPathProblems}
              disabled={pathSyncing}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${pathSyncing ? 'animate-spin' : ''}`} />
              {pathSyncing ? 'Checking…' : 'Sync problems'}
            </button>
          ) : null}
        </header>

        {syncMsg ? (
          <p className="mb-4 text-sm text-neutral-600">{syncMsg}</p>
        ) : null}

        <div className="grid lg:grid-cols-[minmax(0,280px)_1fr] gap-5 items-start">
          <aside className="rounded-2xl border border-neutral-200/80 bg-white overflow-hidden lg:sticky lg:top-24 max-h-[min(70vh,640px)] overflow-y-auto shadow-sm">
            <div className="px-4 py-3 border-b border-neutral-100 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Curriculum
            </div>
            <ul>
              {resources.map((r, idx) => {
                const active = selectedId === r.id;
                return (
                  <li key={r.id} className="border-b border-neutral-50 last:border-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(r.id);
                        setSyncMsg(null);
                      }}
                      className={`w-full text-left px-3 py-3 flex items-start gap-2.5 text-sm transition ${
                        active ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50 text-neutral-900'
                      }`}
                    >
                      <StatusIcon status={r.progress?.status} active={active} />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium line-clamp-2">
                          <span
                            className={`tabular-nums mr-1.5 ${
                              active ? 'text-neutral-400' : 'text-neutral-400'
                            }`}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          {r.title}
                        </span>
                        <span
                          className={`mt-0.5 flex items-center gap-1 text-[11px] ${
                            active ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                        >
                          {r.type === 'VIDEO' ? (
                            <Play className="w-3 h-3" />
                          ) : (
                            <Code2 className="w-3 h-3" />
                          )}
                          {typeLabel(r.type)}
                          {r.locked ? ' · Locked' : ''}
                          {r.type === 'VIDEO' && r.progress?.percentWatched
                            ? ` · ${r.progress.percentWatched}%`
                            : ''}
                        </span>
                      </span>
                      {r.locked ? (
                        <Lock
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            active ? 'text-amber-300' : 'text-amber-600'
                          }`}
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-6 min-h-[360px] shadow-sm">
            {!selected ? (
              <p className="text-sm text-neutral-500 py-16 text-center">
                Select a lesson from the curriculum
              </p>
            ) : selected.locked ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5 text-amber-700" />
                </div>
                <p className="font-semibold text-neutral-900 text-lg">{selected.title}</p>
                <p className="mt-2 text-sm text-neutral-600 max-w-sm">
                  Premium lesson. Unlock OG Trackers Premium to watch and sync problems.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCheckout(true)}
                  disabled={!user}
                  className="mt-5 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Unlock premium
                </button>
              </div>
            ) : selected.type === 'VIDEO' ? (
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">{selected.title}</h2>
                <OgYouTubePlayer
                  key={selected.id}
                  videoId={selected.youtubeVideoId}
                  resourceId={selected.id}
                  initialPercent={selected.progress?.percentWatched || 0}
                  beaconToken={beaconTokens[selected.id]}
                  trackProgress={Boolean(user)}
                  onMilestone={({ status }) => {
                    if (status === 'COMPLETED') {
                      setData((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          resources: prev.resources.map((r) =>
                            r.id === selected.id
                              ? {
                                  ...r,
                                  progress: {
                                    ...r.progress,
                                    status: 'COMPLETED',
                                    percentWatched: Math.max(
                                      r.progress?.percentWatched || 0,
                                      90
                                    ),
                                  },
                                }
                              : r
                          ),
                        };
                      });
                    }
                  }}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">{selected.title}</h2>
                {selected.difficulty ? (
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
                    {selected.difficulty}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-wrap gap-3">
                  {selected.externalUrl ? (
                    <a
                      href={selected.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
                      onClick={() => {
                        if (isPremium) syncResource(selected.id);
                      }}
                    >
                      Open problem
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <p className="text-sm text-neutral-500">No problem URL configured.</p>
                  )}
                  {isPremium ? (
                    <button
                      type="button"
                      disabled={syncing}
                      onClick={() => syncResource(selected.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                      Check status
                    </button>
                  ) : null}
                </div>
                {!isPremium ? (
                  <p className="mt-4 text-sm text-neutral-500">
                    Premium unlocks automatic LeetCode / HackerRank / CodeStudio sync for
                    the question URLs on this tracker.
                  </p>
                ) : (
                  <p className="mt-4 text-xs text-neutral-500">
                    We only check the problem URLs added to this tracker — solved ones are
                    marked complete.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

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
  );
}
