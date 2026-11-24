'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { formatExamSlug, practiceHrefForSlug } from '@/lib/platformExams';
import { practiceAreaMatchesSlug } from '@/lib/examProfile';
import HomeBone from '@/features/dashboard/components/studentHome/HomeBone';
import { homeCard, homePrimaryBtn } from '@/features/dashboard/lib/studentHomeBrand';

function formatTopicLabel(topic) {
  return String(topic || '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function TopicRow({ examArea, topic, isLast }) {
  const accuracy = topic.accuracy ?? 0;
  const completed = topic.completedQuestions ?? 0;
  const href = topic.href || (examArea ? `/${examArea}` : '/exams');
  const width = `${Math.min(100, Math.max(0, accuracy))}%`;

  return (
    <li className={isLast ? '' : 'border-b border-black/[0.06]'}>
      <Link
        href={href}
        className="flex min-h-11 items-center gap-3 px-4 py-3 transition-colors hover:bg-[#E8EDF8]/50 sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#0a0a0a]">
            {formatTopicLabel(topic.topic)}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500 sm:hidden">
            {completed.toLocaleString()} done
            {completed > 0 ? ` · ${accuracy}%` : ''}
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#E8EDF8]">
            <div
              className="h-full rounded-full bg-[#3F5EB9]"
              style={{ width: completed > 0 ? width : '0%' }}
            />
          </div>
        </div>
        <span className="hidden w-14 shrink-0 text-right text-sm tabular-nums text-neutral-600 sm:block">
          {completed.toLocaleString()}
        </span>
        <span className="hidden w-14 shrink-0 text-right text-sm font-medium tabular-nums text-[#0a0a0a] sm:block">
          {completed > 0 ? `${accuracy}%` : '—'}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
      </Link>
    </li>
  );
}

export default function DashboardSubjectPractice({
  practice = [],
  primaryExam,
  loading = false,
  embedded = false,
}) {
  const shell = `${homeCard} overflow-hidden`;

  if (loading) {
    return (
      <section className={shell} aria-hidden>
        {!embedded ? (
          <div className="border-b border-black/[0.06] px-4 py-4 sm:px-5">
            <HomeBone className="h-4 w-32" />
          </div>
        ) : null}
        <div className="space-y-px px-4 py-3 sm:px-5">
          {[1, 2, 3, 4].map((i) => (
            <HomeBone key={i} className="h-11 w-full" />
          ))}
        </div>
      </section>
    );
  }

  const primaryArea = primaryExam?.slug;
  const exams = (practice || []).filter((e) => e.topics?.length > 0);
  // Home / embedded: only the selected exam — never mix other exams in.
  const scopedExams = primaryArea
    ? exams.filter((e) => practiceAreaMatchesSlug(e.area, primaryArea))
    : exams;

  const displayExam = scopedExams[0];
  const topics = displayExam
    ? [...(displayExam.topics || [])]
        .sort((a, b) => b.completedQuestions - a.completedQuestions)
        .slice(0, 8)
    : [];

  if (!displayExam || !topics.length) {
    return (
      <section className={homeCard}>
        <div className="px-4 py-8 text-center sm:px-5">
          <p className="text-sm text-neutral-600">
            {primaryExam?.slug
              ? `No topics practiced for ${primaryExam.name} yet.`
              : 'No topics practiced yet. Pick an exam and start.'}
          </p>
          {primaryExam?.slug ? (
            <Link
              href={practiceHrefForSlug(primaryExam.slug)}
              className={`${homePrimaryBtn} mt-4`}
            >
              Practice {primaryExam.name}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className={shell || undefined}>
      {!embedded ? (
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#0a0a0a]">Subject practice</h2>
            <p className="mt-0.5 truncate text-xs text-neutral-500">
              {formatExamSlug(displayExam.area)} · {displayExam.totalCompleted.toLocaleString()}{' '}
              questions · {displayExam.overallAccuracy}% accuracy
            </p>
          </div>
          <Link
            href={practiceHrefForSlug(displayExam.area)}
            className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-[#3F5EB9]"
          >
            All topics
          </Link>
        </div>
      ) : (
        <div className="border-b border-black/[0.06] px-4 py-3 sm:px-5">
          <p className="truncate text-xs text-neutral-500">
            {formatExamSlug(displayExam.area)} · {displayExam.totalCompleted.toLocaleString()}{' '}
            questions · {displayExam.overallAccuracy}% accuracy
          </p>
        </div>
      )}

      <div className="hidden grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_1rem] gap-3 border-b border-black/[0.06] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 sm:grid">
        <span>Topic</span>
        <span className="text-right">Done</span>
        <span className="text-right">Accuracy</span>
        <span />
      </div>

      <ul>
        {topics.map((topic, index) => (
          <TopicRow
            key={`${displayExam.area}-${topic.topic}`}
            examArea={displayExam.area}
            topic={topic}
            isLast={index === topics.length - 1}
          />
        ))}
      </ul>
    </section>
  );
}
