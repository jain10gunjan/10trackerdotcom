'use client';

import { Flame, Target, Trophy, Zap } from 'lucide-react';

function greetingForHour() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function streakMessage(streak) {
  const current = streak?.currentStreak ?? 0;
  if (current >= 14) return 'You are on fire — keep the momentum going.';
  if (current >= 7) return 'A full week strong. One more session today?';
  if (current >= 3) return 'Nice rhythm. Practice today to extend your streak.';
  if (current >= 1) return 'Streak started — come back tomorrow to grow it.';
  return 'Practice or take a mock today to start your streak.';
}

export default function DashboardHero({
  displayName,
  streak,
  summary,
  loading = false,
}) {
  const firstName = String(displayName || 'there').split(/\s+/)[0];

  if (loading) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-16 w-56 h-56 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="relative p-6 sm:p-8 animate-pulse">
          <div className="h-4 w-28 bg-neutral-200 rounded mb-3" />
          <div className="h-9 w-64 max-w-full bg-neutral-200 rounded mb-2" />
          <div className="h-4 w-80 max-w-full bg-neutral-200 rounded" />
        </div>
      </section>
    );
  }

  const currentStreak = streak?.currentStreak ?? 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-16 w-56 h-56 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-neutral-50/80 pointer-events-none" />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-700">{greetingForHour()}</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 text-sm text-neutral-600 max-w-xl">{streakMessage(streak)}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 px-4 py-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-orange-100 flex items-center justify-center shadow-sm">
                <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-500' : 'text-neutral-300'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-neutral-900 leading-none">
                  {currentStreak}
                </p>
                <p className="text-[11px] font-medium text-neutral-500 mt-0.5">day streak</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            {
              icon: Target,
              label: 'Questions',
              value: (summary?.practiceQuestions ?? 0).toLocaleString(),
              accent: 'text-emerald-600',
              bg: 'bg-emerald-50 border-emerald-100',
            },
            {
              icon: Zap,
              label: 'Mocks done',
              value: (summary?.mockTestsCompleted ?? 0).toLocaleString(),
              accent: 'text-indigo-600',
              bg: 'bg-indigo-50 border-indigo-100',
            },
            {
              icon: Trophy,
              label: 'Accuracy',
              value:
                summary?.practiceQuestions > 0 ? `${summary.practiceAccuracy}%` : '—',
              accent: 'text-amber-600',
              bg: 'bg-amber-50 border-amber-100',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5 ${stat.bg}`}
            >
              <stat.icon className={`w-4 h-4 ${stat.accent} mb-1.5`} />
              <p className="text-lg sm:text-xl font-bold tabular-nums text-neutral-900 leading-none">
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-xs text-neutral-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
