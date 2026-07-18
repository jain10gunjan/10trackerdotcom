'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Loader2, User, Info } from 'lucide-react';
import { LEADERBOARD_PERIODS } from '@/features/mock-test/lib/mockTestLeaderboard';
import { parseJsonResponse } from '@/lib/toastAsync';
import Link from 'next/link';

function RankBadge({ rank }) {
  if (rank === 1) return <Medal className="w-5 h-5 text-amber-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-neutral-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
  return <span className="text-sm font-bold text-neutral-500 tabular-nums w-5 text-center">{rank}</span>;
}

/** Overall category leaderboard only (per-test boards live under each test card). */
export default function LeaderboardPanel({ examcategory, user }) {
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        examCategory: examcategory,
        scope: 'overall',
        period,
        limit: '50',
      });
      const res = await fetch(`/api/mock-test/leaderboard?${params}`, { credentials: 'include' });
      const json = await parseJsonResponse(res);
      if (json.success) setData(json);
      else setData(null);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [examcategory, period]);

  useEffect(() => {
    load();
  }, [load]);

  const meta = data?.meta;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Overall leaderboard
        </h3>
        <p className="text-sm text-neutral-600 mt-1">
          Ranked by average of your <strong className="font-medium text-neutral-800">best score %</strong> on
          each mock test you have completed in this category.
        </p>
        <p className="text-xs text-neutral-500 mt-2 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          Per-test rankings are on each test under Mock Tests → expand &quot;Test leaderboard&quot;.
        </p>
      </div>

      <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-wrap gap-1.5">
        {Object.entries(LEADERBOARD_PERIODS).map(([key, { label }]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              period === key ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {user && data?.yourRank && (
        <div className="mx-4 sm:mx-5 mt-4 p-4 rounded-xl bg-neutral-900 text-white flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wide">Your overall rank</p>
            <p className="text-2xl font-bold tabular-nums">
              #{data.yourRank.rank}
              {data.yourRank.outsideTop ? (
                <span className="text-sm font-normal text-neutral-400 ml-1">(outside top 50)</span>
              ) : null}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">{data.yourRank.score}%</p>
            <p className="text-xs text-neutral-400">{data.yourRank.testsCompleted} tests averaged</p>
          </div>
        </div>
      )}

      {!user && (
        <div className="mx-4 sm:mx-5 mt-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-neutral-600">
          <Link
            href={`/sign-in?redirect=${encodeURIComponent(`/mock-test/${examcategory}?tab=leaderboard`)}`}
            className="font-medium text-neutral-900 underline"
          >
            Sign in
          </Link>{' '}
          to see your overall rank.
        </div>
      )}

      <div className="px-4 sm:px-5 py-5">
        {loading ? (
          <div className="flex justify-center py-12 text-neutral-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !data?.entries?.length ? (
          <div className="text-center py-10 px-4">
            <p className="text-neutral-600 text-sm mb-2">No overall rankings yet for this period.</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Complete at least one mock test (with a submitted score) to appear here.
              {meta?.testsInCategory != null && (
                <>
                  {' '}
                  {meta.testsInCategory} active test{meta.testsInCategory === 1 ? '' : 's'} in this category
                  {meta.periodAttempts != null && meta.periodAttempts > 0
                    ? ` · ${meta.periodAttempts} completed attempt(s) found`
                    : ''}
                  .
                </>
              )}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {data.entries.map((row) => (
              <li
                key={`${row.userEmail}-${row.rank}`}
                className={`flex items-center gap-3 py-3 ${
                  user && data.yourRank?.userEmail === row.userEmail
                    ? 'bg-amber-50/50 -mx-2 px-2 rounded-lg'
                    : ''
                }`}
              >
                <RankBadge rank={row.rank} />
                {row.avatarUrl ? (
                  <img
                    src={row.avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border border-neutral-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-neutral-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate">{row.displayName}</p>
                  <p className="text-xs text-neutral-500">
                    Avg of best on {row.testsCompleted} test{row.testsCompleted === 1 ? '' : 's'}
                  </p>
                </div>
                <p className="text-lg font-bold text-neutral-900 tabular-nums">{row.score}%</p>
              </li>
            ))}
          </ul>
        )}
        {data?.totalParticipants > 0 && (
          <p className="text-xs text-neutral-500 text-center mt-4">
            {data.totalParticipants} ranked student{data.totalParticipants === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  );
}
