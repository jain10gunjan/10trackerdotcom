'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, ClipboardList, Sparkles } from 'lucide-react';
import { practiceHrefForSlug, mockTestHrefForSlug, formatExamSlug } from '@/lib/platformExams';

function pickContinueTarget({ recentActivity, mockTests, primaryExam }) {
  const inProgressMock = (mockTests?.attempts || []).find(
    (a) => !a.isCompleted && a.status === 'in_progress'
  );
  if (inProgressMock) {
    const category = String(inProgressMock.category || primaryExam?.slug || '').toLowerCase();
    return {
      type: 'mock',
      title: inProgressMock.testName || 'Mock test in progress',
      subtitle: `${formatExamSlug(category)} · Resume where you left off`,
      href: category ? `/mock-test/${category}/attempt/${inProgressMock.testId}` : mockTestHrefForSlug(primaryExam?.slug),
      cta: 'Resume mock test',
    };
  }

  const latest = recentActivity?.all?.[0];
  if (latest?.href) {
    return {
      type: latest.type,
      title: latest.title,
      subtitle: latest.subtitle || 'Pick up your last session',
      href: latest.href,
      cta: latest.type === 'mock' ? 'Continue mock test' : 'Continue practice',
    };
  }

  if (primaryExam?.slug) {
    return {
      type: 'practice',
      title: `Start practicing ${primaryExam.name}`,
      subtitle: 'Topic-wise MCQs with solutions',
      href: practiceHrefForSlug(primaryExam.slug),
      cta: 'Start practice',
    };
  }

  return {
    type: 'discover',
    title: 'Explore exams & start practicing',
    subtitle: 'Pick your exam and begin your first session',
    href: '/exams',
    cta: 'Browse exams',
  };
}

export default function DashboardContinueCard({
  recentActivity,
  mockTests,
  primaryExam,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-4 w-36 bg-neutral-200 rounded mb-4" />
        <div className="h-6 w-64 max-w-full bg-neutral-200 rounded mb-2" />
        <div className="h-4 w-48 bg-neutral-200 rounded mb-6" />
        <div className="h-11 w-40 bg-neutral-200 rounded-xl" />
      </div>
    );
  }

  const target = pickContinueTarget({ recentActivity, mockTests, primaryExam });
  const Icon =
    target.type === 'mock'
      ? ClipboardList
      : target.type === 'discover'
        ? Sparkles
        : BookOpen;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-neutral-900/10 bg-neutral-900 text-white shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-emerald-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
              Continue learning
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight truncate">
              {target.title}
            </h2>
            <p className="mt-1.5 text-sm text-neutral-300 line-clamp-2">{target.subtitle}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={target.href}
            className="inline-flex items-center gap-2 rounded-xl bg-white text-neutral-900 px-5 py-2.5 text-sm font-semibold hover:bg-neutral-100 transition-colors"
          >
            {target.cta}
            <ArrowRight className="w-4 h-4" />
          </Link>
          {primaryExam?.slug && target.type !== 'discover' ? (
            <Link
              href={mockTestHrefForSlug(primaryExam.slug)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Mock tests
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
