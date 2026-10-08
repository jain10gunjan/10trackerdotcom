'use client';

import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import ExamHubContinueCard from '@/features/exam-hub/components/ExamHubContinueCard';

function ContinueSkeleton() {
  return (
    <div className="space-y-4">
      <ExamHubContinueCard loading show variant="practice" />
    </div>
  );
}

function EmptyContinue({ href, label }) {
  return (
    <section aria-label="Get started">
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5 sm:p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-emerald-800">
          Ready when you are
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-neutral-900">
              No session in progress
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Start practicing and we&apos;ll save your place for next time.
            </p>
          </div>
          <Link
            href={href || '/exams'}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shrink-0"
          >
            <Play className="w-4 h-4" />
            {label || 'Browse exams'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function DashboardContinueCard({
  continueOptions,
  loading = false,
  primaryExam,
  emptyHref,
  emptyLabel,
}) {
  if (loading) {
    return <ContinueSkeleton />;
  }

  const { practice, mock, fallback } = continueOptions || {};
  const hasPractice = Boolean(practice?.href);
  const hasMock = Boolean(mock?.href);
  const hasFallback = Boolean(fallback?.href) && !hasPractice && !hasMock;

  if (!hasPractice && !hasMock && !hasFallback) {
    return (
      <EmptyContinue
        href={emptyHref}
        label={
          emptyLabel ||
          (primaryExam?.name ? `Start ${primaryExam.name} practice` : 'Browse exams')
        }
      />
    );
  }

  return (
    <div className="space-y-4" aria-label="Continue learning">
      {hasPractice ? (
        <ExamHubContinueCard
          continueItem={practice}
          show
          variant="practice"
          eyebrow="Pick up where you left off"
          description={practice.description}
        />
      ) : null}

      {hasMock ? (
        <ExamHubContinueCard
          continueItem={mock}
          show
          variant="mock"
          eyebrow="Mock test in progress"
          description={mock.description}
          ctaLabel="Resume"
        />
      ) : null}

      {hasFallback ? (
        <ExamHubContinueCard
          continueItem={fallback}
          show
          variant="default"
          eyebrow="Continue learning"
          description={fallback.description}
          ctaLabel="Get started"
        />
      ) : null}
    </div>
  );
}
