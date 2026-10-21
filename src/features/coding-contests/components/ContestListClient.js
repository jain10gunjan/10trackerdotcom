'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import VendorPortalShell from '@/features/vendor-tests/components/VendorPortalShell';

export default function ContestListClient({ slug }) {
  const [loading, setLoading] = useState(true);
  const [contests, setContests] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/coding-contests`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
      setContests(data.contests || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <VendorPortalShell>
      <div className="mx-auto max-w-3xl px-4">
        <Link href={`/practice-tests/${slug}`} className="text-sm font-medium text-teal-700">
          ← Portal home
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-neutral-900">Coding contests</h1>
        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : contests.length === 0 ? (
          <p className="mt-6 text-sm text-neutral-500">No published contests yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
            {contests.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium text-neutral-900">{c.title}</p>
                  <p className="text-xs text-neutral-500">{c.scoring_mode}</p>
                </div>
                <Link
                  href={`/practice-tests/${slug}/coding-contests/${c.id}`}
                  className="text-sm font-semibold text-teal-700"
                >
                  Open →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </VendorPortalShell>
  );
}
