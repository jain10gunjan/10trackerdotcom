'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { mockTestHrefForSlug, practiceHrefForSlug } from '@/lib/platformExams';

export default function ExamsFeaturedPanel({ featured = [], isSignedIn = false }) {
  if (!featured.length) return null;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 bg-gradient-to-r from-emerald-50/80 to-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <p className="text-sm font-semibold text-neutral-900">
            {isSignedIn ? 'Recommended for you' : 'Popular exams'}
          </p>
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">
          {isSignedIn ? 'Based on your primary exam and activity' : 'Start with the most practiced exams'}
        </p>
      </div>

      <ul className="divide-y divide-neutral-100">
        {featured.map((exam, index) => (
          <li key={exam.slug}>
            <div className="px-5 py-4 hover:bg-neutral-50/80 transition-colors">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-sm shrink-0">
                  {exam.icon || '📚'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {index === 0 && isSignedIn ? (
                      <span className="text-emerald-700">Your exam · </span>
                    ) : null}
                    {exam.name}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {(exam.count || 0).toLocaleString()} questions · {exam.category}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={practiceHrefForSlug(exam.slug)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:text-emerald-800"
                    >
                      Practice <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={mockTestHrefForSlug(exam.slug)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-emerald-800"
                    >
                      Mock tests <ArrowRight className="w-3.5 h-3.5" />
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
