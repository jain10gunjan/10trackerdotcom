'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Chrome,
  ClipboardList,
  PlayCircle,
} from 'lucide-react';
import { GUEST_BRAND as BRAND } from '@/features/guest/components/guestMotion';

const easeOut = [0.22, 1, 0.36, 1];

const STEPS = [
  {
    id: 'watch',
    icon: PlayCircle,
    label: 'Watch',
    title: 'Graph Theory — Basics',
    meta: 'YouTube · synced via extension',
    pct: 72,
  },
  {
    id: 'practice',
    icon: BookOpen,
    label: 'Practice',
    title: 'Chapter practice set',
    meta: 'On 10Tracker · mirrors to path',
    pct: 40,
  },
  {
    id: 'mock',
    icon: ClipboardList,
    label: 'Mock',
    title: 'Topic mock — Relations',
    meta: 'Weak topics loop back',
    pct: 0,
  },
];

/**
 * OG-only product visual — exam → chapter → loop.
 * Shares brand tokens with homepage; composition is unique to /og-trackers.
 */
export default function OgHeroVisual({
  examTitle = 'GATE CSE',
  chapterTitle = 'Discrete Mathematics',
  href = '/og-trackers/gate-cse-discrete-mathematics',
}) {
  const prefersReduced = useReducedMotion();
  const animate = !prefersReduced;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!animate) return undefined;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % STEPS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [animate]);

  return (
    <div className="relative w-full max-w-lg sm:max-w-xl mx-auto md:max-w-none">
      {/* Extension callout — floats above the stack */}
      <motion.div
        className="absolute -top-3 right-3 z-20 hidden sm:block"
        animate={animate ? { y: [0, -4, 0] } : undefined}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Link
          href="/extension/connect"
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-800 shadow-md hover:border-[#3F5EB9]/40"
        >
          <Chrome className="h-3.5 w-3.5" style={{ color: BRAND.blue }} />
          Extension syncs watch %
        </Link>
      </motion.div>

      <motion.div
        initial={animate ? { opacity: 0, y: 18 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: easeOut, delay: 0.12 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-[1.75rem] border border-neutral-200/90 bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)]"
      >
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${BRAND.blue}, ${BRAND.blueBright})`,
          }}
        />

        {/* Breadcrumb path */}
        <div className="px-5 pt-5 pb-4 border-b border-neutral-100">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: BRAND.blue }}
          >
            Live path
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-semibold text-neutral-800">
              {examTitle}
            </span>
            <span className="text-neutral-300">→</span>
            <span
              className="rounded-full border px-2.5 py-1 font-semibold"
              style={{
                borderColor: `${BRAND.blue}33`,
                backgroundColor: BRAND.soft,
                color: '#1e2f6b',
              }}
            >
              {chapterTitle}
            </span>
          </div>
          <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
            One checklist: watch on YouTube, practice and mock on 10Tracker — progress stays in
            sync when the extension is connected.
          </p>
        </div>

        {/* Loop steps */}
        <div className="p-4 sm:p-5 space-y-2.5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const on = i === active;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActive(i)}
                className={`w-full text-left rounded-xl border px-3.5 py-3 transition-colors ${
                  on
                    ? 'border-[#3F5EB9]/35 bg-[#E8EDF8]/70'
                    : 'border-neutral-100 bg-neutral-50/70 hover:border-neutral-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      on ? 'text-white' : 'text-neutral-500 bg-white border border-neutral-200'
                    }`}
                    style={on ? { backgroundColor: BRAND.blue } : undefined}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                        {step.label}
                      </p>
                      {step.pct > 0 ? (
                        <span className="text-[11px] font-semibold tabular-nums text-neutral-700">
                          {step.pct}%
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-neutral-400">Next</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-neutral-950 truncate">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-neutral-500 truncate">{step.meta}</p>
                    {on && step.pct > 0 ? (
                      <div className="mt-2 h-1.5 rounded-full bg-white/80 overflow-hidden border border-neutral-100">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: BRAND.blue }}
                          initial={animate ? { width: 0 } : false}
                          animate={{ width: `${step.pct}%` }}
                          transition={{ duration: 0.7, ease: easeOut }}
                        />
                      </div>
                    ) : null}
                  </div>
                  {i < 2 ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-1" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3.5 bg-neutral-50/50">
          <p className="text-xs text-neutral-500">
            <span className="font-semibold text-neutral-800">34 steps</span> in this chapter
          </p>
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-semibold"
            style={{ color: BRAND.blue }}
          >
            Open tracker
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
