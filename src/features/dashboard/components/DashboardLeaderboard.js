'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, ArrowRight, Loader2 } from 'lucide-react';
import { formatExamSlug } from '@/lib/platformExams';
import { parseJsonResponse } from '@/lib/toastAsync';

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-amber-500 font-bold">🥇</span>;
  if (rank === 2) return <span className="text-neutral-400 font-bold">🥈</span>;
  if (rank === 3) return <span className="text-amber-700 font-bold">🥉</span>;
  return <span className="text-xs font-semibold text-neutral-500 w-5 text-center">#{rank}</span>;
}

function LeaderboardBody({ leaderboard, examSlug, loading = false }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-neutral-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading rankings…
      </div>
    );
  }

  if (!leaderboard?.entries?.length) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-neutral-500">
          No rankings yet for {formatExamSlug(examSlug)}. Complete a mock test to appear here.
        </p>
        <Link
          href={`/mock-test/${examSlug}`}
          className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-neutral-800 underline"
        >
          Take a mock test
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      {leaderboard.yourRank ? (
        <div className="mx-5 mt-4 rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-800">
            Your rank:{' '}
            <strong className="text-lg tabular-nums text-amber-800">
              #{leaderboard.yourRank.rank}
            </strong>
            {leaderboard.yourRank.outsideTop ? (
              <span className="text-neutral-500"> (outside top 10)</span>
            ) : null}
          </p>
          <p className="text-sm font-semibold tabular-nums text-neutral-700">
            {leaderboard.yourRank.score}% avg score
          </p>
        </div>
      ) : (
        <p className="mx-5 mt-4 text-sm text-neutral-500 rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3">
          You have not ranked on this exam&apos;s leaderboard yet.
        </p>
      )}

      <ol className="divide-y divide-neutral-100 mt-4">
        {leaderboard.entries.map((e) => (
          <li
            key={e.userEmail}
            className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50/80 transition-colors"
          >
            <RankBadge rank={e.rank} />
            <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0 text-xs font-semibold text-neutral-600">
              {e.avatarUrl ? (
                <Image
                  src={e.avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                String(e.displayName || '?').slice(0, 1).toUpperCase()
              )}
            </div>
            <span className="flex-1 min-w-0 text-sm font-medium text-neutral-900 truncate">
              {e.displayName}
            </span>
            <span className="text-sm font-semibold tabular-nums text-neutral-700 shrink-0">
              {e.score}%
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

export default function DashboardLeaderboard({
  leaderboards = {},
  examsPreparing = [],
  primaryExam,
  loading = false,
}) {
  const [boards, setBoards] = useState(leaderboards);
  const [loadingSlug, setLoadingSlug] = useState(null);
  const fetchedRef = useRef(new Set(Object.keys(leaderboards || {})));

  useEffect(() => {
    setBoards((prev) => ({ ...prev, ...leaderboards }));
    for (const slug of Object.keys(leaderboards || {})) {
      fetchedRef.current.add(slug);
    }
  }, [leaderboards]);

  const examTabs = useMemo(() => {
    const fromProfile = (examsPreparing || []).map((e) => ({
      slug: e.slug,
      name: e.name || formatExamSlug(e.slug),
      isPrimary: Boolean(e.isPrimary),
    }));
    if (fromProfile.length) return fromProfile;

    const slugs = Object.keys(boards || {});
    return slugs.map((slug) => ({
      slug,
      name: formatExamSlug(slug),
      isPrimary: slug === primaryExam?.slug,
    }));
  }, [examsPreparing, boards, primaryExam?.slug]);

  const defaultSlug =
    primaryExam?.slug ||
    examTabs.find((e) => e.isPrimary)?.slug ||
    examTabs[0]?.slug ||
    '';

  const [activeSlug, setActiveSlug] = useState(defaultSlug);

  useEffect(() => {
    if (!defaultSlug) return;
    if (!activeSlug || !examTabs.some((e) => e.slug === activeSlug)) {
      setActiveSlug(defaultSlug);
    }
  }, [defaultSlug, activeSlug, examTabs]);

  const loadLeaderboard = useCallback(async (slug) => {
    if (!slug || fetchedRef.current.has(slug)) return;

    fetchedRef.current.add(slug);
    setLoadingSlug(slug);

    try {
      const res = await fetch(
        `/api/user/dashboard/leaderboard?exam=${encodeURIComponent(slug)}`,
        { credentials: 'include', cache: 'no-store' }
      );
      const data = await parseJsonResponse(res);
      if (data.success && data.leaderboard) {
        setBoards((prev) => ({ ...prev, [slug]: data.leaderboard }));
      }
    } catch (e) {
      console.error('leaderboard tab', slug, e);
      fetchedRef.current.delete(slug);
    } finally {
      setLoadingSlug((current) => (current === slug ? null : current));
    }
  }, []);

  useEffect(() => {
    if (activeSlug) loadLeaderboard(activeSlug);
  }, [activeSlug, loadLeaderboard]);

  const handleTabSelect = (slug) => {
    setActiveSlug(slug);
    loadLeaderboard(slug);
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden animate-pulse">
        <div className="p-6 sm:p-8 space-y-4">
          <div className="h-6 w-48 bg-neutral-200 rounded" />
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-neutral-200 rounded-lg" />
            <div className="h-9 w-28 bg-neutral-200 rounded-lg" />
          </div>
          <div className="h-16 w-full bg-neutral-100 rounded-2xl" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-neutral-100 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!examTabs.length) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-neutral-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Leaderboard</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Add your exam(s) in profile to see per-exam mock test rankings.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const activeBoard = boards[activeSlug];
  const activeLabel =
    examTabs.find((e) => e.slug === activeSlug)?.name || formatExamSlug(activeSlug);
  const tabLoading = loadingSlug === activeSlug && !activeBoard;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-neutral-100 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-neutral-900">Leaderboard</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Mock rankings · {activeLabel}
              </p>
            </div>
          </div>
          {activeSlug ? (
            <Link
              href={`/mock-test/${activeSlug}?tab=leaderboard`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-700 hover:text-neutral-900"
            >
              View full board
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : null}
        </div>

        {examTabs.length > 1 ? (
          <div
            role="tablist"
            aria-label="Exam leaderboards"
            className="mt-4 flex flex-wrap gap-2"
          >
            {examTabs.map((exam) => {
              const active = exam.slug === activeSlug;
              const count = boards[exam.slug]?.entries?.length ?? 0;
              const isLoading = loadingSlug === exam.slug;
              return (
                <button
                  key={exam.slug}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleTabSelect(exam.slug)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium border transition-colors ${
                    active
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white/80 text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-white'
                  }`}
                >
                  {exam.name}
                  {exam.isPrimary ? (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${
                        active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Primary
                    </span>
                  ) : null}
                  <span
                    className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      active ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div role="tabpanel" key={activeSlug}>
        <LeaderboardBody
          leaderboard={activeBoard}
          examSlug={activeSlug}
          loading={tabLoading}
        />
      </div>
    </section>
  );
}
