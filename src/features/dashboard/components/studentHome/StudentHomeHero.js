'use client';

import DashboardContinueCard from '@/features/dashboard/components/DashboardContinueCard';
import HomeBone from '@/features/dashboard/components/studentHome/HomeBone';
import { STUDENT_BRAND } from '@/features/dashboard/lib/studentHomeBrand';

function greetingForHour() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function ExamSwitcher({ exams, activeSlug, onChange, disabled }) {
  if (!exams?.length) return null;

  return (
    <div
      className="flex max-w-full flex-wrap gap-1.5"
      role="tablist"
      aria-label="Exam you are studying"
    >
      {exams.map((exam) => {
        const active = exam.slug === activeSlug;
        return (
          <button
            key={exam.slug}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled || active}
            onClick={() => onChange(exam.slug)}
            className={`min-h-10 max-w-full rounded-full px-3.5 text-left text-xs font-semibold leading-snug transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3F5EB9] sm:text-sm ${
              active
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'border border-neutral-200 bg-white text-neutral-800 hover:border-[#3F5EB9]/35 hover:bg-[#E8EDF8]/70 disabled:opacity-50'
            }`}
          >
            {exam.name}
          </button>
        );
      })}
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div
      className="space-y-3 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white/95 p-5 shadow-sm sm:p-6"
      aria-hidden
    >
      <HomeBone className="h-3 w-24" />
      <HomeBone className="h-8 w-52 max-w-full" />
      <HomeBone className="h-4 w-64 max-w-full" />
      <HomeBone className="h-36 w-full rounded-2xl" />
    </div>
  );
}

export default function StudentHomeHero({
  firstName,
  examName,
  examSlug,
  examsPreparing = [],
  showExamSwitcher = false,
  onExamChange,
  switchingExam = false,
  limitedMode = false,
  loading = false,
  continueOptions,
  practiceHref,
  mockHref,
  topicMocksHref,
  dailyHref = '/exams',
  topicMockCount = 0,
  hasContinue = false,
  streakDays = 0,
  topSlot = null,
}) {
  const studyLinks =
    !limitedMode && examSlug
      ? [
          { href: practiceHref, label: 'Practice' },
          { href: dailyHref, label: 'Daily set' },
          { href: mockHref, label: 'Mocks' },
          {
            href: topicMocksHref,
            label: topicMockCount > 0 ? `Topic mocks (${topicMockCount})` : 'Topic mocks',
          },
        ].filter((link) => link.href)
      : [];

  return (
    <header>
      {topSlot ? <div className="mb-5 space-y-3 sm:mb-6">{topSlot}</div> : null}

      {loading ? (
        <HeroSkeleton />
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white/95 shadow-[0_20px_50px_-28px_rgba(63,94,185,0.28)]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(63,94,185,0.10), transparent 45%, rgba(75,107,199,0.05))',
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full blur-3xl"
            style={{ backgroundColor: `${STUDENT_BRAND.blue}28` }}
            aria-hidden
          />

          <div className="relative space-y-5 p-5 sm:space-y-6 sm:p-6 lg:p-7">
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  borderColor: `${STUDENT_BRAND.blue}33`,
                  backgroundColor: STUDENT_BRAND.soft,
                  color: '#1e2f6b',
                }}
                suppressHydrationWarning
              >
                {greetingForHour()}, {firstName}
                {!limitedMode && streakDays > 0 ? ` · ${streakDays}-day streak` : ''}
              </span>

              {!limitedMode ? (
                <div className="mt-3">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: STUDENT_BRAND.blue }}
                  >
                    Studying
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                    {examName || 'Choose an exam'}
                    {switchingExam ? (
                      <span className="ml-2 text-sm font-medium text-neutral-500">Switching…</span>
                    ) : null}
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
                    {hasContinue
                      ? 'Pick up where you left off — practice, daily set, or a timed mock.'
                      : 'Start a topic or open a mock. Progress stays on this home.'}
                  </p>
                </div>
              ) : (
                <div className="mt-3">
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                    Finish your profile
                  </h1>
                  <p className="mt-2 max-w-xl text-sm text-neutral-600">
                    Add your exam focus so we can personalize practice and mocks.
                  </p>
                </div>
              )}

              {showExamSwitcher ? (
                <div className="mt-4">
                  <ExamSwitcher
                    exams={examsPreparing}
                    activeSlug={examSlug}
                    onChange={onExamChange}
                    disabled={switchingExam}
                  />
                </div>
              ) : null}
            </div>

            <div
              aria-busy={switchingExam || undefined}
              aria-label={hasContinue ? 'Continue your session' : 'Start a session'}
            >
              <DashboardContinueCard
                continueOptions={continueOptions}
                loading={false}
                emptyHref={practiceHref}
                emptyLabel={examName ? `Start ${examName} practice` : 'Browse exams'}
                links={studyLinks}
                emphasis={limitedMode ? 'quiet' : 'primary'}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
