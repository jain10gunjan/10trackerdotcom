'use client';

import { Flame, Trophy } from 'lucide-react';
import { ROADMAP_MILESTONES } from '@/lib/roadmaps/streakUtils';

function Badge({ earned, label, title }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border transition-colors ${
        earned
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-neutral-50 text-neutral-400 border-neutral-200'
      }`}
    >
      {earned ? <Trophy className="w-3 h-3" /> : null}
      {label}
    </span>
  );
}

export default function RoadmapStreakBadges({
  currentStreak = 0,
  bestStreak = 0,
  earnedMilestones = [],
  completedDays = 0,
}) {
  const earnedIds = new Set(earnedMilestones.map((m) => m.id));

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {currentStreak > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-800 border border-orange-100 px-2 py-0.5 text-[11px] font-semibold">
          <Flame className="w-3 h-3" />
          {currentStreak}-day streak
        </span>
      ) : null}
      {bestStreak > 1 && bestStreak !== currentStreak ? (
        <span className="text-[11px] text-neutral-500 tabular-nums">Best: {bestStreak} days</span>
      ) : null}
      {completedDays > 0 ? (
        <span className="text-[11px] text-neutral-500 tabular-nums">
          {completedDays} day{completedDays === 1 ? '' : 's'} complete
        </span>
      ) : null}
      <span className="hidden sm:inline w-px h-3 bg-neutral-200" aria-hidden />
      {ROADMAP_MILESTONES.map((m) => (
        <Badge
          key={m.id}
          earned={earnedIds.has(m.id)}
          label={m.label}
          title={
            m.type === 'days_completed'
              ? `Complete ${m.minDays} days`
              : `Reach ${m.minPercent}% overall`
          }
        />
      ))}
    </div>
  );
}
