'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { APP_GUTTER } from '@/lib/appChrome';
import {
  STUDENT_BRAND,
  useStudentMotion,
  useReveal,
  staggerContainer,
  staggerItem,
} from '@/features/dashboard/lib/studentHomeBrand';

function useCountUp(target, active, duration = 1000) {
  const [value, setValue] = useState(0);
  const numeric = typeof target === 'number' ? target : null;

  useEffect(() => {
    if (!active || numeric == null) {
      if (numeric != null) setValue(numeric);
      return undefined;
    }
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

  return numeric == null ? target : value;
}

function StatCell({ label, target, animate, show, index }) {
  const counted = useCountUp(typeof target === 'number' ? target : 0, show && animate);
  const display =
    typeof target === 'number' ? counted.toLocaleString() : String(target ?? '—');

  return (
    <motion.div
      custom={index}
      variants={staggerItem}
      className="relative flex flex-col items-center justify-center px-3 py-5 sm:py-6 text-center"
    >
      <p
        className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-neutral-950 leading-none"
        style={{ color: index === 0 ? STUDENT_BRAND.blue : undefined }}
      >
        {display}
      </p>
      <p className="mt-2 text-[11px] sm:text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
    </motion.div>
  );
}

export default function StudentHomePulse({
  streak = 0,
  questions = 0,
  mocks = 0,
  topics = 0,
  loading = false,
}) {
  const ref = useRef(null);
  const { animate } = useStudentMotion();
  const show = useReveal(ref, { animate, amount: 0.35 });

  if (loading) {
    return (
      <section className="relative pb-8 sm:pb-10 -mt-1">
        <div className={`relative max-w-7xl mx-auto ${APP_GUTTER}`}>
          <div className="h-[5.5rem] rounded-2xl border border-neutral-200 bg-white animate-pulse" />
        </div>
      </section>
    );
  }

  const stats = [
    { label: 'Day streak', target: streak },
    { label: 'Questions', target: questions },
    { label: 'Mocks', target: mocks },
    { label: 'Topics', target: topics },
  ];

  return (
    <section ref={ref} className="relative pb-8 sm:pb-10 -mt-1">
      <div className={`relative max-w-7xl mx-auto ${APP_GUTTER}`}>
        <motion.div
          variants={staggerContainer(show, animate)}
          initial="hidden"
          animate={show || !animate ? 'show' : 'hidden'}
          className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white/90 backdrop-blur-sm shadow-[0_20px_50px_-28px_rgba(63,94,185,0.35)]"
        >
          <div
            className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none opacity-70"
            style={{
              background: `radial-gradient(ellipse 70% 100% at 50% 120%, ${STUDENT_BRAND.soft} 0%, transparent 70%)`,
            }}
            aria-hidden
          />
          <div className="relative grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-neutral-100">
            {stats.map((s, i) => (
              <StatCell
                key={s.label}
                label={s.label}
                target={s.target}
                animate={animate}
                show={show}
                index={i}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
