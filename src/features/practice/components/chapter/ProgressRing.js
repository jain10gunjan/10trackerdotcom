'use client';

import { memo } from 'react';

const ProgressRing = memo(({ pct = 0, size = 52, stroke = 4.5, className = '' }) => {
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-neutral-100"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="text-emerald-500 transition-[stroke-dashoffset] duration-500"
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      />
    </svg>
  );
});

ProgressRing.displayName = 'ProgressRing';
export default ProgressRing;
