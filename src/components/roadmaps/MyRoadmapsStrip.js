'use client';

import Link from 'next/link';
import { ArrowRight, Map } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StripSkeleton() {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm" aria-hidden>
      <div className="h-5 w-40 rounded-lg bg-neutral-100 animate-pulse mb-4" />
      <div className="space-y-3">
        <div className="h-14 rounded-xl bg-neutral-100 animate-pulse" />
        <div className="h-14 rounded-xl bg-neutral-100 animate-pulse" />
      </div>
    </div>
  );
}

export default function MyRoadmapsStrip({ roadmaps = [], loading, show }) {
  if (!show) return null;
  if (loading) return <StripSkeleton />;
  if (!roadmaps.length) return null;

  return (
    <section className="mb-8 sm:mb-10" aria-label="Your roadmaps">
      <div className="rounded-3xl border border-emerald-200/60 bg-white shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-neutral-100 bg-gradient-to-r from-emerald-50/60 to-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-neutral-900">Your roadmaps</h2>
          </div>
          <span className="text-xs text-neutral-500">{roadmaps.length} purchased</span>
        </div>

        <ul className="divide-y divide-neutral-100">
          {roadmaps.map((r) => (
            <li key={r.slug}>
              <Link
                href={r.href}
                className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-neutral-50/80 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-emerald-900">
                    {r.title}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Purchased {formatDate(r.purchasedAt)} · {r.progressPercent}% complete
                  </p>
                  <div className="mt-2 h-1 rounded-full bg-neutral-100 max-w-xs overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, Math.max(0, r.progressPercent))}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  Continue
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
