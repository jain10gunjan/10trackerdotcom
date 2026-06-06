'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Map } from 'lucide-react';
import MetaDataJobs from '@/components/Seo';
import { parseJsonResponse } from '@/lib/toastAsync';

export default function RoadmapsCatalogPage() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/roadmaps', { cache: 'no-store' });
        const data = await parseJsonResponse(res);
        if (!data.success) throw new Error(data.error || data.setupHint);
        setRoadmaps(data.roadmaps || []);
        setDisclaimer(data.disclaimer || '');
      } catch (e) {
        setError(e.message || 'Could not load roadmaps');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      <MetaDataJobs
        seoTitle="Study roadmaps"
        seoDescription="Structured day-by-day study roadmaps for exam and placement prep on 10Tracker."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-neutral-500 mb-2">
            <Map className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Roadmaps</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900">Study roadmaps</h1>
          <p className="mt-2 text-sm text-neutral-600 max-w-xl leading-relaxed">
            Structured day-by-day plans with tasks, resources, and progress tracking. One-time
            purchase — lifetime access while 10Tracker operates.
          </p>
          {disclaimer ? (
            <p className="mt-3 text-xs text-neutral-500 max-w-xl">{disclaimer}</p>
          ) : null}
        </header>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : roadmaps.length === 0 ? (
          <p className="text-neutral-500 text-sm">No roadmaps published yet. Check back soon.</p>
        ) : (
          <ul className="space-y-4">
            {roadmaps.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/roadmaps/${r.slug}`}
                  className="block rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-neutral-700">
                        {r.title}
                      </h2>
                      {r.description ? (
                        <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{r.description}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                          ₹{r.price_inr} · one-time
                        </span>
                        {r.free_preview_days > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                            {r.free_preview_days} free day{r.free_preview_days === 1 ? '' : 's'}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-400 shrink-0 mt-1 group-hover:text-neutral-700" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 text-center">
          <Link href="/pricing" className="text-sm text-neutral-500 hover:text-neutral-900">
            View unlimited practice plans →
          </Link>
        </p>
      </div>
    </div>
  );
}
