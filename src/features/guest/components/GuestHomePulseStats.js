'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';
import { APP_GUTTER } from '@/lib/appChrome';
import {
  GUEST_BRAND,
  useGuestMotion,
  useReveal,
} from '@/features/guest/components/guestMotion';

function useCountUp(target, active, duration = 1100) {
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

function StatCell({ label, target, suffix = '', animate, show, accent = false }) {
  const counted = useCountUp(typeof target === 'number' ? target : 0, show && animate);
  const display =
    typeof target === 'number' ? `${counted.toLocaleString()}${suffix}` : target;

  return (
    <div className="relative flex flex-col items-center justify-center px-3 py-5 text-center sm:py-6">
      <p
        className="text-2xl font-black tabular-nums leading-none tracking-tight text-neutral-950 sm:text-3xl"
        style={accent ? { color: GUEST_BRAND.blue } : undefined}
      >
        {display}
      </p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

export default function GuestHomePulseStats({
  examCount = 0,
  questionCount = 0,
}) {
  const ref = useRef(null);
  const { animate } = useGuestMotion();
  const show = useReveal(ref, { animate, amount: 0.25 });

  const questionDisplay =
    questionCount >= 1000
      ? { target: Math.round(questionCount / 1000), suffix: 'k+' }
      : { target: questionCount, suffix: '' };

  const cells = [
    { label: 'Active exams', target: examCount, accent: true },
    {
      label: 'Practice questions',
      target: questionDisplay.target,
      suffix: questionDisplay.suffix,
    },
    ...(SHOW_OG_TRACKERS ? [{ label: 'Exam tracks', target: 3 }] : []),
    { label: 'Free to start', target: '₹0' },
  ];

  return (
    <section ref={ref} className="relative -mt-2 pb-10 sm:pb-12">
      <div className={`relative mx-auto max-w-7xl ${APP_GUTTER}`}>
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_20px_50px_-28px_rgba(63,94,185,0.35)]">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-70"
            style={{
              background: `radial-gradient(ellipse 70% 100% at 50% 120%, ${GUEST_BRAND.soft} 0%, transparent 70%)`,
            }}
            aria-hidden
          />
          {animate && show ? (
            <motion.div
              className="pointer-events-none absolute -bottom-8 left-1/2 h-16 w-2/3 -translate-x-1/2 rounded-full blur-2xl"
              style={{ backgroundColor: `${GUEST_BRAND.blue}33` }}
              animate={{ opacity: [0.35, 0.55, 0.35], scaleX: [0.92, 1.05, 0.92] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            />
          ) : null}

          <div
            className={`relative grid divide-neutral-100 ${
              cells.length === 4
                ? 'grid-cols-2 divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0'
                : 'grid-cols-3 divide-x'
            }`}
          >
            {cells.map((cell) => (
              <StatCell
                key={cell.label}
                label={cell.label}
                target={cell.target}
                suffix={cell.suffix}
                accent={cell.accent}
                animate={animate}
                show={show || !animate}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
