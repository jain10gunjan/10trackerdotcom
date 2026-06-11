'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Gift, Sparkles } from 'lucide-react';

export default function RoadmapsFeaturedPanel({ featured = [] }) {
  if (!featured.length) return null;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden h-full">
      <div className="px-5 py-4 border-b border-neutral-100 bg-gradient-to-r from-emerald-50/80 to-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <p className="text-sm font-semibold text-neutral-900">Featured roadmaps</p>
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">
          Curated day-by-day plans — preview free days before you buy
        </p>
      </div>

      <ul className="divide-y divide-neutral-100">
        {featured.map((roadmap, index) => (
          <li key={roadmap.slug}>
            <Link
              href={`/roadmaps/${roadmap.slug}`}
              className="block px-5 py-4 hover:bg-neutral-50/80 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-800 shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-emerald-900">
                    {roadmap.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                    {roadmap.totalDays > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {roadmap.totalDays} days
                      </span>
                    ) : null}
                    <span>₹{roadmap.priceInr} · one-time</span>
                    {roadmap.freePreviewDays > 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <Gift className="w-3 h-3" />
                        {roadmap.freePreviewDays} free
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 group-hover:text-emerald-800">
                    View roadmap <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
