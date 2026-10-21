'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import VendorPortalShell from '@/features/vendor-tests/components/VendorPortalShell';

export default function ContestDetailClient({ slug, contestId }) {
  const [loading, setLoading] = useState(true);
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [active, setActive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/coding-contests/${contestId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
      setContest(data.contest);
      setProblems(data.problems || []);
      setActive(!!data.active);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, contestId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <VendorPortalShell>
      <div className="mx-auto max-w-3xl px-4">
        <Link
          href={`/practice-tests/${slug}/coding-contests`}
          className="text-sm font-medium text-teal-700"
        >
          ← Contests
        </Link>
        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : !contest ? (
          <p className="mt-6 text-sm">Not found.</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900">{contest.title}</h1>
                <p className="mt-2 text-sm text-neutral-600 whitespace-pre-wrap">
                  {contest.description || ''}
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  {active ? 'Contest is active' : 'Outside contest window / not published'}
                </p>
              </div>
              <Link
                href={`/practice-tests/${slug}/coding-contests/${contestId}/leaderboard`}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium"
              >
                Leaderboard
              </Link>
            </div>
            <h2 className="mt-8 text-sm font-semibold">Problems</h2>
            <ul className="mt-3 divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
              {problems.map((p, idx) => (
                <li key={p.id}>
                  <Link
                    href={`/practice-tests/${slug}/coding-contests/${contestId}/problems/${p.id}`}
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-50"
                  >
                    <span className="font-medium text-neutral-900">
                      {String.fromCharCode(65 + idx)}. {p.title}
                    </span>
                    <span className="text-neutral-500">{p.points} pts</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </VendorPortalShell>
  );
}
