'use client';

import Link from 'next/link';
import { ArrowRight, Map } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function DashboardMyRoadmaps({ roadmaps = [], loading }) {
  if (loading) {
    return (
      <div className="space-y-3" aria-hidden>
        <div className="h-14 rounded-xl bg-neutral-100 animate-pulse" />
        <div className="h-14 rounded-xl bg-neutral-100 animate-pulse" />
      </div>
    );
  }

  if (!roadmaps.length) {
    return (
      <div className="text-center py-6">
        <Map className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
        <p className="text-sm text-neutral-600 mb-3">No roadmaps purchased yet.</p>
        <Link
          href="/roadmaps"
          className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 hover:underline"
        >
          Browse roadmaps <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {roadmaps.map((r) => (
        <li key={r.slug}>
          <Link
            href={r.href}
            className="flex items-center justify-between gap-3 py-3 hover:bg-neutral-50 rounded-lg px-1 -mx-1 transition-colors group"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-neutral-700">
                {r.title}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Purchased {formatDate(r.purchasedAt)} · {r.progressPercent}% complete
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-neutral-700 inline-flex items-center gap-1">
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
