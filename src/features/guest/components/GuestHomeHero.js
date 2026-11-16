'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import {
  ArrowRight,
  BadgeIndianRupee,
  BookOpen,
  BookOpenCheck,
  Check,
  Chrome,
  ClipboardList,
  Flame,
  LineChart,
  Map,
  Play,
  Route,
  Timer,
  Trophy,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GoogleAuthButton from '@/features/auth/components/GoogleAuthButton';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';
import { APP_GUTTER, APP_NAV_CONTENT_OFFSET } from '@/lib/appChrome';

/** Logo-aligned brand: ink + .COM blue on light surfaces */
const BRAND = {
  blue: '#3F5EB9',
  blueBright: '#4B6BC7',
  soft: '#E8EDF8',
};

const easeOut = [0.22, 1, 0.36, 1];

const ROTATING_HOOKS = [
  'topic-wise MCQs',
  'timed mock tests',
  'YouTube path sync',
  'streaks that stick',
];

const FEATURE_SCENES = [
  {
    id: 'practice',
    label: 'MCQs',
    icon: BookOpenCheck,
    href: '/exams',
    eyebrow: 'Practice',
    title: 'Topic-wise MCQs',
    hint: 'Pick · confirm · move on',
    kind: 'mcq',
    exam: 'CAT',
    topic: 'Quantitative Aptitude',
    q: 'If 3x + 5 = 20, what is x?',
    options: ['3', '5', '7', '15'],
    correct: 1,
    progress: 42,
    streak: 4,
    timer: '01:42',
  },
  {
    id: 'mocks',
    label: 'Mocks',
    icon: ClipboardList,
    href: '/exams',
    eyebrow: 'Simulate',
    title: 'Timed mock tests',
    hint: 'Clock · score · rank',
    kind: 'mock',
    exam: 'GATE CSE',
    score: 68,
    rank: 214,
    timer: '02:41:08',
    answered: 48,
    total: 65,
  },
  ...(SHOW_OG_TRACKERS
    ? [
        {
          id: 'youtube',
          label: 'YouTube',
          icon: Chrome,
          href: '/extension/connect',
          eyebrow: 'Chrome extension',
          title: 'YouTube progress sync',
          hint: 'Watch · sync · complete',
          kind: 'youtube',
          video: 'Graphs — BFS deep dive',
          pct: 72,
        },
        {
          id: 'paths',
          label: 'Paths',
          icon: Route,
          href: '/og-trackers',
          eyebrow: 'OG Trackers',
          title: 'Day-by-day paths',
          hint: 'Video · code · next day',
          kind: 'path',
          pathTitle: 'Demo DSA path',
          day: 12,
          totalDays: 45,
          freeDays: 3,
        },
      ]
    : []),
  {
    id: 'streaks',
    label: 'Streaks',
    icon: Flame,
    href: '/',
    eyebrow: 'Habit',
    title: 'Streaks & heatmaps',
    hint: 'Show up · keep the flame',
    kind: 'streak',
    streak: 12,
    heat: [0.2, 0.5, 0.8, 0.3, 1, 0.6, 0.9, 0.4, 0.7, 1, 0.5, 0.85, 0.3, 0.95],
  },
  {
    id: 'ranks',
    label: 'Ranks',
    icon: Trophy,
    href: '/analysis',
    eyebrow: 'Compete',
    title: 'Ranks & analysis',
    hint: 'Attempt · climb · improve',
    kind: 'rank',
    percentile: 92,
    delta: '+14',
  },
];

const QUICK_LINKS = [
  { href: '/exams', label: 'Exams', icon: BookOpenCheck },
  ...(SHOW_OG_TRACKERS
    ? [
        { href: '/og-trackers', label: 'OG Trackers', icon: Route },
        { href: '/extension/connect', label: 'YouTube sync', icon: Chrome },
      ]
    : []),
  { href: '/exams', label: 'Mocks', icon: ClipboardList },
  { href: '/pricing', label: 'Pricing', icon: BadgeIndianRupee },
];

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

