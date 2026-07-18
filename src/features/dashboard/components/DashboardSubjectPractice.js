'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { formatExamSlug, practiceHrefForSlug } from '@/lib/platformExams';
import { practiceAreaMatchesSlug } from '@/lib/examProfile';

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

  return (
    <li className={!isLast ? 'border-b border-neutral-100' : ''}>
      <Link
        href={`/${examArea}/practice/${topic.topic}`}
        className="grid grid-cols-[minmax(0,1fr)_64px_56px_20px] sm:grid-cols-[minmax(0,1fr)_80px_72px_20px] gap-3 sm:gap-4 items-center px-5 py-3.5 hover:bg-neutral-50/80 transition-colors group"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-neutral-700">
            {formatTopicLabel(topic.topic)}
          </p>
          <div className="mt-1.5 h-1 rounded-full bg-neutral-100 overflow-hidden sm:hidden">
            <div
              className="h-full rounded-full bg-emerald-500/80"
              style={{ width: `${Math.min(100, accuracy)}%` }}
            />
          </div>
        </div>
        <span className="text-sm tabular-nums text-neutral-600 text-right">{completed}</span>
        <span
          className={`text-sm font-medium tabular-nums text-right ${
            accuracy >= 70 ? 'text-emerald-700' : accuracy >= 50 ? 'text-amber-700' : 'text-neutral-600'
          }`}
        >
          {completed > 0 ? `${accuracy}%` : '—'}
        </span>
        <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 justify-self-end" />
      </Link>
    </li>
  );
}

export default function DashboardSubjectPractice({
  practice = [],
  primaryExam,
  loading = false,
}) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden animate-pulse">
        <div className="px-5 py-4 border-b border-neutral-100">
          <div className="h-4 w-32 bg-neutral-200 rounded" />
        </div>
        <div className="divide-y divide-neutral-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-5 py-3.5">
              <div className="h-4 w-48 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const exams = (practice || []).filter((e) => e.topics?.length > 0);
  const primaryArea = primaryExam?.slug;
  const sortedExams = primaryArea
    ? [
        ...exams.filter((e) => practiceAreaMatchesSlug(e.area, primaryArea)),
        ...exams.filter((e) => !practiceAreaMatchesSlug(e.area, primaryArea)),
      ]
    : exams;

  const displayExam = sortedExams[0];
  const topics = displayExam
    ? [...(displayExam.topics || [])]
        .sort((a, b) => b.completedQuestions - a.completedQuestions)
        .slice(0, 6)
    : [];

  if (!displayExam || !topics.length) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">Subject practice</h2>
        </div>
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-neutral-500">
            {primaryExam?.slug
              ? `No topic practice yet for ${primaryExam.name}.`
              : 'No topic practice yet. Pick an exam and start practicing.'}
          </p>
          {primaryExam?.slug ? (
            <Link
              href={practiceHrefForSlug(primaryExam.slug)}
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-neutral-900 hover:underline"
            >
              Go to {primaryExam.name}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-neutral-900">Subject practice</h2>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">
            {formatExamSlug(displayExam.area)} · {displayExam.totalCompleted.toLocaleString()} questions
            · {displayExam.overallAccuracy}% accuracy
          </p>
        </div>
        <Link
          href={practiceHrefForSlug(displayExam.area)}
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 shrink-0"
        >
          All topics
        </Link>
      </div>

      <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_80px_72px_20px] gap-4 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-100">
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

      {sortedExams.length > 1 ? (
        <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/50">
          <p className="text-xs text-neutral-500">
            Also practicing{' '}
            {sortedExams
              .slice(1, 3)
              .map((e) => formatExamSlug(e.area))
              .join(', ')}
            {sortedExams.length > 3 ? ` +${sortedExams.length - 3} more` : ''}
          </p>
        </div>
      ) : null}
    </section>
  );
}
