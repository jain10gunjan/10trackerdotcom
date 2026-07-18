'use client';

import { useState, useEffect } from 'react';
import { Trophy, ChevronDown, Loader2, User } from 'lucide-react';

function RankMedal({ rank }) {
  if (rank <= 3) {
    return (
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          rank === 1 ? 'bg-amber-100 text-amber-800' : rank === 2 ? 'bg-neutral-200 text-neutral-700' : 'bg-orange-100 text-orange-800'
        }`}
      >
        {rank}
      </span>
    );
  }
  return <span className="w-6 text-center text-xs font-semibold text-neutral-400 tabular-nums">{rank}</span>;
}

/**
 * Compact per-test leaderboard shown under a single test card.
 */
export default function TestLeaderboardInline({ examcategory, testId, testName, user, attemptCount = 0 }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !testId) return;
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
  }, [open, examcategory, testId]);

  if (!testId) return null;

  const participants = data?.totalParticipants ?? 0;
  const hasData = participants > 0 || (data?.entries?.length ?? 0) > 0;

  return (
    <div className="mt-3 pt-3 border-t border-neutral-100">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-left py-1.5 rounded-lg hover:bg-neutral-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-neutral-800">
          <Trophy className="w-4 h-4 text-amber-500" />
          Test leaderboard
          {attemptCount > 0 && !open && (
            <span className="text-xs font-normal text-neutral-500">({attemptCount} attempts)</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 rounded-xl bg-neutral-50 border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          ) : !hasData ? (
            <p className="text-xs text-neutral-500 text-center py-6 px-3">
              No completed attempts yet for {testName || 'this test'}. Be the first to finish and top the board.
            </p>
          ) : (
            <>
              {user && data?.yourRank && (
                <div className="px-3 py-2.5 bg-neutral-900 text-white flex items-center justify-between text-sm">
                  <span>Your rank</span>
                  <span className="font-bold tabular-nums">
                    #{data.yourRank.rank} · {data.yourRank.score}%
                  </span>
                </div>
              )}
              <ul className="divide-y divide-neutral-200/80">
                {(data.entries || []).slice(0, 10).map((row) => (
                  <li
                    key={row.userEmail}
                    className={`flex items-center gap-2 px-3 py-2 text-sm ${
                      user && data.yourRank?.userEmail === row.userEmail ? 'bg-amber-50/80' : 'bg-white'
                    }`}
                  >
                    <RankMedal rank={row.rank} />
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
              {participants > 0 && (
                <p className="text-[10px] text-neutral-500 text-center py-2 border-t border-neutral-200">
                  {participants} student{participants === 1 ? '' : 's'} ranked
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
