'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  Circle,
  ExternalLink,
  RefreshCw,
  Crown,
  Play,
  Code2,
  BookOpen,
  ClipboardList,
  ArrowRight,
  Flame,
  Target,
  Printer,
  Download,
  Timer,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import OgPremiumCheckout from '@/features/og-trackers/components/OgPremiumCheckout';
import ExtensionSetupModal from '@/features/extension-auth/components/ExtensionSetupModal';
import {
  ExtensionStatusBanner,
  ExtensionStatusChip,
} from '@/features/extension-auth/components/ExtensionStatus';
import { useExtensionPresence } from '@/features/extension-auth/hooks/useExtensionPresence';
import { appendOgReturnParams } from '@/features/og-trackers/lib/platformUrls';
import {
  downloadChecklistMarkdown,
  printChecklist,
} from '@/features/og-trackers/lib/exportChecklist';
import { GUEST_BRAND, easeOut } from '@/features/guest/components/guestMotion';
import { APP_GUTTER, APP_NAV_CONTENT_OFFSET } from '@/lib/appChrome';

function Shimmer({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-neutral-200/70 ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
    </div>
  );
}

function PathViewerSkeleton() {
  return (
    <div
      className="min-h-[70vh] bg-neutral-50/80"
      style={{ paddingTop: APP_NAV_CONTENT_OFFSET }}
    >
      <style>{`@keyframes shimmer{100%{transform:translateX(100%)}}`}</style>
      <div className={`mx-auto max-w-3xl ${APP_GUTTER} py-6 sm:py-8`}>
        <Shimmer className="h-4 w-28 mb-6" />
        <Shimmer className="h-8 w-2/3 max-w-md mb-3" />
        <Shimmer className="h-4 w-full max-w-lg mb-6" />
        <Shimmer className="h-2 w-full max-w-sm mb-8" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-200/80 bg-white p-4 flex gap-3"
            >
              <Shimmer className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-3/4" />
                <Shimmer className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === 'COMPLETED') {
    return <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />;
  }
  if (status === 'IN_PROGRESS') {
    return <Circle className="w-4 h-4 shrink-0 text-amber-500 fill-amber-100" />;
  }
  return <Circle className="w-4 h-4 shrink-0 text-neutral-300" />;
}

function typeLabel(type) {
  if (type === 'VIDEO') return 'Video';
  if (type === 'LEETCODE_PROBLEM') return 'LeetCode';
  if (type === 'CODESTUDIO_PROBLEM') return 'CodeStudio';
  if (type === 'HACKERRANK_PROBLEM') return 'HackerRank';
  if (type === 'PRACTICE_CHAPTER') return 'Practice';
  if (type === 'MOCK_TEST') return 'Mock test';
  return type;
}

function TypeIcon({ type, className = 'w-3 h-3' }) {
  if (type === 'VIDEO') return <Play className={className} />;
  if (type === 'PRACTICE_CHAPTER') return <BookOpen className={className} />;
  if (type === 'MOCK_TEST') return <ClipboardList className={className} />;
  return <Code2 className={className} />;
}

function youtubeWatchUrl(resource) {
  if (!resource?.youtubeVideoId) return null;
  const base = `https://www.youtube.com/watch?v=${resource.youtubeVideoId}`;
  const percent = resource.progress?.percentWatched || 0;
  const duration = resource.durationSeconds;
  if (!duration || percent <= 0) return base;
  const seconds = Math.max(
    0,
    Math.floor((duration * Math.min(percent, 99)) / 100)
  );
  return `${base}&t=${seconds}s`;
}

function isPlatformType(type) {
  return type === 'PRACTICE_CHAPTER' || type === 'MOCK_TEST';
}

function isJudgeType(type) {
  return (
    type === 'LEETCODE_PROBLEM' ||
    type === 'CODESTUDIO_PROBLEM' ||
    type === 'HACKERRANK_PROBLEM'
  );
}

