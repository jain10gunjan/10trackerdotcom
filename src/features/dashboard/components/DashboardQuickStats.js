'use client';

import { Target, Zap, Trophy } from 'lucide-react';

export default function DashboardQuickStats({ summary, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white px-3 py-3">
            <div className="h-4 w-4 bg-neutral-200 rounded mb-2" />
            <div className="h-6 w-12 bg-neutral-200 rounded mb-1" />
            <div className="h-3 w-16 bg-neutral-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      icon: Target,
      label: 'Questions',
      value: (summary?.practiceQuestions ?? 0).toLocaleString(),
    },
    {
      icon: Zap,
      label: 'Mocks done',
      value: (summary?.mockTestsCompleted ?? 0).toLocaleString(),
    },
    {
      icon: Trophy,
      label: 'Accuracy',
      value:
        summary?.practiceQuestions > 0 ? `${summary.practiceAccuracy}%` : '—',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-3 sm:px-4 sm:py-3.5"
        >
          <stat.icon className="w-4 h-4 text-neutral-400 mb-1.5" />
          <p className="text-lg sm:text-xl font-bold tabular-nums text-neutral-900 leading-none">
            {stat.value}
          </p>
          <p className="text-[10px] sm:text-xs text-neutral-500 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
