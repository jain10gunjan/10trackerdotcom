'use client';

export const TEST_TYPE_SEGMENTS = [
  { id: 'all', label: 'All' },
  { id: 'full', label: 'Full mock' },
  { id: 'topic', label: 'Topic-wise' },
];

export default function MockTestTypeSegment({ value, onChange, counts }) {
  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-neutral-200/80 bg-white p-1 shadow-sm"
      role="tablist"
      aria-label="Test type"
    >
      {TEST_TYPE_SEGMENTS.map((seg) => {
        const active = value === seg.id;
        const count = counts?.[seg.id] ?? 0;
        return (
          <button
            key={seg.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(seg.id)}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors
              ${
                active
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }
            `}
          >
            {seg.label}
            <span
              className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-md font-bold ${
                active ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
