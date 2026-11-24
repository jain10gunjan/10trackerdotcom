'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ClipboardList, Route, TrendingUp } from 'lucide-react';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';
import { APP_GUTTER } from '@/lib/appChrome';
import {
  GUEST_BRAND,
  easeOut,
  useGuestMotion,
  useReveal,
  revealProps,
} from '@/features/guest/components/guestMotion';

/** Explanatory only — CTAs live in the hero, exam list, OG section, and close band. */
const STEPS = [
  {
    id: 'practice',
    icon: BookOpen,
    title: 'Practice by topic',
    description: 'Chapter-level MCQs with solutions across active exams.',
  },
  {
    id: 'mocks',
    icon: ClipboardList,
    title: 'Take timed mocks',
    description: 'Full-length tests with a clock, scores, rankings, and review.',
  },
  SHOW_OG_TRACKERS
    ? {
        id: 'paths',
        icon: Route,
        title: 'Follow an OG path',
        description: 'Day-by-day lessons and coding practice, tracked as you watch.',
      }
    : {
        id: 'progress',
        icon: TrendingUp,
        title: 'Track your progress',
        description: 'Sign in to keep streaks, heatmaps, and attempt history.',
      },
];

export default function GuestHomePrepLoop() {
  const ref = useRef(null);
  const { animate } = useGuestMotion();
  const show = useReveal(ref, { animate, amount: 0.25 });
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!animate || !show) return undefined;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % STEPS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [animate, show]);

  return (
    <section ref={ref} className="relative pb-14 sm:pb-16 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, #E8EDF8 0%, transparent 55%)',
        }}
        aria-hidden
      />

      <div className={`relative max-w-7xl mx-auto ${APP_GUTTER}`}>
        <motion.div {...revealProps(show, animate)} className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <p
            className="text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: GUEST_BRAND.blue }}
          >
            How it works
          </p>
          <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
            Three steps, one loop
          </h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-600">
            {SHOW_OG_TRACKERS
              ? 'Practice, simulate the real test, then follow a path that keeps you consistent.'
              : 'Practice, simulate the real test, then track what improves.'}
          </p>
        </motion.div>

        {/* Progress rail */}
        <div className="relative mb-6 hidden sm:block" aria-hidden>
          <div className="h-[2px] w-full rounded-full bg-neutral-200" />
          <motion.div
            className="absolute top-0 left-0 h-[2px] rounded-full"
            style={{ backgroundColor: GUEST_BRAND.blue }}
            initial={false}
            animate={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.45, ease: easeOut }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = active === i;
            return (
              <motion.div
                key={step.id}
                {...revealProps(show, animate, 0.06 * i)}
                onMouseEnter={() => setActive(i)}
                className={`relative flex h-full flex-col rounded-2xl border p-5 transition-all duration-300 ${
                  isActive
                    ? 'border-[#3F5EB9]/40 bg-white shadow-[0_20px_40px_-24px_rgba(63,94,185,0.45)]'
                    : 'border-neutral-200/90 bg-white/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      isActive ? 'text-white' : 'text-[#3F5EB9] bg-[#E8EDF8] border border-[#3F5EB9]/20'
                    }`}
                    style={isActive ? { backgroundColor: GUEST_BRAND.blue } : undefined}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400 tabular-nums">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-bold text-neutral-950">{step.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
