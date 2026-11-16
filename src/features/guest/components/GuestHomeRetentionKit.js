'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BadgeIndianRupee,
  Chrome,
  Flame,
  LineChart,
  Megaphone,
  Play,
  Sparkles,
  Target,
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

const WATCH_SCENES = [
  { title: 'Arrays — Two pointers', pct: 34 },
  { title: 'Graphs — BFS deep dive', pct: 72 },
  { title: 'DP — Knapsack intuition', pct: 91 },
];

function ExtensionShowcase({ animate, show }) {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    if (!animate || !show) return undefined;
    const id = window.setInterval(() => {
      setScene((i) => (i + 1) % WATCH_SCENES.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [animate, show]);

  const current = WATCH_SCENES[scene];

  return (
    <motion.div
      {...revealProps(show, animate)}
      className="relative overflow-hidden rounded-2xl sm:rounded-[1.5rem] border border-neutral-200/90 bg-neutral-950 text-white p-5 sm:p-7 md:p-8 shadow-[0_28px_60px_-28px_rgba(15,23,42,0.55)] h-full min-h-[320px] flex flex-col"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 90% 10%, #3F5EB966 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 10% 90%, #1e3a8a44 0%, transparent 50%)',
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-200">
            <Chrome className="h-3.5 w-3.5" style={{ color: '#8BA3E8' }} />
            Chrome extension
          </span>
          <h3 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight leading-snug">
            Watch YouTube. Progress syncs to your path.
          </h3>
          <p className="mt-2 text-sm text-neutral-300 leading-relaxed max-w-md">
            Catalogued OG Tracker lessons update automatically — badge shows %, and your tracker
            marks videos complete at 90%+.
          </p>
        </div>
      </div>

      <div className="relative mt-6 flex-1 flex flex-col justify-end">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-400">
            <Play className="h-3.5 w-3.5" style={{ color: GUEST_BRAND.blueBright }} />
            Live on YouTube
          </div>
          <div className="mt-2 min-h-[1.5rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={current.title}
                initial={animate ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={animate ? { opacity: 0, y: -6 } : undefined}
                transition={{ duration: 0.28, ease: easeOut }}
                className="text-sm font-semibold text-white truncate"
              >
                {current.title}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              key={`bar-${scene}`}
              className="h-full rounded-full"
              style={{ backgroundColor: GUEST_BRAND.blueBright }}
              initial={animate ? { width: '8%' } : false}
              animate={{ width: `${current.pct}%` }}
              transition={{ duration: 0.7, ease: easeOut }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="tabular-nums font-semibold text-neutral-200">{current.pct}% watched</span>
            <span className="text-neutral-500">
              {current.pct >= 90 ? 'Marked complete' : 'Syncing to OG Tracker'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <Link
            href="/extension/connect"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99]"
            style={{
              backgroundColor: GUEST_BRAND.blue,
              boxShadow: `0 12px 28px -12px ${GUEST_BRAND.blue}aa`,
            }}
          >
            Connect extension
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/og-trackers"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Browse paths
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function FeatureTile({
  href,
  icon: Icon,
  eyebrow,
  title,
  description,
  cta,
  delay = 0,
  animate,
  show,
  accent = false,
  onClick,
}) {
  const body = (
    <>
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
          accent
            ? 'text-white'
            : 'text-[#3F5EB9] bg-[#E8EDF8] border border-[#3F5EB9]/20'
        }`}
        style={accent ? { backgroundColor: GUEST_BRAND.blue } : undefined}
      >
        <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
      </span>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-sm font-bold text-neutral-950 leading-snug">{title}</h3>
      <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed flex-1">{description}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 group-hover:text-[#3F5EB9] transition-colors">
        {cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </>
  );

  const className =
    'group relative flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:border-[#3F5EB9]/35 hover:shadow-[0_18px_40px_-28px_rgba(63,94,185,0.45)] hover:-translate-y-0.5';

  return (
    <motion.div {...revealProps(show, animate, delay)} className="h-full">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          disabled={cta?.includes('Signing')}
          className={`${className} w-full text-left disabled:opacity-60`}
        >
          {body}
        </button>
      ) : (
        <Link href={href} className={className}>
          {body}
        </Link>
      )}
    </motion.div>
  );
}

export default function GuestHomeRetentionKit({
  onGoogleSignIn,
  googleLoading = false,
}) {
  const ref = useRef(null);
  const { animate } = useGuestMotion();
  const show = useReveal(ref, { animate, amount: 0.18 });

  return (
    <section id="features" ref={ref} className="scroll-mt-24 pb-14 sm:pb-16">
      <div className={`max-w-7xl mx-auto ${APP_GUTTER}`}>
        <motion.div {...revealProps(show, animate)} className="mb-7 sm:mb-9 max-w-2xl">
          <p
            className="text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: GUEST_BRAND.blue }}
          >
            Built to stick
          </p>
          <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
            More than practice — habits that pull you back
          </h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-600 leading-relaxed">
            Extension sync, daily sets, streaks, rankings, and cheap unlimited days — everything
            that turns one session into a streak.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {SHOW_OG_TRACKERS ? (
            <div className="lg:col-span-7">
              <ExtensionShowcase animate={animate} show={show} />
            </div>
          ) : null}

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 ${
              SHOW_OG_TRACKERS ? 'lg:col-span-5' : 'lg:col-span-12 lg:grid-cols-4'
            }`}
          >
            <FeatureTile
              icon={Flame}
              eyebrow="Habit"
              title="Streaks that stick"
              description="Sign in once — keep a flame going with daily practice and heatmaps."
              cta={googleLoading ? 'Signing in…' : 'Sign in with Google'}
              onClick={onGoogleSignIn}
              accent
              animate={animate}
              show={show}
              delay={0.05}
            />
            <FeatureTile
              href="/exams"
              icon={Target}
              eyebrow="Daily"
              title="Mock of the day & DPP"
              description="Rotating daily mocks and practice sets so there’s always a next set."
              cta="Start practicing"
              animate={animate}
              show={show}
              delay={0.1}
            />
            <FeatureTile
              href="/pricing"
              icon={BadgeIndianRupee}
              eyebrow="Credits"
              title="Free start, cheap unlocks"
              description="Signup bonus credits, then day passes and unlimited plans — no auto-renew."
              cta="See pricing"
              animate={animate}
              show={show}
              delay={0.15}
            />
            <FeatureTile
              href="/analysis"
              icon={LineChart}
              eyebrow="Insight"
              title="Progress & rankings"
              description="Subject trends, difficulty charts, and mock leaderboards after every attempt."
              cta="Open analysis"
              animate={animate}
              show={show}
              delay={0.2}
            />
          </div>
        </div>

        <motion.div
          {...revealProps(show, animate, 0.18)}
          className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
        >
          <Link
            href="/articles"
            className="group flex items-center gap-3 rounded-xl border border-neutral-200/90 bg-white px-4 py-3.5 shadow-sm hover:border-[#3F5EB9]/30 hover:bg-[#E8EDF8]/40 transition-colors"
          >
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: GUEST_BRAND.soft, color: GUEST_BRAND.blue }}
            >
              <Megaphone className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">Exam updates</p>
              <p className="text-xs text-neutral-500 truncate">News, strategies, current affairs</p>
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-[#3F5EB9] group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link
            href="/article/latest-jobs"
            className="group flex items-center gap-3 rounded-xl border border-neutral-200/90 bg-white px-4 py-3.5 shadow-sm hover:border-[#3F5EB9]/30 hover:bg-[#E8EDF8]/40 transition-colors"
          >
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: GUEST_BRAND.soft, color: GUEST_BRAND.blue }}
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">Jobs feed</p>
              <p className="text-xs text-neutral-500 truncate">Latest openings while you prep</p>
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-[#3F5EB9] group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link
            href="/aptitude"
            className="group flex items-center gap-3 rounded-xl border border-neutral-200/90 bg-white px-4 py-3.5 shadow-sm hover:border-[#3F5EB9]/30 hover:bg-[#E8EDF8]/40 transition-colors"
          >
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: GUEST_BRAND.soft, color: GUEST_BRAND.blue }}
            >
              <Target className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">Aptitude practice</p>
              <p className="text-xs text-neutral-500 truncate">Dedicated topic drills</p>
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-[#3F5EB9] group-hover:translate-x-0.5 transition-all" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
