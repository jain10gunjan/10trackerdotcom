'use client';

import { BookOpenCheck, UserRound } from 'lucide-react';
import { GUEST_BRAND } from '@/features/guest/components/guestMotion';

const TRACKS = [
  {
    id: 'exam',
    label: 'Exam track',
    hint: 'Official chapter trackers',
    Icon: BookOpenCheck,
  },
  {
    id: 'user',
    label: 'User track',
    hint: 'Your private playlists',
    Icon: UserRound,
  },
];

export default function OgTrackSwitcher({
  value = 'exam',
  onChange,
  examCount = 0,
  userCount = 0,
}) {
  return (
    <div
      className="inline-flex w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-1 shadow-sm"
      role="tablist"
      aria-label="OG tracker type"
    >
      {TRACKS.map(({ id, label, hint, Icon }) => {
        const active = value === id;
        const count = id === 'exam' ? examCount : userCount;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(id)}
            className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors sm:px-4 ${
              active ? 'text-white' : 'text-neutral-700 hover:bg-neutral-50'
            }`}
            style={active ? { backgroundColor: GUEST_BRAND.blue } : undefined}
          >
            <span
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                active ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">{label}</span>
                <span
                  className={`tabular-nums rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {count}
                </span>
              </span>
              <span
                className={`mt-0.5 block truncate text-[11px] ${
                  active ? 'text-white/80' : 'text-neutral-500'
                }`}
              >
                {hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
