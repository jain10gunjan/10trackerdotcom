'use client';

import { memo } from 'react';
import { DIFFICULTIES } from '@/features/practice/lib/chapterPracticeUtils';

const STYLES = {
  easy: {
    dot: 'bg-emerald-500',
    active: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
    idle: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  },
  medium: {
    dot: 'bg-amber-500',
    active: 'bg-amber-600 text-white border-amber-600 shadow-sm',
    idle: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
  },
  hard: {
    dot: 'bg-rose-500',
    active: 'bg-rose-600 text-white border-rose-600 shadow-sm',
    idle: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100',
  },
};

function DifficultyTabs({ active, counts, loading, onChange, compact = false }) {
  return (
    <div
      className={`flex gap-2 ${compact ? 'overflow-x-auto pb-0.5 scrollbar-none' : 'flex-col'}`}
      role="tablist"
      aria-label="Difficulty"
    >
      {DIFFICULTIES.map((d) => {
        const isActive = active === d;
        const s = STYLES[d];
        return (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={loading}
            onClick={() => onChange(d)}
            className={`
              inline-flex items-center justify-between gap-2 rounded-xl border font-semibold transition-all
              ${compact ? 'shrink-0 px-3 py-2 text-xs' : 'w-full px-3.5 py-2.5 text-sm'}
              ${isActive ? s.active : s.idle}
              disabled:opacity-60
            `}
          >
            <span className="flex items-center gap-2 capitalize">
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white/80' : s.dot}`} />
              {d}
            </span>
            <span
              className={`tabular-nums text-xs font-bold px-1.5 py-0.5 rounded-md ${
                isActive ? 'bg-white/20' : 'bg-black/5'
              }`}
            >
              {counts[d] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default memo(DifficultyTabs);
