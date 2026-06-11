'use client';

import Link from 'next/link';
import { ChevronRight, Trophy, TrendingUp, Clock, CheckCircle, Brain } from 'lucide-react';

export default function MockTestStatsStrip({
  userStats,
  examTrackerStats,
  examcategory,
  onOpenProgress,
}) {
  const recent = userStats.recentAttempts?.slice(0, 3) ?? [];
  const strongest = examTrackerStats.strongestSubject;
  const weakest = examTrackerStats.weakestSubject;

  return (
    <div className="mb-5 sm:mb-6 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Completed', value: userStats.completedTests, icon: CheckCircle },
          { label: 'Best score', value: userStats.completedTests > 0 ? `${userStats.bestScore}%` : '—', icon: Trophy },
          { label: 'Accuracy', value: `${examTrackerStats.averageAccuracy}%`, icon: TrendingUp },
          { label: 'Study time', value: `${userStats.totalStudyTime}h`, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium mb-1">
              <Icon className="w-3.5 h-3.5 text-emerald-600" />
              {label}
            </div>
            <p className="text-lg sm:text-xl font-bold text-neutral-900 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {(strongest || weakest) && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 flex items-start gap-3">
          <Brain className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-900">
            {strongest ? (
              <>
                Strongest: <strong>{strongest}</strong>
              </>
            ) : null}
            {strongest && weakest ? ' · ' : null}
            {weakest ? (
              <>
                Focus on: <strong>{weakest}</strong>
              </>
            ) : null}
          </p>
        </div>
      )}

      {recent.length > 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">Recent attempts</h3>
            <button
              type="button"
              onClick={onOpenProgress}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View all
            </button>
          </div>
          <ul className="divide-y divide-neutral-100">
            {recent.map((attempt) => (
              <li key={attempt.id}>
                <Link
                  href={`/mock-test/${examcategory}/results/${attempt.id}`}
                  className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 truncate text-sm">
                      {attempt.test_name || 'Test'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {attempt.created_at
                        ? new Date(attempt.created_at).toLocaleDateString()
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="font-bold text-neutral-900 tabular-nums text-sm">
                      {Math.round(attempt.percentage ?? attempt.score ?? 0)}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