function ctaLabel(type, status) {
  if (type === 'VIDEO') return status === 'IN_PROGRESS' ? 'Resume video' : 'Watch on YouTube';
  if (type === 'PRACTICE_CHAPTER') {
    return status === 'IN_PROGRESS' ? 'Continue practice' : 'Open practice';
  }
  if (type === 'MOCK_TEST') {
    return status === 'COMPLETED' ? 'Retake mock' : status === 'IN_PROGRESS' ? 'Resume mock' : 'Take mock';
  }
  return 'Open problem';
}

function progressCaption(resource) {
  const percent = resource.progress?.percentWatched ?? 0;
  const detail = resource.progress?.detail;
  const done = resource.progress?.status === 'COMPLETED';

  if (resource.type === 'PRACTICE_CHAPTER' && detail?.totalCount) {
    return `${detail.completedCount}/${detail.totalCount} Qs${done ? ' · Done' : ''}`;
  }
  if (resource.type === 'MOCK_TEST') {
    if (done && detail?.bestScore != null) return `Score ${detail.bestScore}% · Done`;
    if (done) return 'Completed';
    if (resource.progress?.status === 'IN_PROGRESS') return 'In progress';
    return 'Not started';
  }
  if (resource.type === 'VIDEO') {
    return `${percent}%${done ? ' · Done' : ''}`;
  }
  return done ? 'Solved' : resource.progress?.status === 'IN_PROGRESS' ? 'In progress' : null;
}

function isBlocked(resource) {
  return Boolean(resource?.locked || resource?.sequenceLocked);
}

function resourceHref(resource, pathSlug) {
  if (isBlocked(resource)) return null;
  if (resource.type === 'VIDEO') return youtubeWatchUrl(resource);
  if (!resource.externalUrl) return null;
  if (isPlatformType(resource.type)) {
    return appendOgReturnParams(resource.externalUrl, {
      pathSlug,
      resourceId: resource.id,
    });
  }
  return resource.externalUrl;
}

function groupBySection(resources) {
  const groups = [];
  const index = new Map();
  resources.forEach((r, idx) => {
    const label = (r.sectionLabel || '').trim() || 'Path';
    if (!index.has(label)) {
      index.set(label, groups.length);
      groups.push({ label, items: [] });
    }
    groups[index.get(label)].items.push({ resource: r, globalIndex: idx });
  });
  return groups;
}

