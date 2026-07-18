'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useExamHubProgress } from '@/features/exam-hub/hooks/useExamHubProgress';
import { filterSubjects, slugifySubject } from '@/features/exam-hub/lib/examHubUtils';
import { mockTestHrefForSlug } from '@/lib/platformExams';
import ExamHubContinueCard from '@/features/exam-hub/components/ExamHubContinueCard';
import ExamHubFAB from '@/features/exam-hub/components/ExamHubFAB';
import ExamHubPathCards from '@/features/exam-hub/components/ExamHubPathCards';
import ExamHubProgressStrip from '@/features/exam-hub/components/ExamHubProgressStrip';
import ExamHubQuickStats from '@/features/exam-hub/components/ExamHubQuickStats';
import ExamHubSubjectList from '@/features/exam-hub/components/ExamHubSubjectList';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Calendar,
  ClipboardCheck,
} from 'lucide-react';

function useSearchDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/90 px-3 py-1 text-xs font-medium text-emerald-800">
      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
      {children}
    </span>
  );
}

const WORKFLOW_STEPS = [
  { icon: BookOpen, text: 'Pick a subject and practice MCQs topic-wise.' },
  { icon: Calendar, text: 'Use daily practice sets for quick revision.' },
  { icon: ClipboardCheck, text: 'Take full mock tests when you are exam-ready.' },
];

export default function ExamHubPage({
  exam,
  categorySlug,
  initialSubjects = [],
  mockTestCount = 0,
  dailyPracticeCount = 0,
}) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useSearchDebounce(search);

  const {
    loading: progressLoading,
    overallPercent,
    subjects: progressSubjects,
    continue: continueItem,
  } = useExamHubProgress(categorySlug);

  const filteredSubjects = useMemo(
    () => filterSubjects(initialSubjects, debouncedSearch),
    [initialSubjects, debouncedSearch]
  );

  const quickStartHref = useMemo(() => {
    if (!filteredSubjects.length) return '#';
    return `/${categorySlug}/${slugifySubject(filteredSubjects[0]?.subject ?? '')}`;
  }, [filteredSubjects, categorySlug]);

  const isEmpty = initialSubjects.length === 0;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* pt-24 clears fixed navbar (h-20) — matches /exams catalog */}
      <section className="pt-24 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 lg:items-stretch">
            {/* Hero */}
            <div className="lg:col-span-7 flex min-w-0">
              <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm min-w-0">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-200/35 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-16 w-48 h-48 bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-emerald-50/20 pointer-events-none" />

                <div className="relative flex flex-1 flex-col p-5 sm:p-7 min-w-0">
                  <Pill>
                    {exam?.category || 'Exam'} · Practice hub
                  </Pill>

                  <div className="mt-4 flex items-center gap-3 sm:gap-4 min-w-0">
                    {exam?.image ? (
                      <div className="relative w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl border border-neutral-200 overflow-hidden shrink-0 bg-neutral-100">
                        <Image
                          src={exam.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="72px"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl sm:text-3xl shrink-0">
                        {exam?.icon || '📚'}
                      </div>
                    )}
                    <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold tracking-tight text-neutral-900 leading-tight min-w-0">
                      {exam?.name}
                    </h1>
                  </div>

                  {exam?.description ? (
                    <p className="mt-3 text-sm sm:text-[0.9375rem] text-neutral-600 leading-relaxed line-clamp-2 sm:line-clamp-none">
                      {exam.description}
                    </p>
                  ) : null}

                  <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById('practice-content')?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        })
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 shrink-0" />
                      Start practicing
                    </button>
                    {mockTestCount > 0 ? (
                      <Link
                        href={mockTestHrefForSlug(categorySlug)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
                      >
                        <ClipboardCheck className="w-4 h-4 shrink-0" />
                        Mock tests
                      </Link>
                    ) : null}
                  </div>
                  <Link
                    href="/exams"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    Browse all exams
                    <ArrowRight className="w-3 h-3" />
                  </Link>

                  <div className="mt-5 sm:mt-6 pt-5 border-t border-neutral-100">
                    <ExamHubQuickStats
                      subjects={initialSubjects}
                      overallPercent={user ? overallPercent : null}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow sidebar — matched height on desktop */}
            <div className="lg:col-span-5 flex min-w-0">
              <div className="flex flex-1 flex-col rounded-3xl border border-neutral-200 bg-gradient-to-br from-emerald-50/50 via-white to-white p-5 sm:p-6 shadow-sm min-w-0">
                <p className="text-sm font-bold text-neutral-900">How to use this hub</p>
                <p className="text-xs text-neutral-500 mt-0.5 mb-4">A simple workflow for exam prep</p>
                <ol className="space-y-3 flex-1">
                  {WORKFLOW_STEPS.map(({ icon: Icon, text }, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
                      <span className="w-7 h-7 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                        <Icon className="w-3.5 h-3.5 text-emerald-700" />
                      </span>
                      <span className="pt-1 leading-snug">{text}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 rounded-xl border border-emerald-100/80 bg-white/80 px-3.5 py-3 text-xs text-neutral-600 leading-relaxed">
                  <span className="font-semibold text-neutral-800">Tip:</span> Use search below to
                  jump to any subject or topic.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
            <ExamHubPathCards
              categorySlug={categorySlug}
              mockTestCount={mockTestCount}
              dailyPracticeCount={dailyPracticeCount}
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">
        <ExamHubContinueCard
          continueItem={continueItem}
          loading={progressLoading}
          show={Boolean(user)}
        />
        <ExamHubProgressStrip
          subjects={progressSubjects}
          categorySlug={categorySlug}
          loading={progressLoading}
          show={Boolean(user)}
        />
      </div>

      <section className="py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isEmpty ? (
            <div className="rounded-3xl border border-neutral-200 bg-white py-16 text-center px-6">
              <BookOpen className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-neutral-900">No practice content yet</h2>
              <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">
                Questions for this exam are being added. Browse other active exams in the catalog.
              </p>
              <Link
                href="/exams"
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800"
              >
                Browse exams <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <ExamHubSubjectList
              subjects={filteredSubjects}
              categorySlug={categorySlug}
              searchTerm={search}
              onSearchChange={setSearch}
              totalCount={initialSubjects.length}
            />
          )}
        </div>
      </section>

      <section className="pb-20 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-neutral-900/10 bg-neutral-900 text-white p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              {user ? (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold">Track everything on your dashboard</h2>
                  <p className="mt-2 text-neutral-300 text-sm max-w-lg mx-auto">
                    Streaks, mock rankings, and cross-exam progress live on your home page.
                  </p>
                  <Link
                    href="/"
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-100"
                  >
                    Go to dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold">Save progress across devices</h2>
                  <p className="mt-2 text-neutral-300 text-sm max-w-lg mx-auto">
                    Sign in to sync completed questions, streaks, and mock test history.
                  </p>
                  <Link
                    href={`/sign-up?redirect=${encodeURIComponent(`/${categorySlug}`)}`}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-100"
                  >
                    Get started free <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <ExamHubFAB quickStartHref={quickStartHref} />
    </div>
  );
}
