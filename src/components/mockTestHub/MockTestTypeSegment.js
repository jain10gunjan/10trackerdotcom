'use client';

export const TEST_TYPE_SEGMENTS = [
  { id: 'all', label: 'All' },
  { id: 'full', label: 'Full mock' },
  { id: 'topic', label: 'Topic-wise' },
];

export default function MockTestTypeSegment({ value, onChange, counts }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-4">
      {TEST_TYPE_SEGMENTS.map((seg) => {
        const active = value === seg.id;
        const count = counts?.[seg.id] ?? 0;
        return (
          <button
            key={seg.id}
            type="button"
            onClick={() => onChange(seg.id)}
            className={`
              shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all
              ${active
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-neutral-700 border-neutral-200 hover:border-emerald-200'}
            `}
          >
            {seg.label}
            <span
              className={`text-xs tabular-nums px-1.5 py-0.5 rounded-md ${
                active ? 'bg-white/20' : 'bg-neutral-100'
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
