'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Layers,
  Sparkles,
} from 'lucide-react';
import { APP_GUTTER, APP_NAV_CONTENT_OFFSET } from '@/lib/appChrome';
import DashboardContinueCard from '@/features/dashboard/components/DashboardContinueCard';
import {
  STUDENT_BRAND,
  easeOut,
  useStudentMotion,
  staggerContainer,
} from '@/features/dashboard/lib/studentHomeBrand';
import { PathwayCard } from '@/features/dashboard/components/studentHome/StudentHomeCards';

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
      className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-neutral-200/80 bg-white/90 p-1 shadow-sm backdrop-blur"
      role="tablist"
      aria-label="Focus exam"
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              active
                ? 'text-white shadow-sm'
                : 'text-neutral-600 hover:bg-[#E8EDF8]/80 hover:text-neutral-900 disabled:opacity-50'
            }`}
            style={active ? { backgroundColor: STUDENT_BRAND.blue } : undefined}
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
    <div className={`max-w-7xl mx-auto ${APP_GUTTER}`}>
      <div className="animate-pulse space-y-4 max-w-xl">
        <div className="h-5 w-40 rounded-full bg-neutral-200/90" />
        <div className="h-12 w-72 max-w-full rounded-xl bg-neutral-200/90" />
        <div className="h-4 w-full max-w-md rounded bg-neutral-200/70" />
        <div className="h-28 w-full rounded-2xl bg-white/80 border border-neutral-200" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-white/80 border border-neutral-200" />
          ))}
        </div>
      </div>
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
  topicMockCount = 0,
  hasContinue = false,
  topSlot = null,
}) {
  const { animate } = useStudentMotion();

  const enter = (delay = 0) =>
    animate
      ? {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: easeOut },
        }
      : { initial: false, animate: { opacity: 1, y: 0 } };

  return (
    <section
      className="relative overflow-hidden pb-8 sm:pb-10"
      style={{ paddingTop: APP_NAV_CONTENT_OFFSET }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 85% 15%, #E8EDF8 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 10% 30%, #F0F4FF 0%, transparent 50%), linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 55%, #F5F5F5 100%)',
          }}
        />
        {animate ? (
          <>
            <motion.div
              className="absolute top-[4%] right-[12%] h-64 w-64 sm:h-80 sm:w-80 rounded-full blur-[100px] will-change-transform"
              style={{ backgroundColor: `${STUDENT_BRAND.blue}28` }}
              animate={{ x: [0, 20, 0], y: [0, 14, 0], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute top-[28%] left-[4%] h-56 w-56 rounded-full blur-[90px] bg-sky-200/35 will-change-transform"
              animate={{ x: [0, -16, 0], y: [0, 18, 0], opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
          </>
        ) : (
          <div
            className="absolute top-[8%] right-[10%] h-72 w-72 rounded-full blur-[100px] opacity-40"
            style={{ backgroundColor: STUDENT_BRAND.soft }}
          />
        )}
      </div>

      <div className={`relative max-w-7xl mx-auto ${APP_GUTTER} pt-5 sm:pt-7`}>
        {topSlot ? <div className="mb-5 sm:mb-6 space-y-3">{topSlot}</div> : null}

        {showExamSwitcher ? (
          <motion.div
            {...enter(0)}
            className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Focus exam
              </p>
              <p className="text-sm text-neutral-600 mt-0.5">
                Switch to personalize mocks, updates, and countdown.
              </p>
            </div>
            <ExamSwitcher
              exams={examsPreparing}
              activeSlug={examSlug}
              onChange={onExamChange}
              disabled={switchingExam}
            />
          </motion.div>
        ) : null}

        {loading ? (
          <HeroSkeleton />
        ) : (
          <div className={switchingExam ? 'opacity-70 transition-opacity' : ''}>
            <motion.div {...enter(0.04)}>
              <span
                className="inline-flex items-center gap-2 rounded-full border border-[#3F5EB9]/20 px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: `${STUDENT_BRAND.soft}e6`, color: '#1e2f6b' }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: STUDENT_BRAND.blue }} />
                {examName ? `Preparing for ${examName}` : '10Tracker · Your study home'}
              </span>
            </motion.div>

            <motion.h1
              {...enter(0.08)}
              className="mt-4 text-[clamp(1.85rem,5vw,2.75rem)] font-black tracking-tight text-neutral-950 leading-[1.08] max-w-3xl"
              suppressHydrationWarning
            >
              {greetingForHour()}, {firstName}
            </motion.h1>

            <motion.p
              {...enter(0.12)}
              className="mt-3 text-sm sm:text-[15px] text-neutral-600 max-w-2xl leading-relaxed"
            >
              {hasContinue
                ? 'One clear next step — continue practice or a mock, then explore what’s new for your exam.'
                : examName
                  ? `Your ${examName} home: practice, mocks, updates, and a countdown to exam day.`
                  : 'Choose an exam to practice. Your personalized home will build around it.'}
            </motion.p>

            <motion.div {...enter(0.16)} className="mt-6 sm:mt-7">
              <p
                className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: STUDENT_BRAND.blue }}
              >
                Continue
              </p>
              <DashboardContinueCard
                continueOptions={continueOptions}
                loading={false}
                emptyHref={practiceHref}
                emptyLabel={examName ? `Start ${examName} practice` : 'Browse exams'}
              />
            </motion.div>

            {!limitedMode ? (
              <motion.div
                {...enter(0.2)}
                className="mt-7 sm:mt-8"
              >
                <p
                  className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: STUDENT_BRAND.blue }}
                >
                  Start a session
                </p>
                <motion.div
                  variants={staggerContainer(true, animate)}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
                >
                  <PathwayCard
                    index={0}
                    href={practiceHref}
                    icon={BookOpen}
                    title="Practice"
                    description={
                      examName
                        ? `Chapter-wise MCQs for ${examName}.`
                        : 'Topic-wise MCQs across your exams.'
                    }
                  />
                  <PathwayCard
                    index={1}
                    href={mockHref}
                    icon={ClipboardList}
                    title="Mock tests"
                    description={
                      examName
                        ? `Timed mocks for ${examName}.`
                        : 'Full-length timed tests when you are ready.'
                    }
                  />
                  <PathwayCard
                    index={2}
                    href={topicMocksHref}
                    icon={Layers}
                    title="Topic mocks"
                    description={
                      topicMockCount > 0
                        ? `${topicMockCount} topic-wise mock${topicMockCount === 1 ? '' : 's'} ready.`
                        : examName
                          ? `Shorter topic-scoped mocks for ${examName}.`
                          : 'Shorter mocks scoped to a chapter or topic.'
                    }
                  />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div {...enter(0.2)} className="mt-6">
                <Link
                  href="/exams"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                  style={{
                    backgroundColor: STUDENT_BRAND.blue,
                    boxShadow: `0 12px 28px -12px ${STUDENT_BRAND.blue}99`,
                  }}
                >
                  Browse exams
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
