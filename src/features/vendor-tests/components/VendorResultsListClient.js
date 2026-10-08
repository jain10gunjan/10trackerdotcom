'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2, ArrowRight } from 'lucide-react';
import VendorAdminNav from './VendorAdminNav';
import VendorPortalShell from './VendorPortalShell';
import VendorPageHeader, {
  VendorCard,
  VendorPrimaryButton,
} from './VendorUi';

export default function VendorResultsListClient({ slug }) {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/results`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setTests(data.tests || []);
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <VendorAdminNav slug={slug} active="admin/results" />
        <VendorPageHeader
          title="Results"
          description="Per-test analytics mapped by enrollment / roll number."
          eyebrow="Admin"
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
          </div>
        ) : tests.length === 0 ? (
          <VendorCard className="p-8 text-center text-sm text-neutral-500">
            No tests yet.
          </VendorCard>
        ) : (
          <ul className="space-y-3">
            {tests.map((t) => (
              <li key={t.id}>
                <VendorCard className="flex flex-wrap items-center justify-between gap-3 p-5 transition hover:border-teal-300 hover:shadow-md hover:shadow-teal-100/40">
                  <div>
                    <h2 className="font-semibold tracking-tight text-neutral-900">{t.title}</h2>
                    <p className="mt-1 text-xs text-neutral-500">
                      {t.status} · {t.attemptCounts?.submitted || 0} submitted ·{' '}
                      {t.attemptCounts?.in_progress || 0} in progress
                      {t.attemptCounts?.frozen
                        ? ` · ${t.attemptCounts.frozen} frozen`
                        : ''}
                    </p>
                  </div>
                  <VendorPrimaryButton
                    as={Link}
                    href={`/practice-tests/${slug}/admin/results/${t.id}`}
                    className="!py-2"
                  >
                    View analytics
                    <ArrowRight className="h-4 w-4" />
                  </VendorPrimaryButton>
                </VendorCard>
              </li>
            ))}
          </ul>
        )}
      </div>
    </VendorPortalShell>
  );
}
