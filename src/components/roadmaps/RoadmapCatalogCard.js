'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Calendar, Gift, Map } from 'lucide-react';

export default function RoadmapCatalogCard({ roadmap, owned = false, progressPercent = null }) {
  const href = `/roadmaps/${roadmap.slug}`;

  return (
    <article className="group rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-200 h-full flex flex-col">
      <div className="flex items-start gap-4 flex-1">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 border border-emerald-100 flex items-center justify-center shrink-0">
          <Map className="w-6 h-6 text-emerald-700" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 leading-snug group-hover:text-emerald-900 transition-colors">
              {roadmap.title}
            </h3>
            {owned ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full shrink-0">
                <BadgeCheck className="w-3 h-3" />
                Owned
              </span>
            ) : roadmap.examLabel ? (
              <span className="hidden sm:inline-flex text-[10px] font-semibold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-1 rounded-full shrink-0">
                {roadmap.examLabel}
              </span>
            ) : null}
          </div>

          {roadmap.description ? (
            <p className="text-xs sm:text-sm text-neutral-500 line-clamp-2 mt-1.5 leading-relaxed">
              {roadmap.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 font-medium">
              ₹{roadmap.priceInr} · one-time
            </span>
            {roadmap.totalDays > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-50 text-neutral-600 border border-neutral-200">
                <Calendar className="w-3 h-3" />
                {roadmap.totalDays} days
              </span>
            ) : null}
            {roadmap.freePreviewDays > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium">
                <Gift className="w-3 h-3" />
                {roadmap.freePreviewDays} free preview day{roadmap.freePreviewDays === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>

          {owned && progressPercent != null ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                <span>Your progress</span>
                <span className="font-semibold text-neutral-700 tabular-nums">{progressPercent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-neutral-100">
        <Link
          href={href}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            owned
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }`}
        >
          {owned ? 'Continue roadmap' : roadmap.freePreviewDays > 0 ? 'Preview free days' : 'View roadmap'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  );
}