function BreakdownStrip({ breakdown }) {
  if (!breakdown) return null;
  const items = [
    { key: 'videos', label: 'Videos', data: breakdown.videos },
    { key: 'practice', label: 'Practice', data: breakdown.practice },
    { key: 'mocks', label: 'Mocks', data: breakdown.mocks },
    { key: 'coding', label: 'Coding', data: breakdown.coding },
  ].filter((x) => x.data?.total > 0);

  if (!items.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.key}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600"
        >
          <span className="text-neutral-900 tabular-nums">
            {item.data.completed}/{item.data.total}
          </span>
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ProgressBar({ percent, done }) {
  return (
    <div className="mt-2.5 max-w-md">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neutral-500">Progress</span>
        <span className="tabular-nums font-semibold text-neutral-900">{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            done || percent >= 90 ? 'bg-emerald-600' : 'bg-neutral-900'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

export default function OgPathViewerPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [pathSyncing, setPathSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showExtSetup, setShowExtSetup] = useState(false);
  const extPromptedRef = useRef(false);

  const hasVideos = useMemo(
    () => (data?.resources || []).some((r) => r.type === 'VIDEO' && r.youtubeVideoId),
    [data?.resources]
  );

  const {
    installed: extInstalled,
    connected: extConnected,
    needsSetup: extNeedsSetup,
    needsConnect: extNeedsConnect,
    mode: extMode,
    ready: extReady,
    refresh: refreshExt,
    dismissSession,
    wasDismissed,
    clearDismiss,
  } = useExtensionPresence({
    enabled: Boolean(user && hasVideos),
  });

  useEffect(() => {
    // Auto-open only when installed but not linked — never re-show install popup
    if (!user || !hasVideos || !extReady || !extNeedsConnect) return;
    if (extPromptedRef.current || wasDismissed()) return;
    extPromptedRef.current = true;
    setShowExtSetup(true);
  }, [user, hasVideos, extReady, extNeedsConnect, wasDismissed]);

  const openExtSetup = useCallback(() => {
    clearDismiss();
    setShowExtSetup(true);
  }, [clearDismiss]);

  const closeExtSetup = useCallback(() => {
    dismissSession();
    setShowExtSetup(false);
    void refreshExt();
  }, [dismissSession, refreshExt]);

  const onWatchVideoClick = useCallback(
    (event) => {
      if (!extNeedsSetup) return;
      event.preventDefault();
      openExtSetup();
    },
    [extNeedsSetup, openExtSetup]
  );

  const load = useCallback(
    async ({ silent = false, sync = false } = {}) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const qs = sync ? '?sync=1' : '';
        const res = await fetch(`/api/og-trackers/${slug}${qs}`, {
          credentials: 'include',
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || json.setupHint || 'Failed to load path');
        }
        setData(json);
      } catch (err) {
        if (!silent) setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Light refresh only when tab becomes visible again — no 12s hammering
  useEffect(() => {
    if (!user) return undefined;
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        load({ silent: true, sync: false });
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [user, load]);

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
      await load({ silent: true });
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
      await load({ silent: true });
    } catch (err) {
      setSyncMsg(err.message);
    } finally {
      setPathSyncing(false);
    }
  };

  const continueResource = useMemo(() => {
    const list = data?.resources || [];
    return (
      list.find(
        (r) => !isBlocked(r) && r.progress?.status !== 'COMPLETED'
      ) || null
    );
  }, [data?.resources]);

  const sections = useMemo(
    () => groupBySection(data?.resources || []),
    [data?.resources]
  );

  const insights = data?.insights || null;
  const missingJudge = data?.missingJudgeUsernames;

  if (loading) {
    return <PathViewerSkeleton />;
  }

  if (error || !data?.path) {
    return (
      <div
        className="mx-auto max-w-3xl px-4 py-16 text-center"
        style={{ paddingTop: `calc(${APP_NAV_CONTENT_OFFSET} + 2rem)` }}
      >
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
  const continueHref = continueResource
    ? resourceHref(continueResource, path.slug)
    : null;

  return (
    <div
      className="min-h-[70vh] bg-neutral-50/80 pb-28"
      style={{ paddingTop: APP_NAV_CONTENT_OFFSET }}
    >
      <div className={`mx-auto max-w-3xl ${APP_GUTTER} pt-5 sm:pt-7 pb-8`}>
        <Link
          href="/og-trackers"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All trackers
        </Link>

        <motion.header
          className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOut }}
        >
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
                  {refreshing ? ' · syncing…' : ''}
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
            <BreakdownStrip breakdown={path.breakdown} />
            {user && (insights || hasVideos) ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {hasVideos ? (
                  <ExtensionStatusChip
                    ready={extReady}
                    connected={extConnected}
                    onClick={openExtSetup}
                  />
                ) : null}
                {insights ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-900">
                      <Flame className="w-3.5 h-3.5" />
                      {insights.streakDays || 0} day streak
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
                        insights.weeklyMet
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-neutral-200 bg-white text-neutral-700'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5" />
                      Week {insights.weeklyCompleted}/{insights.weeklyGoal} steps
                      {!insights.weeklyMet
                        ? ` · ${insights.weeklyRemaining} left`
                        : ' · goal met'}
                    </span>
                  </>
                ) : null}
                {path.sequentialUnlock ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">
                    <Lock className="w-3.5 h-3.5" />
                    Ordered unlock · {path.unlockThreshold}%
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => printChecklist(path, resources)}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              type="button"
              onClick={() => downloadChecklistMarkdown(path, resources)}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              type="button"
              onClick={() => load({ silent: true, sync: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
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
                {pathSyncing ? 'Checking…' : 'Sync coding'}
              </button>
            ) : null}
          </div>
        </motion.header>

        {syncMsg ? (
          <p className="mb-5 text-sm text-neutral-600">{syncMsg}</p>
        ) : null}

        {!user ? (
          <p className="mb-5 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
            Sign in to sync YouTube, practice, and mock progress into this path.
          </p>
        ) : null}

        {user && hasVideos ? (
          <ExtensionStatusBanner
            ready={extReady}
            connected={extConnected}
            needsConnect={extNeedsConnect}
            onConnect={openExtSetup}
            className="mb-5"
          />
        ) : null}

        {missingJudge &&
        (missingJudge.leetcode || missingJudge.codestudio || missingJudge.hackerrank) ? (
          <p className="mb-4 text-sm text-sky-900 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2">
            This path has coding problems.{' '}
            <Link href="/og-trackers/settings" className="font-semibold underline underline-offset-2">
              Add judge usernames
            </Link>{' '}
            then use Sync coding.
          </p>
        ) : null}

        {insights?.recommendations?.length ? (
          <div className="mb-5 rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-700" />
              <h2 className="text-sm font-semibold text-violet-950">Weak topic loop</h2>
            </div>
            <p className="text-xs text-violet-800 mb-3">
              Based on your latest mock topic scores — revisit these practice chapters.
            </p>
            <ul className="space-y-2">
              {insights.recommendations.map((rec) => (
                <li
                  key={rec.resourceId}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl bg-white border border-violet-100 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate">{rec.title}</p>
                    <p className="text-[11px] text-neutral-500">{rec.reason}</p>
                  </div>
                  {rec.href ? (
                    <Link
                      href={appendOgReturnParams(rec.href, {
                        pathSlug: path.slug,
                        resourceId: rec.resourceId,
                      })}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-800 shrink-0"
                    >
                      Practice
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-5">
          {sections.map((section) => {
            const doneCount = section.items.filter(
              (x) => x.resource.progress?.status === 'COMPLETED'
            ).length;
            const drill = insights?.moduleDrills?.[section.label];
            return (
              <section key={section.label}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
                  <h2 className="text-sm font-semibold text-neutral-800">{section.label}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] tabular-nums text-neutral-500">
                      {doneCount}/{section.items.length} done
                    </span>
                    {drill?.href && !path.locked ? (
                      <Link
                        href={drill.href}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-800 hover:bg-neutral-50"
                        title={`Timed drill via ${drill.title}`}
                      >
                        <Timer className="w-3 h-3" />
                        Timed drill
                      </Link>
                    ) : null}
                  </div>
                </div>
                <ul className="rounded-2xl border border-neutral-200/80 bg-white overflow-hidden shadow-sm divide-y divide-neutral-100">
                  {section.items.map(({ resource: r, globalIndex: idx }) => {
                    const percent = r.progress?.percentWatched ?? 0;
                    const href = resourceHref(r, path.slug);
                    const caption = progressCaption(r);
                    const blocked = isBlocked(r);
                    const showBar =
                      !blocked &&
                      (r.type === 'VIDEO' ||
                        r.type === 'PRACTICE_CHAPTER' ||
                        (r.type === 'MOCK_TEST' && percent > 0));
                    const openExternal = r.type === 'VIDEO' || isJudgeType(r.type);

                    return (
                      <li
                        key={r.id}
                        className={`px-4 py-3.5 sm:px-5 ${r.sequenceLocked ? 'bg-neutral-50/80' : ''}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <StatusIcon status={r.progress?.status} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                <span className="tabular-nums text-xs text-neutral-400 font-medium">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                <h3 className="text-sm font-semibold text-neutral-900 leading-snug">
                                  {r.title}
                                </h3>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-500">
                                <span className="inline-flex items-center gap-1">
                                  <TypeIcon type={r.type} />
                                  {typeLabel(r.type)}
                                </span>
                                {caption ? (
                                  <span className="tabular-nums text-neutral-700">{caption}</span>
                                ) : null}
                                {r.locked ? (
                                  <span className="inline-flex items-center gap-1 text-amber-700">
                                    <Lock className="w-3 h-3" />
                                    Premium
                                  </span>
                                ) : null}
                                {r.sequenceLocked ? (
                                  <span className="inline-flex items-center gap-1 text-neutral-500">
                                    <Lock className="w-3 h-3" />
                                    Finish “{r.unlockBlockedBy?.title || 'previous step'}” first
                                  </span>
                                ) : null}
                                {r.difficulty ? <span>{r.difficulty}</span> : null}
                              </div>

                              {showBar ? (
                                <ProgressBar
                                  percent={percent}
                                  done={r.progress?.status === 'COMPLETED'}
                                />
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 sm:shrink-0 sm:pl-2">
                            {r.locked ? (
                              <button
                                type="button"
                                onClick={() => setShowCheckout(true)}
                                disabled={!user}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 disabled:opacity-50"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                Unlock
                              </button>
                            ) : r.sequenceLocked ? (
                              <span className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-500">
                                <Lock className="w-3.5 h-3.5" />
                                Locked
                              </span>
                            ) : href ? (
                              <>
                                {openExternal ? (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800"
                                    onClick={(event) => {
                                      if (r.type === 'VIDEO' && extNeedsSetup) {
                                        onWatchVideoClick(event);
                                        return;
                                      }
                                      if (isJudgeType(r.type) && isPremium) syncResource(r.id);
                                    }}
                                  >
                                    {ctaLabel(r.type, r.progress?.status)}
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <Link
                                    href={href}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800"
                                  >
                                    {ctaLabel(r.type, r.progress?.status)}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                )}
                                {isJudgeType(r.type) && isPremium ? (
                                  <button
                                    type="button"
                                    disabled={syncing}
                                    onClick={() => syncResource(r.id)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                                  >
                                    <RefreshCw
                                      className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`}
                                    />
                                    Check
                                  </button>
                                ) : null}
                              </>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        {!resources.length ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-500">
            No steps in this path yet.
          </p>
        ) : null}

        <p className="mt-4 text-xs text-neutral-500">
          YouTube sync:{' '}
          {user && hasVideos && extReady ? (
            extConnected ? (
              <span className="font-semibold text-emerald-700">connected</span>
            ) : (
              <>
                <span className="font-semibold text-amber-800">not connected</span>
                {' · '}
                <button
                  type="button"
                  onClick={openExtSetup}
                  className="font-semibold underline underline-offset-2"
                  style={{ color: GUEST_BRAND.blue }}
                >
                  Connect
                </button>
              </>
            )
          ) : (
            'browser extension'
          )}
          . Practice and mock progress are pulled from your 10Tracker activity when this page
          loads.
        </p>
      </div>

      {continueResource && continueHref && !path.locked ? (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/90 bg-white/92 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: easeOut, delay: 0.15 }}
        >
          <div className={`mx-auto max-w-3xl ${APP_GUTTER} py-3.5 flex items-center gap-3`}>
            <div className="min-w-0 flex-1">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: GUEST_BRAND.blue }}
              >
                Continue
              </p>
              <p className="mt-0.5 text-sm font-semibold text-neutral-900 truncate">
                {continueResource.title}
              </p>
            </div>
            {continueResource.type === 'VIDEO' || isJudgeType(continueResource.type) ? (
              <a
                href={continueHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shrink-0"
                style={{
                  backgroundColor: GUEST_BRAND.blue,
                  boxShadow: `0 12px 24px -12px ${GUEST_BRAND.blue}aa`,
                }}
                onClick={
                  continueResource.type === 'VIDEO' && extNeedsSetup
                    ? onWatchVideoClick
                    : undefined
                }
              >
                {ctaLabel(continueResource.type, continueResource.progress?.status)}
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <Link
                href={continueHref}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shrink-0"
                style={{
                  backgroundColor: GUEST_BRAND.blue,
                  boxShadow: `0 12px 24px -12px ${GUEST_BRAND.blue}aa`,
                }}
              >
                {ctaLabel(continueResource.type, continueResource.progress?.status)}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </motion.div>
      ) : null}

      {showCheckout ? (
        <OgPremiumCheckout
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            load({ silent: true });
          }}
        />
      ) : null}

      <ExtensionSetupModal
        open={showExtSetup}
        onClose={closeExtSetup}
        installed={extInstalled}
        connected={extConnected}
        mode={extMode}
        pathTitle={path.title}
        onConnected={() => {
          clearDismiss();
          void refreshExt();
        }}
      />
    </div>
  );
}
