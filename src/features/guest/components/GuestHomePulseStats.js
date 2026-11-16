'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';
import { APP_GUTTER } from '@/lib/appChrome';
import {
  GUEST_BRAND,
  useGuestMotion,
  useReveal,
  staggerContainer,
  staggerItem,
} from '@/features/guest/components/guestMotion';

function useCountUp(target, active, duration = 1100) {
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

  if (numeric == null) return target;
  return value;
}

function StatCell({ label, target, suffix = '', animate, show, index }) {
  const counted = useCountUp(typeof target === 'number' ? target : 0, show && animate);
  const display =
    typeof target === 'number'
      ? `${counted.toLocaleString()}${suffix}`
      : target;

  return (
    <motion.div
      custom={index}
      variants={staggerItem}
      className="relative flex flex-col items-center justify-center px-3 py-5 sm:py-6 text-center"
    >
      <p
        className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-neutral-950 leading-none"
        style={{ color: index === 0 ? GUEST_BRAND.blue : undefined }}
      >
        {display}
      </p>
      <p className="mt-2 text-[11px] sm:text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
    </motion.div>
  );
}

export default function GuestHomePulseStats({
  examCount = 0,
  roadmapCount = 0,
  questionCount = 0,
}) {
  const ref = useRef(null);
  const { animate } = useGuestMotion();
  const show = useReveal(ref, { animate, amount: 0.4 });

  const questionDisplay =
    questionCount >= 1000
      ? { target: Math.round(questionCount / 1000), suffix: 'k+' }
      : { target: questionCount, suffix: '' };

  return (
    <section ref={ref} className="relative pb-10 sm:pb-12 -mt-2">
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
              background: `radial-gradient(ellipse 70% 100% at 50% 120%, ${GUEST_BRAND.soft} 0%, transparent 70%)`,
            }}
            aria-hidden
          />
          {animate && show ? (
            <motion.div
              className="absolute -bottom-8 left-1/2 h-16 w-2/3 -translate-x-1/2 rounded-full blur-2xl pointer-events-none"
              style={{ backgroundColor: `${GUEST_BRAND.blue}33` }}
              animate={{ opacity: [0.35, 0.55, 0.35], scaleX: [0.92, 1.05, 0.92] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            />
          ) : null}

          <div className="relative grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-neutral-100">
            <StatCell
              label="Active exams"
              target={examCount}
              animate={animate}
              show={show}
              index={0}
            />
            <StatCell
              label="Study plans"
              target={SHOW_OG_TRACKERS ? roadmapCount : 'Soon'}
              animate={animate}
              show={show}
              index={1}
            />
            <StatCell
              label="Practice questions"
              target={questionDisplay.target}
              suffix={questionDisplay.suffix}
              animate={animate}
              show={show}
              index={2}
            />
            <StatCell
              label="Free to start"
              target="₹0"
              animate={animate}
              show={show}
              index={3}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
