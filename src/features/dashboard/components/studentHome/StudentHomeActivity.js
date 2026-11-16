'use client';

import Link from 'next/link';
import { BookOpen, ClipboardList, Flame, ArrowRight } from 'lucide-react';
import ActivityHeatmap from '@/features/dashboard/components/ActivityHeatmap';
import DashboardRecentActivity from '@/features/dashboard/components/DashboardRecentActivity';
import StudentHomeSection from '@/features/dashboard/components/studentHome/StudentHomeSection';
import { STUDENT_BRAND } from '@/features/dashboard/lib/studentHomeBrand';

function InsightStrip({ summary, streak, examName, practiceHref, dailyHref }) {
  const practiced = summary?.practiceQuestions ?? 0;
  const accuracy = summary?.practiceAccuracy ?? 0;
  const mocksDone = summary?.mockTestsCompleted ?? 0;
  const streakDays = streak?.currentStreak ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
      <div className="lg:col-span-8 relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6">
        <div
          className="absolute -top-16 -right-10 h-40 w-40 rounded-full blur-3xl pointer-events-none opacity-60"
          style={{ backgroundColor: STUDENT_BRAND.soft }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start gap-4">
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white shrink-0"
            style={{ backgroundColor: STUDENT_BRAND.blue }}
          >
            <Flame className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: STUDENT_BRAND.blue }}
            >
              {examName || 'Your exam'}
            </p>
            <h3 className="mt-1.5 text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
              {streakDays > 0
                ? `${streakDays}-day streak`
                : practiced > 0
                  ? 'Progress on this exam'
                  : 'Start this exam today'}
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: 'Practiced', value: practiced.toLocaleString() },
                { label: 'Accuracy', value: practiced > 0 ? `${accuracy}%` : '—' },
                { label: 'Mocks', value: mocksDone.toLocaleString() },
              ].map((cell) => (
                <div
                  key={cell.label}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-2.5 text-center"
                >
                  <p className="text-lg font-black tabular-nums text-neutral-950 leading-none">
                    {cell.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cell.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-3">
        <Link
          href={practiceHref || '/exams'}
          className="group flex flex-1 items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4 transition-colors hover:border-[#3F5EB9]/35"
        >
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: STUDENT_BRAND.blue }}
          >
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-neutral-950">Practice</p>
            <p className="text-xs text-neutral-500 truncate">
              {examName ? `${examName} topics` : 'Browse exams'}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-[#3F5EB9]" />
        </Link>
        <Link
          href={dailyHref || '/exams'}
          className="group flex flex-1 items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4 transition-colors hover:border-[#3F5EB9]/35"
        >
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3F5EB9]/20"
            style={{ backgroundColor: STUDENT_BRAND.soft, color: STUDENT_BRAND.blue }}
          >
            <ClipboardList className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-neutral-950">Daily set</p>
            <p className="text-xs text-neutral-500">Short · no timer</p>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-[#3F5EB9]" />
        </Link>
      </div>
    </div>
  );
}

export default function StudentHomeActivity({
  summary,
  streak,
  examName,
  examSlug,
  practiceHref,
  dailyHref,
  practice,
  recentActivity,
  heatmap,
  heatmapRange = '12mo',
  onHeatmapRangeChange,
}) {
  const hasHeatmap = Boolean(heatmap?.cells?.some((c) => (c.count || 0) > 0));

  return (
    <div className="space-y-10 sm:space-y-12">
      <StudentHomeSection
        eyebrow="This exam"
        title={examName ? `${examName} at a glance` : 'At a glance'}
        description="Stats and shortcuts for the exam you selected."
      >
        <InsightStrip
          summary={summary}
          streak={streak}
          examName={examName}
          practiceHref={practiceHref}
          dailyHref={dailyHref}
        />
      </StudentHomeSection>

      {hasHeatmap ? (
        <StudentHomeSection
          eyebrow="Consistency"
          title="Activity"
          description={`Days you practiced ${examName || 'this exam'}.`}
        >
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5">
            <ActivityHeatmap
              heatmap={heatmap}
              range={heatmapRange}
              onRangeChange={onHeatmapRangeChange}
            />
          </div>
        </StudentHomeSection>
      ) : null}

      <StudentHomeSection
        eyebrow="History"
        title="Recent activity"
        description="Practice and mocks for this exam only."
      >
        <div className="rounded-2xl border border-neutral-200/90 bg-white overflow-hidden">
          <DashboardRecentActivity
            recentActivity={recentActivity}
            practiceAreas={practice}
            primarySlug={examSlug}
          />
        </div>
      </StudentHomeSection>
    </div>
  );
}
