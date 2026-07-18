'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

function StripSkeleton() {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 animate-pulse" aria-hidden>
      <div className="h-4 w-36 bg-neutral-100 rounded mb-3" />
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-40 bg-neutral-100 rounded-xl shrink-0" />
        ))}
      </div>
    </div>
  );
}

export default function ExamHubProgressStrip({ subjects = [], categorySlug, loading, show }) {
  if (!show) return null;
  if (loading) return <StripSkeleton />;
  if (!subjects.length) return null;

  return (
    <section className="mb-6 sm:mb-8" aria-label="Subject progress">
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-neutral-100 bg-neutral-50/50">
          <h2 className="text-sm font-semibold text-neutral-900">Your subject progress</h2>
        </div>
        <div className="overflow-x-auto">
          <ul className="flex gap-3 p-4 min-w-max sm:min-w-0 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {subjects.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/${categorySlug}/${s.slug}`}
                  className="block w-44 sm:w-auto rounded-2xl border border-neutral-200 bg-white p-3 hover:border-emerald-200 hover:shadow-sm transition-all"
                >
                  <p className="text-sm font-semibold text-neutral-900 truncate">{s.name}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                    <span className="tabular-nums">{s.percent}%</span>
                    <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
