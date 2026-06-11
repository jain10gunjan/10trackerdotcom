'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { formatExamSlug, practiceHrefForSlug } from '@/lib/platformExams';

function formatTopicLabel(topic) {
  return String(topic || '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function DashboardSubjectPractice({
  practice = [],
  primaryExam,
  loading = false,
}) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 animate-pulse">
        <div className="h-5 w-40 bg-neutral-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-neutral-100 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  const exams = (practice || []).filter((e) => e.topics?.length > 0);

  if (!exams.length) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-900">Subject practice</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-neutral-500 text-center py-6">
            {primaryExam?.slug
              ? `No topic practice yet for ${primaryExam.name}. Start a session to track progress here.`
              : 'No topic practice yet. Pick an exam and start practicing.'}
          </p>
          {primaryExam?.slug ? (
            <div className="text-center">
              <Link
                href={practiceHrefForSlug(primaryExam.slug)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900 underline"
              >
                Go to {primaryExam.name}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <h2 className="text-base font-semibold text-neutral-900">Subject practice</h2>
        </div>
        {primaryExam?.slug ? (
          <Link
            href={practiceHrefForSlug(primaryExam.slug)}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
          >
            All topics
          </Link>
        ) : null}
      </div>

      <div className="divide-y divide-neutral-100">
        {exams.map((exam) => {
          const topTopics = [...(exam.topics || [])]
            .sort((a, b) => b.completedQuestions - a.completedQuestions)
            .slice(0, 5);

          return (
            <div key={exam.area} className="p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {formatExamSlug(exam.area)}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {exam.totalCompleted.toLocaleString()} questions · {exam.overallAccuracy}%
                    accuracy
                  </p>
                </div>
                <Link
                  href={practiceHrefForSlug(exam.area)}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-900 shrink-0"
                >
                  Open hub
                </Link>
              </div>

              <ul className="space-y-2">
                {topTopics.map((topic) => (
                  <li key={`${exam.area}-${topic.topic}`}>
                    <Link
                      href={`/${exam.area}/practice/${topic.topic}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 px-3 py-2.5 hover:bg-emerald-50/60 hover:border-emerald-100 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-emerald-900">
                          {formatTopicLabel(topic.topic)}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {topic.completedQuestions} done · {topic.accuracy}% accuracy
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
