'use client';

import { BookOpen, Target, Zap } from 'lucide-react';
import { getHubAggregateStats } from '@/lib/examHub/examHubUtils';

export default function ExamHubQuickStats({ subjects = [], overallPercent = null }) {
  const { subjects: s, topics, questions } = getHubAggregateStats(subjects);

  const stats = [
    { label: 'Subjects', value: s, icon: BookOpen },
    { label: 'Topics', value: topics, icon: Target },
    { label: 'Questions', value: questions, icon: Zap },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl sm:rounded-2xl border border-neutral-200/80 bg-white p-2.5 sm:p-3.5 min-w-0"
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-neutral-900 tabular-nums truncate">
                  {value.toLocaleString()}
                </p>
                <p className="text-[10px] sm:text-xs font-medium text-neutral-500 mt-0.5 truncate">
                  {label}
                </p>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {overallPercent != null && overallPercent > 0 ? (
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-3.5 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between text-xs text-emerald-900 mb-1.5">
            <span className="font-semibold">Your overall progress</span>
            <span className="font-bold tabular-nums">{overallPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-emerald-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
