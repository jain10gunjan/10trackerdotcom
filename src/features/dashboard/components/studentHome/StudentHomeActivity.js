'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Flame } from 'lucide-react';
import ActivityHeatmap from '@/features/dashboard/components/ActivityHeatmap';
import DashboardRecentActivity from '@/features/dashboard/components/DashboardRecentActivity';
import StudentHomeSection from '@/features/dashboard/components/studentHome/StudentHomeSection';
import {
  STUDENT_BRAND,
  homeCard,
  homePrimaryBtn,
  homeQuietBtn,
} from '@/features/dashboard/lib/studentHomeBrand';

function EmptyActivityCard({ examName, practiceHref, dailyHref }) {
  const examLabel = examName || 'your exam';
  return (
    <div className="px-4 py-8 text-center sm:px-6 sm:py-10">
      <span
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: STUDENT_BRAND.soft, color: STUDENT_BRAND.blue }}
      >
        <Flame className="h-5 w-5" />
      </span>
      <p className="text-base font-bold tracking-tight text-neutral-950">No activity yet</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-neutral-600">
        Practice a topic or take a daily set for {examLabel} — clears show up here and on your
        heatmap.
      </p>
      <div className="mt-5 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
        {practiceHref ? (
          <Link href={practiceHref} className={homePrimaryBtn}>
            <BookOpen className="h-4 w-4" />
            Start practice
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
        {dailyHref ? (
          <Link href={dailyHref} className={homeQuietBtn}>
            Daily set
          </Link>
        ) : null}
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
  const practiced = summary?.practiceQuestions ?? 0;
  const streakDays = streak?.currentStreak ?? 0;
  const examLabel = examName || 'this exam';

  const hasRecent =
    (recentActivity?.practice?.length || 0) > 0 ||
    (recentActivity?.mock?.length || 0) > 0 ||
    (practice || []).some((exam) =>
      (exam.topics || []).some((t) => (t.completedQuestions || 0) > 0)
    );

  let description = `Practice and mocks for ${examLabel}.`;
  if (practiced > 0) {
    description = `${practiced.toLocaleString()} questions practiced for ${examLabel}.`;
  } else if (streakDays > 0) {
    description = `${streakDays}-day streak on ${examLabel}.`;
  } else {
    description = `Start practicing ${examLabel} — your sessions land here.`;
  }

  return (
    <StudentHomeSection
      eyebrow="Activity"
      title="Recent activity"
      description={description}
      href={practiceHref || dailyHref}
      linkLabel={practiceHref ? 'Practice' : dailyHref ? 'Daily set' : undefined}
    >
      <div className={`${homeCard} overflow-hidden`}>
        {hasHeatmap ? (
          <div className="min-w-0 overflow-x-auto border-b border-black/[0.06] p-4 sm:p-5">
            <ActivityHeatmap
              heatmap={heatmap}
              range={heatmapRange}
              onRangeChange={onHeatmapRangeChange}
            />
          </div>
        ) : null}

        {hasRecent ? (
          <DashboardRecentActivity
            recentActivity={recentActivity}
            practiceAreas={practice}
            primarySlug={examSlug}
          />
        ) : (
          <EmptyActivityCard
            examName={examName}
            practiceHref={practiceHref}
            dailyHref={dailyHref}
          />
        )}
      </div>
    </StudentHomeSection>
  );
}
