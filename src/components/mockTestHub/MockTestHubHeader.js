'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, BookOpen, Target, Trophy, Flame } from 'lucide-react';
import { useExamHub } from '@/context/ExamHubContext';
import { getPracticeHubHref } from '@/components/mock-test/MockTestBreadcrumb';

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
    <header className="mb-5 sm:mb-7">
      <Link
        href={hubHref}
        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-700 mb-4"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to {label} practice
      </Link>

      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative p-5 sm:p-6">
          <div className="flex items-start gap-4">
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
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Mock tests</p>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight mt-0.5">
                {label}
              </h1>
              <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed max-w-xl">
                Full-length timed tests with ranks and analytics. Browse freely — sign in when you start a test.
              </p>
              {profileDisplayName ? (
                <p className="text-sm text-neutral-500 mt-2">
                  Competing as{' '}
                  <span className="font-medium text-neutral-800">{profileDisplayName}</span>
                </p>
              ) : null}
            </div>
            {streak > 0 ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-orange-50 border border-orange-100 shrink-0">
                <Flame className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-lg font-bold text-orange-700 tabular-nums leading-none">{streak}</p>
                  <p className="text-[10px] font-semibold text-orange-600 uppercase">day streak</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-neutral-100 text-xs sm:text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              {testsCount} tests
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Target className="h-4 w-4 text-emerald-600" />
              Exam simulation
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-emerald-600" />
              Leaderboard & analytics
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
