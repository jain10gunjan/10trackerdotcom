'use client';

const LEVEL_CLASS = [
  'bg-[#E8EDF8]',
  'bg-[#C5D0EE]',
  'bg-[#8AA0D6]',
  'bg-[#4B6BC7]',
  'bg-[#3F5EB9]',
];

export default function ActivityHeatmap({ heatmap, range, onRangeChange }) {
  const cells = heatmap?.cells || [];
  if (!cells.length) {
    return (
      <p className="text-sm text-neutral-500 py-4">
        No activity recorded yet. Practice or take a mock test to fill your heatmap.
      </p>
    );
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2">
          {[
            { id: '90d', label: '90 days' },
            { id: '12mo', label: '12 months' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onRangeChange?.(opt.id)}
              className={`inline-flex min-h-11 items-center rounded-xl px-3 text-xs font-semibold ${
                range === opt.id
                  ? 'bg-[#3F5EB9] text-white'
                  : 'bg-[#E8EDF8] text-neutral-700 hover:text-[#0a0a0a]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>Less</span>
          {LEVEL_CLASS.map((c, i) => (
            <span key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.practice} practice · ${cell.mock} mock`}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm ${LEVEL_CLASS[cell.level] || LEVEL_CLASS[0]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-500 mt-2">
Darker blue means more practice or mock activity. Empty days stay empty.
      </p>
    </div>
  );
}
