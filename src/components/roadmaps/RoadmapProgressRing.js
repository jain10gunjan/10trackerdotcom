'use client';

const R = 44;
const STROKE = 8;
const C = 2 * Math.PI * R;

export default function RoadmapProgressRing({ percent = 0, size = 120, label = 'complete' }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = (clamped / 100) * C;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="-rotate-90"
        aria-hidden
      >
        <circle cx="50" cy="50" r={R} fill="none" stroke="#f5f5f5" strokeWidth={STROKE} />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="#10b981"
          strokeWidth={STROKE}
          strokeDasharray={`${dash} ${C}`}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-neutral-900 tabular-nums leading-none">
          {clamped}%
        </span>
        {label ? (
          <span className="text-[9px] text-neutral-400 mt-0.5 uppercase tracking-wide">{label}</span>
        ) : null}
      </div>
    </div>
  );
}
