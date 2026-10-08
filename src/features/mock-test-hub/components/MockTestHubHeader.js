'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, BookOpen, Target, Trophy, Flame, Sparkles } from 'lucide-react';
import { useExamHub } from '@/context/ExamHubContext';
import { getPracticeHubHref } from '@/features/mock-test/components/MockTestBreadcrumb';

export default function MockTestHubHeader({
  examcategory,
  categoryLabel,
  testsCount,
  streak = 0,
  profileDisplayName,
}) {
  const hub = useExamHub();
  const exam = hub?.exam;
  const hubHref = getPracticeHubHref(examcategory);
  const label = exam?.name || categoryLabel;

  return (
    <header className="mb-6 sm:mb-8">
      <Link
        href={hubHref}
        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800 mb-4 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to {label} practice
      </Link>

      <div className="relative overflow-hidden rounded-[1.75rem] border border-neutral-200/90 bg-white/95 shadow-[0_20px_50px_-28px_rgba(16,24,40,0.22)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),transparent_45%,rgba(139,92,246,0.05))] pointer-events-none" />
        <div className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-emerald-200/35 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-violet-200/25 blur-3xl pointer-events-none" />

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
            {exam?.image ? (
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-neutral-200 overflow-hidden shrink-0 bg-neutral-100">
                <Image src={exam.image} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl shrink-0">
                {exam?.icon || '📝'}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Mock tests
              </span>
              <h1 className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 leading-tight">
                {label}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-neutral-600 leading-relaxed max-w-2xl">
                Timed full mocks and topic-wise tests with ranks and analytics. Browse freely —
                sign in when you start.
              </p>
              {profileDisplayName ? (
                <p className="text-sm text-neutral-500 mt-2">
                  Competing as{' '}
                  <span className="font-semibold text-neutral-800">{profileDisplayName}</span>
                </p>
              ) : null}
            </div>

            {streak > 0 ? (
              <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-amber-50 border border-amber-100 shrink-0">
                <Flame className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-lg font-bold text-amber-800 tabular-nums leading-none">{streak}</p>
                  <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mt-0.5">
                    day streak
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-100/90 flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold tabular-nums text-neutral-900">{testsCount}</span> tests
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Target className="h-4 w-4 text-emerald-600" />
              Exam simulation
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-emerald-600" />
              Leaderboard &amp; analytics
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
