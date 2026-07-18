'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Gift, Map } from 'lucide-react';

export default function GuestRoadmapCard({ roadmap }) {
  return (
    <Link
      href={`/roadmaps/${roadmap.slug}`}
      className="group flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 hover:border-emerald-200 hover:shadow-sm transition-all"
    >
      <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
        <Map className="w-4 h-4 text-emerald-700" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-neutral-900 truncate group-hover:text-emerald-900">
            {roadmap.title}
          </h3>
          <ArrowRight className="w-4 h-4 shrink-0 text-neutral-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
        </div>
        {roadmap.examLabel ? (
          <p className="text-[11px] text-neutral-500 mt-0.5">{roadmap.examLabel}</p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-400">
          {roadmap.totalDays > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {roadmap.totalDays} days
            </span>
          ) : null}
          <span>₹{roadmap.priceInr}</span>
          {roadmap.freePreviewDays > 0 ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <Gift className="w-3 h-3" />
              {roadmap.freePreviewDays} free
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
