'use client';

import Link from 'next/link';
import { Play, Clock } from 'lucide-react';
import { formatDurationShort } from '@/features/mock-test/lib/mockTestUtils';

export default function ResumeTestBanner({ attempt, test, examcategory }) {
  if (!attempt?.id || !test) return null;

  const href = `/mock-test/${examcategory}/attempt/${test.id}`;
  const answered = attempt.attempted_questions ?? attempt.current_question_index ?? 0;
  const total = attempt.total_questions || test.total_questions || '?';
  const elapsed = attempt.time_spent ?? attempt.duration_taken;

  return (
    <div className="mb-5 sm:mb-6 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800 mb-1">
            Resume in progress
          </p>
          <h3 className="font-semibold text-neutral-900 truncate">{test.name}</h3>
          <p className="text-sm text-neutral-600 mt-1 flex flex-wrap items-center gap-3">
            <span>
              {answered} / {total} answered
            </span>
            {elapsed != null && elapsed > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDurationShort(elapsed)} elapsed
              </span>
            )}
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shrink-0"
        >
          <Play className="w-4 h-4" />
          Continue test
        </Link>
      </div>
    </div>
  );
}
