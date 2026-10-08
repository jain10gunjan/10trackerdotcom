'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { mockTestHrefForSlug, practiceHrefForSlug } from '@/lib/platformExams';

export default function ExamsFeaturedPanel({ featured = [], isSignedIn = false }) {
  if (!featured.length) return null;

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-sm overflow-hidden h-full">
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-neutral-100">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-emerald-100 bg-emerald-50">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              {isSignedIn ? 'For you' : 'Start here'}
            </p>
            <h2 className="text-sm font-bold text-neutral-900 leading-none mt-0.5">
              {isSignedIn ? 'Recommended exams' : 'Popular exams'}
            </h2>
            <p className="text-xs text-neutral-500 mt-1 leading-snug">
              {isSignedIn
                ? 'Based on your primary exam and activity'
                : 'Most practiced exams on the platform'}
            </p>
          </div>
        </div>
      </div>

      <ul className="divide-y divide-neutral-100">
        {featured.map((exam, index) => (
          <li key={exam.slug}>
            <div className="px-4 sm:px-5 py-3.5 hover:bg-neutral-50/80 transition-colors">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-[11px] font-bold tabular-nums text-emerald-800">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {index === 0 && isSignedIn ? (
                      <span className="text-emerald-700">Your exam · </span>
                    ) : null}
                    {exam.name}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
                    {(exam.count || 0).toLocaleString()} questions
                    {exam.category ? ` · ${exam.category}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    <Link
                      href={practiceHrefForSlug(exam.slug)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:text-emerald-800"
                    >
                      Practice <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      href={mockTestHrefForSlug(exam.slug)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-emerald-800"
                    >
                      Mock tests <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
