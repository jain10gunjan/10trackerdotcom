'use client';

import { useEffect, useState } from 'react';
import HomeBone from '@/features/dashboard/components/studentHome/HomeBone';
import {
  STUDENT_BRAND,
  useStudentMotion,
} from '@/features/dashboard/lib/studentHomeBrand';

function useCountUp(target, active, duration = 900) {
  const [value, setValue] = useState(() =>
    typeof target === 'number' ? target : 0
  );
  const numeric = typeof target === 'number' ? target : null;

  useEffect(() => {
    if (numeric == null) return undefined;
    if (!active) {
      setValue(numeric);
      return undefined;
    }
    setValue(0);
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(numeric * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, numeric, duration]);

  if (numeric == null) return target;
  return value;
}

function Stat({ label, value, accent = false, animate }) {
  const counted = useCountUp(typeof value === 'number' ? value : 0, animate);
  const display =
    typeof value === 'number' ? counted.toLocaleString() : String(value ?? '—');

  return (
    <div className="relative flex flex-col items-center justify-center px-3 py-5 text-center sm:py-6">
      <p
        className="text-2xl font-black tabular-nums leading-none tracking-tight text-neutral-950 sm:text-3xl"
        style={accent ? { color: STUDENT_BRAND.blue } : undefined}
      >
        {display}
      </p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

/** Personal study snapshot — always visible (no opacity-0 reveal traps). */
export default function StudentHomePulse({
  streak = 0,
  questions = 0,
  mocks = 0,
  topics = 0,
  loading = false,
}) {
  const { animate } = useStudentMotion();

  if (loading) {
    return (
      <div
        className="grid grid-cols-2 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white lg:grid-cols-4"
        aria-hidden
      >
        {[1, 2, 3, 4].map((i) => (
          <HomeBone key={i} className="m-4 h-14" />
        ))}
      </div>
    );
  }

  const cells = [
    { label: 'Day streak', value: streak, accent: true },
    { label: 'Questions done', value: questions },
    { label: 'Mocks done', value: mocks },
    { label: 'Topics touched', value: topics },
  ];

  return (
    <section aria-label="Your study snapshot" className="relative -mt-1 sm:-mt-2">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_20px_50px_-28px_rgba(63,94,185,0.35)]">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-80"
          style={{
            background: `radial-gradient(ellipse 70% 100% at 50% 120%, ${STUDENT_BRAND.soft} 0%, transparent 70%)`,
          }}
          aria-hidden
        />
        <dl className="relative grid grid-cols-2 divide-y divide-neutral-100 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {cells.map((cell) => (
            <Stat
              key={cell.label}
              label={cell.label}
              value={cell.value}
              accent={cell.accent}
              animate={animate}
            />
          ))}
        </dl>
      </div>
    </section>
  );
}
