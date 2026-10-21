'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import VendorPortalShell from '@/features/vendor-tests/components/VendorPortalShell';

export default function ContestLeaderboardClient({ slug, contestId }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [contest, setContest] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/practice-tests/${slug}/coding-contests/${contestId}/leaderboard`
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
      setRows(data.leaderboard || []);
      setContest(data.contest);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, contestId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <VendorPortalShell>
      <div className="mx-auto max-w-3xl px-4">
        <Link
          href={`/practice-tests/${slug}/coding-contests/${contestId}`}
          className="text-sm font-medium text-teal-700"
        >
          ← Contest
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-neutral-900">
          Leaderboard{contest ? ` · ${contest.title}` : ''}
        </h1>
        <p className="mt-1 text-xs text-neutral-500">Updates every 5 seconds</p>

        {loading && !rows.length ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Solved</th>
                  <th className="px-3 py-2">Penalty</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-neutral-500">
                      No ranked participants yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.user_id} className="border-b border-neutral-50">
                      <td className="px-3 py-2 font-medium">{r.rank}</td>
                      <td className="px-3 py-2">{r.display_name}</td>
                      <td className="px-3 py-2">{r.solved_count}</td>
                      <td className="px-3 py-2">{r.penalty_minutes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </VendorPortalShell>
  );
}
