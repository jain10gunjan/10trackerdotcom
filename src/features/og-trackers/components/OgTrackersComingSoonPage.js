import Link from 'next/link';
import { ArrowRight, Clock, Map } from 'lucide-react';

/**
 * Public placeholder while OG Trackers / roadmaps are launch-later.
 * Flip SHOW_OG_TRACKERS in @/lib/siteNav to restore the live product.
 */
export default function OgTrackersComingSoonPage({
  title = 'OG Trackers',
  eyebrow = 'Study plans',
}) {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white shadow-sm p-8 sm:p-12">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50">
            <Map className="h-7 w-7 text-violet-700" aria-hidden />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            {title}
          </h1>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Coming soon
          </div>
          <p className="mt-5 text-sm sm:text-base text-neutral-600 leading-relaxed max-w-md mx-auto">
            Structured learning paths with videos and coding practice are on the way. In the
            meantime, keep preparing with topic-wise MCQs and mock tests.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/exams"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
            >
              Browse exams
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
