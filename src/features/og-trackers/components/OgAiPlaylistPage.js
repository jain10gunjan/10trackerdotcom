'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GUEST_BRAND } from '@/features/guest/components/guestMotion';
import { APP_GUTTER, APP_NAV_CONTENT_OFFSET } from '@/lib/appChrome';

const OPEN = new Set(['queued', 'aligning', 'writing']);

function tokenLine(job) {
  const total = Number(job?.totalTokens) || 0;
  const prompt = Number(job?.promptTokens) || 0;
  const completion = Number(job?.completionTokens) || 0;
  if (!total) return 'Model tokens: 0';
  return `Model tokens: ${total.toLocaleString('en-IN')} (prompt ${prompt.toLocaleString('en-IN')} · completion ${completion.toLocaleString('en-IN')})`;
}

function mixLine(job) {
  if (job?.practiceCount == null && job?.mockCount == null) return null;
  const lectures = job.videoCount || job.videosTotal || 0;
  const practice = job.practiceCount || 0;
  const mocks = job.mockCount || 0;
  return `${lectures} lectures · ${practice} practice · ${mocks} mock${mocks === 1 ? '' : 's'}`;
}

function statusLabel(job) {
  const status = typeof job === 'string' ? job : job?.status;
  const code = typeof job === 'string' ? '' : job?.errorCode;
  if (code === 'quota_exceeded' || code === 'daily_quota_exceeded') return 'Limit reached';
  if (status === 'queued') return 'Reading the playlist';
  if (status === 'aligning') return 'Matching GATE chapters';
  if (status === 'writing') return 'AI is choosing practice and mocks';
  if (status === 'completed') return 'Ready';
  if (status === 'rejected') return 'Not a GATE playlist';
  if (status === 'failed') return 'Could not build';
  return status || '';
}

export default function OgAiPlaylistPage() {
  const { user, loading: authLoading } = useAuth();
  const [home, setHome] = useState(null);
  const [url, setUrl] = useState('');
  const [active, setActive] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadHome = useCallback(async () => {
    const res = await fetch('/api/og-trackers/ai', { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load');
    setHome(json);
    return json;
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    loadHome().catch((err) => {
      if (!cancelled) setError(err.message);
    });
    return () => {
      cancelled = true;
    };
  }, [user, loadHome]);

  useEffect(() => {
    if (!active?.id || !OPEN.has(active.status)) return undefined;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/og-trackers/ai/${active.id}`, { credentials: 'include' });
        const json = await res.json();
        if (cancelled) return;
        if (json.job) setActive(json.job);
        if (json.job && !OPEN.has(json.job.status)) {
          loadHome().catch(() => {});
        }
        if (!json.success && json.error) setError(json.error);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };
    poll();
    const timer = setInterval(poll, 1600);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [active?.id, active?.status, loadHome]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/og-trackers/ai', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl: url }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not start');
      setActive(json.job);
      if (json.entitlement) {
        setHome((prev) => ({ ...(prev || {}), entitlement: json.entitlement }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const entitlement = home?.entitlement;
  const jobs = home?.jobs || [];

  return (
    <div
      className="min-h-[70vh] bg-neutral-50/80 pb-16"
      style={{ paddingTop: APP_NAV_CONTENT_OFFSET }}
    >
      <div className={`mx-auto max-w-3xl ${APP_GUTTER} pt-5 sm:pt-7`}>
        <Link
          href="/og-trackers?track=user"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4" />
          User track
        </Link>

        <div className="mt-6 flex items-start gap-3">
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: GUEST_BRAND.blue }}
          >
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Build a tracker from a playlist</h1>
            <p className="mt-1 text-sm text-neutral-600 leading-relaxed">
              Paste a GATE CSE YouTube playlist. The AI maps the lectures, then picks practice and
              real mocks, and saves a private tracker under User track — not in Exam track.
            </p>
          </div>
        </div>

        {authLoading ? (
          <p className="mt-8 text-sm text-neutral-500">Loading…</p>
        ) : !user ? (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-sm text-neutral-700">
            <p>
              Sign in, then use a 3-month or 6-month subscription. That includes 5 playlist
              generations a month, and 2 a day. The 24-hour pass does not.
            </p>
            <Link
              href="/sign-in?redirect=/og-trackers/ai"
              className="mt-3 inline-flex text-sm font-semibold underline underline-offset-2"
              style={{ color: GUEST_BRAND.blue }}
            >
              Sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-6 text-xs text-neutral-500">
              {entitlement?.setupRequired
                ? 'The AI tracker tables still need to be installed.'
                : entitlement?.code === 'plan_excludes_ai'
                  ? 'The 24-hour pass does not include AI trackers. Upgrade to a 3-month or 6-month plan.'
                  : entitlement?.code === 'subscription_required'
                    ? 'An active 3-month or 6-month subscription is required to build AI trackers.'
                    : entitlement?.code === 'quota_exceeded'
                      ? 'You have used all 5 playlist generations for this month.'
                      : entitlement?.code === 'daily_quota_exceeded'
                        ? 'You can build 2 trackers a day. Try again tomorrow.'
                        : `${entitlement?.dailyUsed ?? 0} of ${entitlement?.dailyLimit ?? 2} today · ${entitlement?.used ?? 0} of ${entitlement?.limit ?? 5} this month · ${(home?.monthTokens || 0).toLocaleString('en-IN')} model tokens.`}
            </p>
            {entitlement?.entitled === false &&
            ['subscription_required', 'plan_excludes_ai'].includes(entitlement?.code) ? (
              <Link
                href="/pricing"
                className="mt-2 inline-flex text-sm font-semibold underline underline-offset-2"
                style={{ color: GUEST_BRAND.blue }}
              >
                View plans
              </Link>
            ) : null}

            <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://www.youtube.com/playlist?list=…"
                className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
              />
              <button
                type="submit"
                disabled={submitting || !url.trim() || entitlement?.setupRequired || entitlement?.entitled === false}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: GUEST_BRAND.blue }}
              >
                {submitting ? 'Starting…' : 'Build tracker'}
              </button>
            </form>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            {active ? (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-sm">
                <p className="font-medium text-neutral-900">{statusLabel(active)}</p>
                {active.videosTotal ? (
                  <p className="mt-1 tabular-nums text-neutral-500">
                    {mixLine(active) || `${active.videosDone}/${active.videosTotal} lectures`}
                  </p>
                ) : null}
                <p className="mt-1 tabular-nums text-neutral-500">{tokenLine(active)}</p>
                {active.errorMessage ? (
                  <p className="mt-1 text-neutral-600">{active.errorMessage}</p>
                ) : null}
                {active.status === 'completed' && active.pathSlug ? (
                  <Link
                    href={`/og-trackers/${active.pathSlug}`}
                    className="mt-3 inline-flex text-sm font-semibold underline underline-offset-2"
                    style={{ color: GUEST_BRAND.blue }}
                  >
                    Open tracker
                  </Link>
                ) : null}
              </div>
            ) : null}

            {jobs.length ? (
              <ul className="mt-8 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                {jobs.map((job) => (
                  <li key={job.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900">{statusLabel(job)}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {mixLine(job) || job.playlistId}
                      </p>
                      <p className="tabular-nums text-xs text-neutral-500">{tokenLine(job)}</p>
                    </div>
                    {job.pathSlug ? (
                      <Link
                        href={`/og-trackers/${job.pathSlug}`}
                        className="shrink-0 text-xs font-semibold underline underline-offset-2"
                      >
                        Open
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
