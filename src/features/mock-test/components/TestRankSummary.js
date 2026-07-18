'use client';

import { useState, useEffect } from 'react';
import { Trophy, Users, Loader2, User } from 'lucide-react';

/** Per-test leaderboard on the results page (same test only). */
export default function TestRankSummary({ examcategory, testId, user, testName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testId) return;
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/mock-test/leaderboard?examCategory=${encodeURIComponent(examcategory)}&scope=test&testId=${testId}&period=all&limit=10`,
      { credentials: 'include' }
    )
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.success) setData(json);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [examcategory, testId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const hasRows = (data?.entries?.length ?? 0) > 0;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden h-full flex flex-col">
      <div className="p-4 sm:p-5 border-b border-neutral-100">
        <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Leaderboard · {testName || 'This test'}
        </h3>
        <p className="text-xs text-neutral-500 mt-1">Best score per student for this test only.</p>
      </div>

      {!hasRows && !data?.yourRank ? (
        <p className="p-6 text-sm text-neutral-500 text-center flex-1">
          No other completed attempts yet. You are first on this board.
        </p>
      ) : (
        <>
          {user && data?.yourRank && (
            <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between text-sm">
              <span>Your rank</span>
              <span className="font-bold tabular-nums">
                #{data.yourRank.rank} · {data.yourRank.score}%
              </span>
            </div>
          )}
          {!user && (
            <p className="px-4 py-3 text-sm text-neutral-600 bg-neutral-50 border-b border-neutral-100">
              Sign in to see your rank.
            </p>
          )}
          <ul className="divide-y divide-neutral-100 flex-1">
            {(data?.entries || []).slice(0, 8).map((row) => (
              <li
                key={row.userEmail}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm ${
                  user && data.yourRank?.userEmail === row.userEmail ? 'bg-amber-50' : ''
                }`}
              >
                <span className="font-bold text-neutral-400 w-6 tabular-nums text-center">#{row.rank}</span>
                {row.avatarUrl ? (
                  <img src={row.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-neutral-500" />
                  </div>
                )}
                <span className="flex-1 truncate text-neutral-800">{row.displayName}</span>
                <span className="font-semibold text-neutral-900 tabular-nums">{row.score}%</span>
              </li>
            ))}
          </ul>
          {data?.totalParticipants > 0 && (
            <p className="text-[10px] text-neutral-500 text-center py-2 border-t border-neutral-100 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              {data.totalParticipants} students
            </p>
          )}
        </>
      )}
    </div>
  );
}
