'use client';

import React, {
  useState, useEffect, useCallback, useMemo, memo,
} from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BookOpen, Search, Target, Zap,
  Grid3X3, Play, X, ChevronDown, AlertCircle,
  ClipboardCheck, ArrowRight, ArrowUp,
} from 'lucide-react';
import MetaDataJobs from '@/components/Seo';
import Navbar from '@/components/Navbar';
import { examData } from '@/data/examData';

// ─── Constants ───────────────────────────────────────────────────────────────

const CACHE_VERSION    = 'v2';
const CACHE_TTL_MS     = 10 * 60 * 1000;
const SEARCH_DEBOUNCE  = 200;
const CACHE_PREFIX     = `et_${CACHE_VERSION}_`;
const FETCH_TIMEOUT_MS = 15_000;

// ─── Cache helpers ────────────────────────────────────────────────────────────

function readCache(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function writeCache(key, data) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    try {
      const keys = Object.keys(sessionStorage).filter(k => k.startsWith(CACHE_PREFIX));
      if (keys.length) sessionStorage.removeItem(keys[0]);
      sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch { /* give up */ }
  }
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchData(url, signal) {
  const res = await fetch(url, {
    signal,
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.subjectsData ?? [];
}

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─── Animation variants ───────────────────────────────────────────────────────

const makeVariants = (reduced) => ({
  card: {
    hidden:  reduced ? { opacity: 0 } : { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
    hover:   reduced ? {} : { y: -3, transition: { duration: 0.18 } },
  },
  container: {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: reduced ? 0 : 0.07 } },
  },
  fade: {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
  },
});

// ─── Utility ──────────────────────────────────────────────────────────────────

const slugify   = (str) => (str ?? '').replace(/\s+/g, '-').toLowerCase();
const unslug    = (str) => (str ?? '').replace(/-/g, ' ');
const titleCase = (str) =>
  (str ?? '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function getSubjectStats(subject) {
  const topicsCount    = subject?.subtopics?.length ?? 0;
  const questionsCount = subject?.subtopics?.reduce((s, t) => s + (t?.count ?? 0), 0) ?? 0;
  return { topicsCount, questionsCount };
}

// ─── QuickStats ───────────────────────────────────────────────────────────────

const QuickStats = memo(({ data }) => {
  const { subjects, topics, questions } = useMemo(() => ({
    subjects:  data.length,
    topics:    data.reduce((s, sub) => s + (sub?.subtopics?.length ?? 0), 0),
    questions: data.reduce((s, sub) =>
      s + (sub?.subtopics?.reduce((ss, t) => ss + (t?.count ?? 0), 0) ?? 0), 0),
  }), [data]);

  const stats = [
    { label: 'Subjects',  value: subjects,  icon: BookOpen },
    { label: 'Topics',    value: topics,    icon: Target   },
    { label: 'Questions', value: questions, icon: Zap      },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="bg-white/70 backdrop-blur rounded-2xl p-3 sm:p-4 border border-neutral-200/80"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-neutral-900 tabular-nums">
                {value.toLocaleString()}
              </p>
              <p className="text-[11px] sm:text-xs font-medium text-neutral-500 mt-0.5">{label}</p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-neutral-600" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
QuickStats.displayName = 'QuickStats';

// ─── PracticePathCards ────────────────────────────────────────────────────────

const PATH_CARDS = (category, { mockTestsLive = false } = {}) => [
  {
    id: 'pyq',
    href: '#practice-content',
    title: 'Practice MCQs',
    desc: 'Solve past year questions topic-wise with smart progress tracking.',
    icon: BookOpen,
    badge: 'Start here',
    scroll: true,
  },
  {
    id: 'topic-tests',
    href: `/${category}`,
    title: 'Topic-wise tests',
    desc: 'Timed mini-tests to identify and fix weak areas fast.',
    icon: Grid3X3,
    badge: 'Accuracy',
    comingSoon: true,
  },
  {
    id: 'mock-tests',
    href: `/mock-test/${category}`,
    title: 'Full mock tests',
    desc: 'Full-length simulated exams with detailed analytics.',
    icon: ClipboardCheck,
    badge: 'Simulate exam',
    comingSoon: !mockTestsLive,
  },
  {
    id: 'daily',
    href: `/${category}/daily-practice`,
    title: 'Daily practice',
    desc: 'Curated daily question sets for consistent revision.',
    icon: Target,
    badge: 'Consistency',
    comingSoon: true,
  },
];

const PracticePathCards = memo(({ category, mockTestsLive = false }) => {
  const cards = useMemo(() => PATH_CARDS(category, { mockTestsLive }), [category, mockTestsLive]);

  const notifyInProgress = useCallback((title) => {
    toast(`${title} is in progress. Stay tuned!`, {
      duration: 2600,
      style: { borderRadius: '14px' },
    });
  }, []);

  const handleScrollClick = useCallback((e) => {
    e.preventDefault();
    document.getElementById('practice-content')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {cards.map(({ id, href, title, desc, icon: Icon, badge, scroll, comingSoon }) => {
        const className = "group flex items-start gap-3 sm:gap-4 bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 hover:border-neutral-300 hover:shadow-md transition-all duration-200";

        const content = (
          <>
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-neutral-900 transition-colors duration-200">
              <Icon className="w-5 h-5 text-neutral-700 group-hover:text-white transition-colors duration-200" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-neutral-900 text-sm sm:text-base">{title}</span>
                {badge && (
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed line-clamp-2">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0 mt-0.5" />
          </>
        );

        if (scroll) {
          return (
            <Link key={id} href={href} onClick={handleScrollClick} className={className}>
              {content}
            </Link>
          );
        }

        if (comingSoon) {
          return (
            <button
              key={id}
              type="button"
              onClick={() => notifyInProgress(title)}
              className={className}
            >
              {content}
            </button>
          );
        }

        return (
          <Link key={id} href={href} className={className}>
            {content}
          </Link>
        );
      })}
    </div>
  );
});
PracticePathCards.displayName = 'PracticePathCards';

// ─── SubjectCard (Mobile) ─────────────────────────────────────────────────────
// Replaces the <tr> layout on small screens with a tappable card design.

const SubjectCard = memo(({ subject, category }) => {
  const [open, setOpen] = useState(false);
  const { topicsCount, questionsCount } = useMemo(() => getSubjectStats(subject), [subject]);
  const subjectName = subject?.subject ?? 'Unknown';
  const subjectSlug = useMemo(() => slugify(subjectName), [subjectName]);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden transition-shadow hover:shadow-sm">
      {/* Card header */}
      <div className="p-4 flex items-start gap-3">
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Collapse topics' : 'Expand topics'}
          aria-expanded={open}
          className="mt-0.5 w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center flex-shrink-0 transition-colors"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Subject info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 text-sm leading-tight">{subjectName}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500">
              <Target className="w-3 h-3" />
              {topicsCount} topics
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500">
              <Zap className="w-3 h-3" />
              {questionsCount.toLocaleString()} Qs
            </span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/${category}/${subjectSlug}`}
          className="flex-shrink-0 inline-flex items-center gap-1 rounded-xl bg-neutral-900 text-white px-3 py-1.5 text-xs font-semibold
                     hover:bg-neutral-700 transition-colors shadow-sm"
        >
          Open <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Expandable topics */}
      <AnimatePresence initial={false}>
        {open && subject?.subtopics?.length > 0 && (
          <motion.div
            key="topics"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-neutral-100 bg-neutral-50/60 px-4 py-3">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Topics</p>
              <div className="flex flex-wrap gap-2">
                {subject.subtopics.map((t) => (
                  <p
                    key={t?.title}
                    //href={`/${category}/practice/${t?.title ?? ''}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white
                               hover:border-neutral-400 hover:bg-neutral-50 active:scale-95 transition-all text-xs font-medium text-neutral-700"
                  >
                    <Play className="w-3 h-3 text-neutral-400" />
                    {unslug(t?.title)}
                    <span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-md font-bold text-[10px]">
                      {t?.count ?? 0}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
SubjectCard.displayName = 'SubjectCard';

// ─── SubjectRow (Desktop table row) ──────────────────────────────────────────

const SubjectRow = memo(({ subject, category }) => {
  const [open, setOpen] = useState(false);
  const { topicsCount, questionsCount } = useMemo(() => getSubjectStats(subject), [subject]);
  const subjectName = subject?.subject ?? 'Unknown';
  const subjectSlug = useMemo(() => slugify(subjectName), [subjectName]);

  return (
    <>
      <tr className="odd:bg-white even:bg-neutral-50/40 hover:bg-neutral-100/50 transition-colors">
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              aria-label={open ? 'Collapse topics' : 'Expand topics'}
              aria-expanded={open}
              className="w-6 h-6 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            <div>
              <p className="font-semibold text-neutral-900 text-sm leading-tight">{subjectName}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Topic-wise MCQs</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="tabular-nums text-sm font-semibold text-neutral-700">{topicsCount}</span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="tabular-nums text-sm font-semibold text-neutral-700">
            {questionsCount.toLocaleString()}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <Link
            href={`/${category}/${subjectSlug}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white px-3 py-1.5 text-xs font-semibold
                       hover:bg-neutral-700 transition-colors shadow-sm"
          >
            Open <ArrowRight className="w-3 h-3" />
          </Link>
        </td>
      </tr>

      <AnimatePresence initial={false}>
        {open && subject?.subtopics?.length > 0 && (
          <motion.tr
            key="subtopics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <td colSpan={4} className="px-4 pb-3 pt-0">
              <div className="ml-8 border-l-2 border-neutral-200 pl-4">
                <div className="flex flex-wrap gap-2 py-2">
                  {subject.subtopics.map((t) => (
                    <Link
                      key={t?.title}
                      href={`/${category}/practice/${t?.title ?? ''}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white
                                 hover:border-neutral-400 hover:bg-neutral-50 transition-colors text-xs font-medium text-neutral-700"
                    >
                      <Play className="w-3 h-3 text-neutral-400" />
                      {unslug(t?.title)}
                      <span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-md font-bold">
                        {t?.count ?? 0}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
});
SubjectRow.displayName = 'SubjectRow';

// ─── SearchBar ────────────────────────────────────────────────────────────────

const SearchBar = memo(({ value, onChange }) => (
  <div className="relative">
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
    <input
      type="search"
      inputMode="search"
      autoComplete="off"
      placeholder="Search subjects or topics…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-10 py-2.5 bg-white border border-neutral-300 rounded-xl
                 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900
                 transition-colors text-sm placeholder:text-neutral-400"
      aria-label="Search subjects and topics"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center
                   text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        aria-label="Clear search"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
));
SearchBar.displayName = 'SearchBar';

// ─── NoResults ────────────────────────────────────────────────────────────────

const NoResults = memo(({ term, onClear }) => (
  <div className="py-16 text-center">
    <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
      <Search className="w-5 h-5 text-neutral-400" />
    </div>
    <p className="text-sm font-semibold text-neutral-900 mb-1">No subjects found</p>
    <p className="text-xs text-neutral-500 mb-4">No results for &ldquo;{term}&rdquo;</p>
    <button
      onClick={onClear}
      className="px-4 py-2 border border-neutral-300 text-neutral-800 text-sm font-medium rounded-xl hover:bg-neutral-50 transition-colors"
    >
      Clear search
    </button>
  </div>
));
NoResults.displayName = 'NoResults';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = ({ className }) => (
  <div className={`bg-neutral-200 rounded-xl animate-pulse ${className}`} />
);

const PageSkeleton = () => (
  <div className="min-h-screen bg-neutral-50">
    <Navbar />
    <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        <div className="lg:col-span-7 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <div className="flex gap-2">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-9 w-28" />)}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-44 w-full rounded-3xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    </div>
  </div>
);

// ─── Error ────────────────────────────────────────────────────────────────────

const ErrorPage = ({ error, onRetry }) => (
  <div className="min-h-screen bg-neutral-50 flex flex-col">
    <Navbar />
    <div className="flex-1 flex items-center justify-center px-4 pt-24">
      <div className="text-center p-8 bg-white rounded-2xl border border-neutral-200 shadow-sm max-w-sm w-full">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 mb-2">Failed to load</h2>
        <p className="text-sm text-neutral-600 mb-5">{error?.message ?? 'Something went wrong.'}</p>
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-neutral-900 text-white font-semibold text-sm rounded-xl hover:bg-neutral-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
);

// ─── NewsSection ──────────────────────────────────────────────────────────────

const NEWS_ITEMS = [
  { id: 1, tag: 'Guide',          title: 'Strategy deep-dive coming soon',      summary: 'An in-depth strategy guide tailored to this exam. Stay tuned.' },
  { id: 2, tag: 'Daily practice', title: 'Daily sets and revision lists',        summary: 'Curated daily sets – MCQs, mixed questions and quick revisions.' },
  { id: 3, tag: 'Updates',        title: 'Exam notifications & important dates', summary: 'Official notifications, important dates and last-minute checklists.' },
];

const NewsSection = memo(({ category }) => (
  <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 sm:p-7">
      <div className="mb-5">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-900">News & updates</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Placeholder — plug your live news feed here.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {NEWS_ITEMS.map((item) => (
          <div key={item.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 flex flex-col gap-2">
            <span className="inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-white">
              {item.tag}
            </span>
            <p className="text-sm font-semibold text-neutral-900 leading-snug">{item.title}</p>
            <p className="text-xs text-neutral-500 leading-relaxed flex-1">{item.summary}</p>
            <span className="text-[11px] font-semibold text-neutral-400">Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  </section>
));
NewsSection.displayName = 'NewsSection';

// ─── FAB ──────────────────────────────────────────────────────────────────────

const FAB = memo(({ quickStartHref }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!scrolled) return null;

  return (
    <motion.div
      className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-50 flex flex-col gap-2 items-end"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        className="w-10 h-10 bg-white border border-neutral-300 text-neutral-700 rounded-full flex items-center justify-center shadow-md hover:bg-neutral-50 transition-colors"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
      <Link
        href={quickStartHref}
        aria-label="Quick start practice"
        className="bg-neutral-900 hover:bg-neutral-700 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
      </Link>
    </motion.div>
  );
});
FAB.displayName = 'FAB';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExamTracker() {
  const { category } = useParams();
  const safeCategory = category ?? 'default';

  const cacheKey = `${CACHE_PREFIX}${safeCategory.toUpperCase()}`;
  const apiURL   = `/api/allsubtopics?category=${encodeURIComponent(safeCategory.toUpperCase())}`;

  const formattedCat = useMemo(() => titleCase(safeCategory), [safeCategory]);
  const mockTestsLive = useMemo(
    () => examData.some((e) => e.slug === safeCategory && e.active),
    [safeCategory]
  );
  const reduced      = useReducedMotion();
  const vars         = useMemo(() => makeVariants(reduced), [reduced]);

  const [data,    setData   ] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState(null);
  const [search,  setSearch ] = useState('');

  const notifyInProgress = useCallback((label) => {
    toast(`${label} is in progress. Stay tuned!`, {
      duration: 2600,
      style: { borderRadius: '14px' },
    });
  }, []);

  useEffect(() => {
    setSearch('');
    setError(null);

    const ac = new AbortController();
    const { signal } = ac;

    const cached = readCache(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      fetchData(apiURL, signal)
        .then((fresh) => {
          if (signal.aborted) return;
          writeCache(cacheKey, fresh);
          setData(fresh);
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            console.warn('[ExamTracker] background revalidation failed:', err);
          }
        });
      return () => ac.abort();
    }

    setData([]);
    setLoading(true);

    const timeoutId = setTimeout(() => {
      ac.abort();
      setError(new Error('Request timed out. Please try again.'));
      setLoading(false);
    }, FETCH_TIMEOUT_MS);

    fetchData(apiURL, signal)
      .then((fresh) => {
        if (signal.aborted) return;
        clearTimeout(timeoutId);
        writeCache(cacheKey, fresh);
        setData(fresh);
        setLoading(false);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err?.name === 'AbortError') return;
        setError(err);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      ac.abort();
    };
  }, [cacheKey, apiURL]);

  const retry = useCallback(() => {
    sessionStorage.removeItem(cacheKey);
    setError(null);
    setData([]);
    setLoading(true);

    const ac = new AbortController();
    fetchData(apiURL, ac.signal)
      .then((fresh) => {
        writeCache(cacheKey, fresh);
        setData(fresh);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError(err);
        setLoading(false);
      });
  }, [cacheKey, apiURL]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE);

  const filteredSubjects = useMemo(() => {
    if (!debouncedSearch) return data;
    const t = debouncedSearch.toLowerCase();
    return data.filter((sub) =>
      sub?.subject?.toLowerCase().includes(t) ||
      sub?.subtopics?.some((topic) =>
        topic?.title?.toLowerCase().includes(t) ||
        String(topic?.count ?? '').includes(t),
      ),
    );
  }, [data, debouncedSearch]);

  const quickStartHref = useMemo(() => {
    if (!filteredSubjects.length) return '#';
    return `/${safeCategory}/${slugify(filteredSubjects[0]?.subject ?? '')}`;
  }, [filteredSubjects, safeCategory]);

  const hubLinks = useMemo(() => ({
    mockTests:     `/mock-test/${safeCategory}`,
    topicTests:    `/mock-test/${safeCategory}?tab=tests`,
    dailyPractice: `/${safeCategory}/daily-practice`,
  }), [safeCategory]);

  // ── Render guards ──────────────────────────────────────────────────────────

  if (loading && !data.length) return <PageSkeleton />;
  if (error   && !data.length) return <ErrorPage error={error} onRetry={retry} />;

  if (!data.length) return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <MetaDataJobs
        seoTitle={`${formattedCat} Practice Tracker`}
        seoDescription={`Practice ${formattedCat} MCQs topic-wise with detailed solutions.`}
      />
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-24">
        <div className="text-center p-8 bg-white rounded-2xl border border-neutral-200 max-w-sm w-full">
          <BookOpen className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="font-semibold text-neutral-900 mb-1">No subjects available</p>
          <p className="text-sm text-neutral-500 mb-5">Nothing found in this category yet.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-neutral-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-50">
      <MetaDataJobs
        seoTitle={`${formattedCat} Practice Tracker`}
        seoDescription={`Practice ${formattedCat} MCQs topic-wise with detailed solutions.`}
      />
<Navbar />

      <div className="pt-20">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative bg-white border-b border-neutral-200 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-10 sm:pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="lg:col-span-7 space-y-5"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200">
                  <Zap className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="text-xs font-semibold text-neutral-700">
                    {formattedCat} · Practice Hub
                  </span>
                </div>

                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
                    {formattedCat} dashboard
                  </h1>
                  <p className="mt-2.5 text-sm sm:text-base text-neutral-600 max-w-xl leading-relaxed">
                    One place to practice PYQs, take topic tests, attempt mocks and keep your prep consistent.
                  </p>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Start Practicing', icon: BookOpen, scroll: true },
                    { label: 'Mock tests',  icon: ClipboardCheck, href: hubLinks.mockTests, comingSoon: true },
                    { label: 'Topic tests', icon: Grid3X3,        href: hubLinks.topicTests, comingSoon: true },
                    { label: 'Daily',       icon: Target,          href: hubLinks.dailyPractice, comingSoon: true },
                  ].map(({ label, icon: Icon, href, scroll, comingSoon }) =>
                    scroll ? (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          document.getElementById('practice-content')
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors"
                      >
                        <Icon className="w-4 h-4" /> {label} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : comingSoon ? (
                      <button
                        key={label}
                        type="button"
                        onClick={() => notifyInProgress(label)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:bg-neutral-50 transition-colors"
                      >
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    ) : (
                      <Link
                        key={label}
                        href={href}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:bg-neutral-50 transition-colors"
                      >
                        <Icon className="w-4 h-4" /> {label}
                      </Link>
                    )
                  )}
                </div>

                <QuickStats data={data} />
              </motion.div>

              {/* Right: Quick plan */}
              <motion.aside
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 }}
                className="lg:col-span-5"
              >
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-neutral-900">Quick plan</p>
                    <span className="text-[11px] text-neutral-400 font-medium">Simple workflow</span>
                  </div>
                  <ol className="space-y-3">
                    {[
                      'Start Practicing MCQs topic-wise and mark your progress.',
                      'Take topic tests to fix weak areas quickly.',
                      'Attempt mocks weekly for exam temperament.',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white border border-neutral-200 text-xs font-bold text-neutral-800 flex-shrink-0">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 rounded-xl border border-neutral-200 bg-white px-4 py-3">
                    <p className="text-xs text-neutral-500">
                      <span className="font-semibold text-neutral-800">Tip:</span> Use the search below to jump to any topic directly.
                    </p>
                  </div>
                </div>
              </motion.aside>
            </div>

            {/* Path cards */}
            <div className="mt-8">
              <PracticePathCards category={safeCategory} mockTestsLive={mockTestsLive} />
            </div>
          </div>
        </section>

        {/* ── Practice content ──────────────────────────────────────────── */}
        <section
          id="practice-content"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 scroll-mt-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
          >
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Practice topic-wise</h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                Search subjects and pick what to practice next.
              </p>
            </div>

            {error && data.length > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Showing cached data — refresh may be needed.
              </div>
            )}
          </motion.div>

          {/*
            ── Sticky toolbar ────────────────────────────────────────────────
            FIX: Changed from `sticky top-[4.5rem]` to `sticky top-16` (= 64px,
            matching a standard h-16 navbar). The previous value was sometimes
            slightly off causing a visible 1–2px gap/overlap on scroll, which
            made the toolbar appear to "break".

            Also removed `backdrop-blur` from the inner div and placed a solid
            `bg-neutral-50` on the outer sticky wrapper — this fully prevents
            content bleeding through behind the toolbar on iOS Safari, which
            doesn't always honour `backdrop-filter` correctly while scrolling.
          ──────────────────────────────────────────────────────────────────── */}
          <div className="sticky top-16 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-neutral-50 pb-3 pt-1">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-3 sm:p-4">
              <SearchBar value={search} onChange={setSearch} />

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-neutral-400">Showing</span>
                <span className="inline-flex items-center rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-1 font-semibold text-neutral-700">
                  {filteredSubjects.length} subjects
                </span>
                {debouncedSearch && (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-1 font-semibold text-neutral-700">
                      &ldquo;{debouncedSearch}&rdquo;
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        aria-label="Clear search"
                        className="text-neutral-400 hover:text-neutral-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="ml-auto inline-flex items-center gap-1 rounded-full bg-neutral-900 text-white px-2.5 py-1 font-semibold hover:bg-neutral-700 transition-colors"
                    >
                      Reset <X className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Subject list */}
          <AnimatePresence mode="wait">
            {filteredSubjects.length > 0 ? (
              <motion.div
                key="subjects"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/*
                  ── Mobile: card stack ─────────────────────────────────────
                  Shown only on screens below `sm` (< 640px).
                  Each subject gets a tappable card with expand/collapse topics.
                ──────────────────────────────────────────────────────────── */}
                <div className="sm:hidden mt-3 flex flex-col gap-3">
                  {filteredSubjects.map((subject, i) => (
                    <SubjectCard
                      key={subject?.subject ?? i}
                      subject={subject}
                      category={safeCategory}
                    />
                  ))}
                </div>

                {/*
                  ── Desktop: table ─────────────────────────────────────────
                  Shown only on `sm` and above (≥ 640px).
                ──────────────────────────────────────────────────────────── */}
                <div className="hidden sm:block mt-3 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                  <div className="max-h-[68vh] overflow-auto overscroll-contain">
                    <table className="min-w-full text-sm">
                      <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0 z-10">
                        <tr className="text-left text-neutral-500 text-xs font-semibold uppercase tracking-wide">
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4 text-right w-24">Topics</th>
                          <th className="py-3 px-4 text-right w-28">Questions</th>
                          <th className="py-3 px-4 text-right w-28">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {filteredSubjects.map((subject, i) => (
                          <SubjectRow
                            key={subject?.subject ?? i}
                            subject={subject}
                            category={safeCategory}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <NoResults key="noresults" term={debouncedSearch} onClear={() => setSearch('')} />
            )}
          </AnimatePresence>
        </section>

        <NewsSection category={safeCategory} />
      </div>

      <FAB quickStartHref={quickStartHref} />
    </div>
  );
}