function ProgressRing({ value, animate }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="relative h-[72px] w-[72px] sm:h-[84px] sm:w-[84px] shrink-0 [contain:layout_paint]">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#E5E7EB" strokeWidth="6" />
        <motion.circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={BRAND.blue}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={animate ? { duration: 0.75, ease: easeOut } : { duration: 0 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base sm:text-lg font-bold tabular-nums text-neutral-900 leading-none">
          {value}%
        </span>
        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-neutral-400">
          done
        </span>
      </div>
    </div>
  );
}

function McqPanel({ scene, animate }) {
  const [phase, setPhase] = useState(animate ? 'idle' : 'confirm');

  useEffect(() => {
    if (!animate) {
      setPhase('confirm');
      return undefined;
    }
    setPhase('idle');
    const t1 = window.setTimeout(() => setPhase('select'), 700);
    const t2 = window.setTimeout(() => setPhase('confirm'), 1400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [scene.id, animate]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">
            {scene.exam}
            <span className="text-neutral-300 font-normal"> · </span>
            <span className="text-neutral-500 font-medium">{scene.topic}</span>
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-neutral-400">
            <Timer className="h-3 w-3 shrink-0" style={{ color: BRAND.blue }} />
            <span className="font-mono tabular-nums text-neutral-600">{scene.timer}</span>
            <span className="text-neutral-300">·</span>
            <Flame className="h-3 w-3 text-orange-500" />
            <span className="text-orange-700 font-semibold">{scene.streak}d</span>
          </div>
        </div>
        <ProgressRing value={scene.progress} animate={animate} />
      </div>
      <p className="font-mono text-[12px] sm:text-sm leading-relaxed text-neutral-800 mb-3">
        <span className="mr-2 font-semibold" style={{ color: BRAND.blue }}>
          Q.
        </span>
        {scene.q}
      </p>
      <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
        {scene.options.map((opt, i) => {
          const isCorrect = i === scene.correct;
          const confirmed = phase === 'confirm' && isCorrect;
          const selected = phase !== 'idle' && isCorrect;
          return (
            <motion.div
              key={opt}
              layout={false}
              animate={
                animate && confirmed
                  ? { scale: 1.02 }
                  : { scale: 1 }
              }
              transition={{ duration: 0.25, ease: easeOut }}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${
                selected
                  ? 'border-[#3F5EB9]/35 bg-[#E8EDF8]/70 text-neutral-900'
                  : 'border-neutral-200 bg-neutral-50/80 text-neutral-600'
              }`}
              style={
                confirmed
                  ? {
                      borderColor: `${BRAND.blue}55`,
                      backgroundColor: BRAND.soft,
                      boxShadow: '0 8px 20px -12px rgba(63,94,185,0.45)',
                    }
                  : undefined
              }
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                  confirmed ? 'text-white' : 'bg-white border border-neutral-200 text-neutral-500'
                }`}
                style={confirmed ? { backgroundColor: BRAND.blue } : undefined}
              >
                {confirmed ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : String.fromCharCode(65 + i)}
              </span>
              <span className="font-medium">{opt}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function MockPanel({ scene, animate }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">{scene.exam}</p>
          <p className="mt-1 text-xs text-neutral-500">Full-length timed attempt</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 font-mono text-xs font-semibold tabular-nums text-neutral-800">
          <Timer className="h-3.5 w-3.5" style={{ color: BRAND.blue }} />
          {scene.timer}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { label: 'Score', value: scene.score, suffix: '%' },
          { label: 'Rank', value: `#${scene.rank}` },
          { label: 'Done', value: `${scene.answered}/${scene.total}` },
        ].map((cell, i) => (
          <motion.div
            key={cell.label}
            initial={animate ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * i, ease: easeOut }}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-center shadow-sm"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              {cell.label}
            </p>
            <p
              className="mt-1 text-lg font-black tabular-nums text-neutral-950"
              style={i === 0 ? { color: BRAND.blue } : undefined}
            >
              {cell.value}
              {cell.suffix || ''}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
          <span>Attempt progress</span>
          <span className="tabular-nums font-medium text-neutral-700">
            {Math.round((scene.answered / scene.total) * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: BRAND.blue }}
            initial={animate ? { width: '0%' } : false}
            animate={{ width: `${(scene.answered / scene.total) * 100}%` }}
            transition={{ duration: 0.85, ease: easeOut }}
          />
        </div>
      </div>
    </div>
  );
}

function YoutubePanel({ scene, animate }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="rounded-xl border border-neutral-200 bg-neutral-950 text-white p-4 overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 80% 20%, #3F5EB966 0%, transparent 55%)',
          }}
          aria-hidden
        />
        <div className="relative flex items-center gap-2 text-[11px] font-medium text-neutral-400">
          <Play className="h-3.5 w-3.5" style={{ color: BRAND.blueBright }} />
          Watching on YouTube
        </div>
        <p className="relative mt-2 text-sm font-semibold truncate">{scene.video}</p>
        <div className="relative mt-4 h-2.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: BRAND.blueBright }}
            initial={animate ? { width: '12%' } : false}
            animate={{ width: `${scene.pct}%` }}
            transition={{ duration: 1.1, ease: easeOut }}
          />
        </div>
        <div className="relative mt-2 flex items-center justify-between text-xs">
          <span className="tabular-nums font-semibold">{scene.pct}% synced</span>
          <span className="text-neutral-400">→ OG Tracker</span>
        </div>
      </div>
      <div className="mt-auto pt-4 flex items-center gap-2 rounded-xl border border-[#3F5EB9]/20 bg-[#E8EDF8]/60 px-3 py-2.5">
        <Chrome className="h-4 w-4 shrink-0" style={{ color: BRAND.blue }} />
        <p className="text-xs text-neutral-700 leading-snug">
          Extension badge updates live. Hit 90% and the lesson marks complete.
        </p>
      </div>
    </div>
  );
}

function PathPanel({ scene, animate }) {
  const days = Math.min(scene.totalDays, 10);
  return (
    <div className="flex flex-1 flex-col">
      <p className="text-sm font-semibold text-neutral-900">{scene.pathTitle}</p>
      <p className="mt-1 text-xs text-neutral-500">
        Day {scene.day} of {scene.totalDays} · {scene.freeDays} free preview
      </p>
      <div className="mt-5 flex items-end gap-1.5 h-16">
        {Array.from({ length: days }).map((_, i) => {
          const active = i < Math.ceil((scene.day / scene.totalDays) * days);
          return (
            <motion.div
              key={i}
              className="flex-1 rounded-t-md origin-bottom"
              style={{
                backgroundColor: active ? BRAND.blue : '#E5E7EB',
                height: `${35 + ((i * 17) % 55)}%`,
              }}
              initial={animate ? { scaleY: 0.2, opacity: 0.4 } : false}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.04 * i, ease: easeOut }}
            />
          );
        })}
      </div>
      <div className="mt-auto pt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 font-medium text-neutral-700">
          YouTube lessons
        </span>
        <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 font-medium text-neutral-700">
          Coding practice
        </span>
        <span
          className="rounded-full border px-2.5 py-1 font-semibold"
          style={{
            borderColor: `${BRAND.blue}33`,
            backgroundColor: BRAND.soft,
            color: '#1e2f6b',
          }}
        >
          Progress syncs
        </span>
      </div>
    </div>
  );
}

function StreakPanel({ scene, animate }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3">
        <motion.span
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 border border-orange-200 text-orange-600"
          animate={
            animate
              ? { scale: [1, 1.06, 1], rotate: [0, -4, 0] }
              : undefined
          }
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Flame className="h-6 w-6" />
        </motion.span>
        <div>
          <p className="text-3xl font-black tabular-nums text-neutral-950 leading-none">
            {scene.streak}
          </p>
          <p className="mt-1 text-xs font-medium text-neutral-500">day streak</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {scene.heat.map((v, i) => (
          <motion.div
            key={i}
            className="aspect-square rounded-md"
            style={{
              backgroundColor: `rgba(63, 94, 185, ${0.12 + v * 0.88})`,
            }}
            initial={animate ? { opacity: 0, scale: 0.6 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, delay: 0.03 * i, ease: easeOut }}
          />
        ))}
      </div>
      <p className="mt-auto pt-4 text-xs text-neutral-500">
        Heatmap fills as you practice — sign in to keep it.
      </p>
    </div>
  );
}

function RankPanel({ scene, animate }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: BRAND.blue }}
        >
          <Trophy className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Percentile
          </p>
          <div className="flex items-baseline gap-2">
            <motion.p
              className="text-3xl font-black tabular-nums text-neutral-950 leading-none"
              initial={animate ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: easeOut }}
            >
              {scene.percentile}
              <span className="text-lg">th</span>
            </motion.p>
            <span className="text-sm font-bold text-emerald-600">{scene.delta}</span>
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {['Quant', 'VARC', 'LRDI'].map((label, i) => {
          const widths = [78, 64, 86];
          return (
            <div key={label}>
              <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                <span>{label}</span>
                <span className="tabular-nums font-medium text-neutral-700">{widths[i]}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: BRAND.blue }}
                  initial={animate ? { width: 0 } : false}
                  animate={{ width: `${widths[i]}%` }}
                  transition={{ duration: 0.7, delay: 0.1 * i, ease: easeOut }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-neutral-500">
        <LineChart className="h-3.5 w-3.5" style={{ color: BRAND.blue }} />
        Trends unlock after you sign in
      </div>
    </div>
  );
}

function SceneBody({ scene, animate }) {
  switch (scene.kind) {
    case 'mock':
      return <MockPanel scene={scene} animate={animate} />;
    case 'youtube':
      return <YoutubePanel scene={scene} animate={animate} />;
    case 'path':
      return <PathPanel scene={scene} animate={animate} />;
    case 'streak':
      return <StreakPanel scene={scene} animate={animate} />;
    case 'rank':
      return <RankPanel scene={scene} animate={animate} />;
    default:
      return <McqPanel scene={scene} animate={animate} />;
  }
}

function FeatureShowcaseStage({ animate }) {
  const rootRef = useRef(null);
  const inView = useInView(rootRef, { amount: 0.35, once: false });
  const run = animate && inView;
  const [index, setIndex] = useState(0);
  const scene = FEATURE_SCENES[index];
  const Icon = scene.icon;

  useEffect(() => {
    if (!run) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % FEATURE_SCENES.length);
    }, 3400);
    return () => window.clearInterval(id);
  }, [run, index]);

  return (
    <div ref={rootRef} className="relative">
      {/* Floating feature orbit — GPU transforms only */}
      <div className="pointer-events-none absolute -inset-2 sm:-inset-3 z-20 hidden sm:block" aria-hidden>
        {FEATURE_SCENES.map((feat, i) => {
          const active = i === index;
          const spots = [
            { top: '6%', left: '-2%' },
            { top: '8%', right: '-1%' },
            { top: '48%', right: '-4%' },
            { bottom: '10%', right: '2%' },
            { bottom: '8%', left: '-2%' },
            { top: '52%', left: '-5%' },
          ];
          const spot = spots[i % spots.length];
          const FeatIcon = feat.icon;
          return (
            <motion.div
              key={feat.id}
              className="absolute"
              style={spot}
              animate={
                run
                  ? {
                      y: active ? [0, -4, 0] : [0, 3, 0],
                      opacity: active ? 1 : 0.72,
                      scale: active ? 1.05 : 1,
                    }
                  : { opacity: 0.85, scale: 1, y: 0 }
              }
              transition={{
                duration: active ? 2.4 : 3.6,
                repeat: run ? Infinity : 0,
                ease: 'easeInOut',
                delay: i * 0.12,
              }}
            >
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold shadow-sm backdrop-blur-sm ${
                  active
                    ? 'border-[#3F5EB9]/40 bg-white text-[#1e2f6b]'
                    : 'border-neutral-200/80 bg-white/90 text-neutral-600'
                }`}
              >
                <FeatIcon
                  className="h-3 w-3"
                  style={{ color: active ? BRAND.blue : '#737373' }}
                />
                {feat.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="relative flex flex-col min-h-[340px] sm:min-h-[400px] lg:min-h-[460px] rounded-2xl sm:rounded-[1.75rem] border border-neutral-200/90 bg-white overflow-hidden shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)] [contain:layout_paint] [transform:translateZ(0)]">
        <div
          className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
        <div
          className="absolute -top-20 -right-12 h-56 w-56 rounded-full blur-3xl pointer-events-none opacity-50"
          style={{ backgroundColor: BRAND.soft }}
        />
        <div
          className="absolute -bottom-24 -left-14 h-48 w-48 rounded-full blur-3xl pointer-events-none opacity-60"
          style={{ backgroundColor: `${BRAND.blue}22` }}
        />

        {/* Feature switcher tabs */}
        <div className="relative z-10 flex gap-1 overflow-x-auto border-b border-neutral-100 bg-neutral-50/90 px-2 py-2 scrollbar-none">
          {FEATURE_SCENES.map((feat, i) => {
            const TabIcon = feat.icon;
            const active = i === index;
            return (
              <button
                key={feat.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                  active ? 'text-[#1e2f6b]' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="hero-feature-pill"
                    className="absolute inset-0 rounded-lg border border-[#3F5EB9]/25 bg-white shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <TabIcon
                  className="relative h-3.5 w-3.5"
                  style={{ color: active ? BRAND.blue : '#a3a3a3' }}
                />
                <span className="relative">{feat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative z-10 flex flex-1 flex-col p-4 sm:p-6 lg:p-7">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: BRAND.blue }}
                >
                  {scene.eyebrow}
                </p>
                <span className="text-[10px] font-medium text-neutral-400">{scene.hint}</span>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.h3
                  key={scene.title}
                  initial={run ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={run ? { opacity: 0, y: -6 } : undefined}
                  transition={{ duration: 0.28, ease: easeOut }}
                  className="mt-1.5 text-base sm:text-lg font-bold tracking-tight text-neutral-950"
                >
                  {scene.title}
                </motion.h3>
              </AnimatePresence>
            </div>
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: BRAND.blue }}
            >
              <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            </span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={scene.id}
              initial={run ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={run ? { opacity: 0, y: -10 } : undefined}
              transition={{ duration: 0.32, ease: easeOut }}
              className="flex flex-1 flex-col min-h-[200px]"
            >
              <SceneBody scene={scene} animate={run} />
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex items-center gap-1.5">
            {FEATURE_SCENES.map((feat, i) => (
              <button
                key={feat.id}
                type="button"
                aria-label={feat.title}
                onClick={() => setIndex(i)}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 22 : 6,
                  backgroundColor: i === index ? BRAND.blue : '#D4D4D8',
                }}
              />
            ))}
            <Link
              href={scene.href}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-[#3F5EB9] transition-colors pointer-events-auto"
            >
              Open
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function RotatingHook({ animate }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!animate) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % ROTATING_HOOKS.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [animate]);

  return (
    <span className="relative inline-grid max-w-full overflow-hidden align-bottom text-left leading-[1.25]">
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
        YouTube path sync
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={ROTATING_HOOKS[index]}
          initial={animate ? { y: '90%', opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          exit={animate ? { y: '-90%', opacity: 0 } : undefined}
          transition={{ duration: 0.32, ease: easeOut }}
          className="col-start-1 row-start-1 whitespace-nowrap font-semibold"
          style={{ color: BRAND.blue }}
        >
          {ROTATING_HOOKS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function GuestHomeHero({ stats = {} }) {
  const mounted = useMounted();
  const prefersReduced = useReducedMotion();
  const animate = mounted && !prefersReduced;
  const { signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const examCount = stats.examCount ?? 0;
  const questionCount = stats.questionCount ?? 0;
  const roadmapCount = stats.roadmapCount ?? 0;

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle({ redirectUrl: '/' });
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setGoogleLoading(false);
    }
  };

  const questionLabel =
    questionCount >= 1000
      ? `${Math.round(questionCount / 1000)}k+`
      : questionCount.toLocaleString();

  const enter = (delay = 0) =>
    animate
      ? {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: easeOut },
        }
      : { initial: false, animate: { opacity: 1, y: 0 } };

  return (
    <section
      className="relative overflow-hidden pb-10 sm:pb-14"
      style={{ paddingTop: APP_NAV_CONTENT_OFFSET }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 85% 15%, #E8EDF8 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 10% 30%, #F0F4FF 0%, transparent 50%), linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 55%, #F5F5F5 100%)',
          }}
        />
        {animate ? (
          <>
            <motion.div
              className="absolute top-[4%] right-[12%] h-64 w-64 sm:h-80 sm:w-80 rounded-full blur-[100px] will-change-transform"
              style={{ backgroundColor: `${BRAND.blue}28` }}
              animate={{ x: [0, 20, 0], y: [0, 14, 0], opacity: [0.35, 0.55, 0.35] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute top-[28%] left-[4%] h-56 w-56 rounded-full blur-[90px] bg-sky-200/40 will-change-transform"
              animate={{ x: [0, -16, 0], y: [0, 18, 0], opacity: [0.25, 0.4, 0.25] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
          </>
        ) : (
          <div
            className="absolute top-[8%] right-[10%] h-72 w-72 rounded-full blur-[100px] opacity-40"
            style={{ backgroundColor: BRAND.soft }}
          />
        )}
      </div>

      <div className={`relative max-w-7xl mx-auto ${APP_GUTTER} pt-5 sm:pt-8 md:pt-9 lg:pt-10`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-7 sm:gap-8 md:gap-8 lg:gap-10 md:items-center">
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left order-1">
            <motion.p
              {...enter(0)}
              className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500"
            >
              Exam practice · paths · YouTube sync
            </motion.p>

            <motion.p
              {...enter(0.05)}
              className="mt-3 text-[clamp(2.25rem,8vw,3.75rem)] font-black tracking-tight text-neutral-950 leading-[0.92]"
            >
              10tracker
              <span
                className="ml-1.5 align-middle inline-flex rounded-[4px] px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: BRAND.blue }}
              >
                .com
              </span>
            </motion.p>

            <motion.h1
              {...enter(0.1)}
              className="mt-4 text-lg sm:text-2xl lg:text-[1.85rem] font-semibold tracking-tight text-neutral-900 leading-[1.3] max-w-md"
            >
              <span className="block">Practice that sticks — with</span>
              <RotatingHook animate={animate} />
            </motion.h1>

            <motion.p
              {...enter(0.15)}
              className="mt-3 text-sm sm:text-[15px] text-neutral-600 leading-relaxed max-w-md"
            >
              MCQs, timed mocks, OG Tracker paths, and Chrome YouTube sync — one place that
              keeps your prep moving.
            </motion.p>

            <motion.div
              {...enter(0.2)}
              className="mt-5 sm:mt-6 flex w-full max-w-md md:max-w-none flex-col gap-2.5"
            >
              <div className="flex w-full flex-col sm:flex-row gap-2.5 justify-center md:justify-start">
                <Link
                  href="/exams"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99]"
                  style={{
                    backgroundColor: BRAND.blue,
                    boxShadow: `0 12px 32px -10px ${BRAND.blue}99`,
                  }}
                >
                  <BookOpen className="h-4 w-4" />
                  Browse exams
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {SHOW_OG_TRACKERS ? (
                  <Link
                    href="/og-trackers"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50 transition-colors shadow-sm"
                  >
                    <Map className="h-4 w-4" style={{ color: BRAND.blue }} />
                    Explore paths
                  </Link>
                ) : null}
              </div>

              <GoogleAuthButton
                size="hero"
                label="Sign in with Google"
                loadingLabel="Signing in…"
                loading={googleLoading}
                onClick={handleGoogleSignIn}
                className="w-full justify-center md:w-auto"
              />
              <p className="text-center md:text-left text-xs text-neutral-500">
                Save streaks, YouTube progress, and rankings in one tap
              </p>
            </motion.div>

            <motion.div
              {...enter(0.28)}
              className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-2"
            >
              {QUICK_LINKS.map((item, i) => {
                const LinkIcon = item.icon;
                return (
                  <motion.div
                    key={`${item.href}-${item.label}`}
                    initial={animate ? { opacity: 0, y: 8 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.28 + i * 0.05, ease: easeOut }}
                    whileHover={animate ? { y: -2, scale: 1.03 } : undefined}
                  >
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-[#3F5EB9]/35 hover:bg-[#E8EDF8]/60 hover:text-neutral-900 transition-colors shadow-sm"
                    >
                      <LinkIcon className="h-3.5 w-3.5" strokeWidth={2} style={{ color: BRAND.blue }} />
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div
              {...enter(0.32)}
              className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-neutral-500"
            >
              {examCount > 0 ? (
                <span>
                  <span className="font-semibold tabular-nums text-neutral-900">
                    {examCount.toLocaleString()}
                  </span>{' '}
                  {examCount === 1 ? 'exam' : 'exams'}
                </span>
              ) : null}
              {questionCount > 0 ? (
                <span>
                  <span className="font-semibold tabular-nums text-neutral-900">
                    {questionLabel}
                  </span>{' '}
                  questions
                </span>
              ) : null}
              {SHOW_OG_TRACKERS && roadmapCount > 0 ? (
                <span>
                  <span className="font-semibold tabular-nums text-neutral-900">
                    {roadmapCount.toLocaleString()}
                  </span>{' '}
                  {roadmapCount === 1 ? 'path' : 'paths'}
                </span>
              ) : (
                <span>Free to start</span>
              )}
            </motion.div>
          </div>

          <motion.div
            className="md:col-span-7 w-full max-w-lg sm:max-w-xl mx-auto md:max-w-none md:pl-1 lg:pl-2 order-2"
            {...enter(0.12)}
          >
            <FeatureShowcaseStage animate={animate} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
