'use client';

import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

function ContinueSkeleton() {
  return (
    <div className="rounded-3xl border border-emerald-200/60 bg-white p-5 animate-pulse" aria-hidden>
      <div className="h-4 w-32 bg-neutral-100 rounded mb-3" />
      <div className="h-6 w-2/3 bg-neutral-100 rounded" />
    </div>
  );
}

export default function ExamHubContinueCard({ continueItem, loading, show }) {
  if (!show) return null;
  if (loading) return <ContinueSkeleton />;
  if (!continueItem) return null;

  return (
    <section className="mb-6 sm:mb-8" aria-label="Continue practicing">
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5 sm:p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-2">
          Pick up where you left off
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-neutral-900 truncate">
              {continueItem.subject}
              {continueItem.topic ? (
                <span className="text-neutral-500 font-medium"> · {continueItem.topic}</span>
              ) : null}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Continue your last practice session for this exam.
            </p>
          </div>
          <Link
            href={continueItem.href}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shrink-0"
          >
            <Play className="w-4 h-4" />
            Continue
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
