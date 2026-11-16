'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Chrome,
  ClipboardList,
  Map,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';
import { APP_GUTTER } from '@/lib/appChrome';
import {
  GUEST_BRAND,
  easeOut,
  useGuestMotion,
  useReveal,
  revealProps,
} from '@/features/guest/components/guestMotion';

const STEPS = [
  {
    id: 'mcqs',
    icon: BookOpen,
    title: 'Topic-wise MCQs',
    description: 'Chapter-level practice with solutions across active exams.',
    href: '/exams',
    cta: 'Browse exams',
  },
  {
    id: 'mocks',
    icon: ClipboardList,
    title: 'Mock tests',
    description: 'Timed full-length tests with rankings and detailed review.',
    href: '/exams',
    cta: 'Find mocks',
  },
  {
    id: 'plans',
    icon: Map,
    title: SHOW_OG_TRACKERS ? 'OG Tracker paths' : 'Day-by-day plans',
    description: SHOW_OG_TRACKERS
      ? 'YouTube + coding paths with free preview days you can track.'
      : 'Coming soon — structured daily plans for focused prep.',
    href: SHOW_OG_TRACKERS ? '/og-trackers' : '/exams',
    cta: SHOW_OG_TRACKERS ? 'Explore paths' : 'Browse exams',
  },
  ...(SHOW_OG_TRACKERS
    ? [
        {
          id: 'extension',
          icon: Chrome,
          title: 'YouTube sync',
          description: 'Chrome extension syncs watch % into your path automatically.',
          href: '/extension/connect',
          cta: 'Connect extension',
        },
      ]
    : [
        {
          id: 'progress',
          icon: TrendingUp,
          title: 'Progress tracking',
          description: 'Sign in for streaks, heatmaps, and activity history.',
          action: 'google',
          cta: 'Sign in with Google',
        },
      ]),
];

export default function GuestHomePrepLoop({ onGoogleSignIn, googleLoading = false }) {
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
            Your prep loop on 10tracker
          </h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-600">
            {SHOW_OG_TRACKERS
              ? 'Practice, mock, follow a path, sync YouTube — the loop that keeps you coming back.'
              : 'Four moves that keep exam prep moving — practice, simulate, plan, and track.'}
          </p>
        </motion.div>

        {/* Progress rail */}
        <div className="relative mb-6 hidden sm:block" aria-hidden>
          <div className="h-[2px] w-full rounded-full bg-neutral-200" />
          <motion.div
            className="absolute top-0 left-0 h-[2px] rounded-full"
            style={{ backgroundColor: GUEST_BRAND.blue }}
            initial={false}
            animate={{
              width: `${((active + 1) / STEPS.length) * 100}%`,
            }}
            transition={{ duration: 0.45, ease: easeOut }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = active === i;
            const content = (
              <>
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
                <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed flex-1">
                  {step.description}
                </p>
                <span
                  className={`mt-4 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                    isActive ? 'text-[#3F5EB9]' : 'text-neutral-700'
                  }`}
                >
                  {step.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </>
            );

            const shellClass = `relative flex h-full flex-col rounded-2xl border p-5 text-left transition-all duration-300 ${
              isActive
                ? 'border-[#3F5EB9]/40 bg-white shadow-[0_20px_40px_-24px_rgba(63,94,185,0.45)] scale-[1.02]'
                : 'border-neutral-200/90 bg-white/80 hover:border-[#3F5EB9]/25 hover:bg-white'
            }`;

            return (
              <motion.div
                key={step.id}
                {...revealProps(show, animate, 0.06 * i)}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
              >
                {step.action === 'google' ? (
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    disabled={googleLoading}
                    className={`${shellClass} w-full disabled:opacity-60`}
                  >
                    {content}
                  </button>
                ) : (
                  <Link href={step.href} className={shellClass}>
                    {content}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
