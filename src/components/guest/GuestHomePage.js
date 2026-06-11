'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  ClipboardList,
  Map,
  Newspaper,
  Search,
  Sparkles,
} from 'lucide-react';
import { useGuestExams } from '@/hooks/useGuestExams';
import GuestExamCard from '@/components/guest/GuestExamCard';
import GuestArticleFeed from '@/components/guest/GuestArticleFeed';

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800">
      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
      {children}
    </span>
  );
}

export default function GuestHomePage({ categorySections = [] }) {
  const { exams, hydratedFromApi } = useGuestExams();
  const [examQuery, setExamQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const activeExams = useMemo(
    () => exams.filter((e) => e.active !== false),
    [exams]
  );

  const categories = useMemo(() => {
    const set = new Set();
    activeExams.forEach((e) => {
      if (e?.category) set.add(e.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [activeExams]);

  const popularExams = useMemo(
    () =>
      activeExams
        .sort((a, b) => (b.count || 0) - (a.count || 0))
        .slice(0, 6),
    [activeExams]
  );

  const visibleExams = useMemo(() => {
    const q = examQuery.trim().toLowerCase();
    return activeExams
      .filter((e) => (activeCategory === 'All' ? true : e.category === activeCategory))
      .filter((e) => {
        if (!q) return true;
        const hay = `${e.name || ''} ${e.slug || ''} ${e.description || ''}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [activeExams, examQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Hero */}
      <section className="pt-24 pb-8 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-16 w-56 h-56 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-neutral-50/80 pointer-events-none" />

            <div className="relative p-6 sm:p-8 lg:p-10">
              <Pill>10Tracker · Exam prep + updates</Pill>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 max-w-3xl">
                Pick your exam. Start practicing today.
              </h1>
              <p className="mt-4 text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed">
                Topic-wise MCQs, mock tests, and daily updates — built for competitive exam
                preparation on any device.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
                <Link
                  href="/exams"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  Start practicing
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/sign-in?redirect=%2F"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-800 font-semibold text-sm hover:bg-neutral-50 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Sign in to track progress
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  { href: '/articles', label: 'Updates', icon: Newspaper },
                  { href: '/articles/category/sarkari-exams', label: 'Sarkari exams', icon: Briefcase },
                  { href: '/roadmaps', label: 'Roadmaps', icon: Map },
                  { href: '/exams', label: 'All exams', icon: BookOpen },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-emerald-200 hover:text-emerald-800 transition-colors"
                  >
                    <link.icon className="w-3.5 h-3.5" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular exams — mobile-first above fold */}
      <section className="pb-10 sm:pb-12" id="popular-exams">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900">Popular exams</h2>
              <p className="text-sm text-neutral-500 mt-0.5">Jump straight into practice</p>
            </div>
            <Link
              href="/exams"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 shrink-0"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {!hydratedFromApi && popularExams.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl border border-neutral-200 bg-neutral-100 animate-pulse"
                  />
                ))
              : popularExams.map((exam) => (
                  <GuestExamCard key={exam.slug} exam={exam} compact />
                ))}
          </div>

          <Link
            href="/exams"
            className="mt-5 flex sm:hidden w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white py-3.5 text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Explore all exams
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Full exam browser */}
      <section className="pb-12 md:pb-16" id="exams">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">All exams</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Search by name or filter by category
                </p>
              </div>
              <Link
                href="/exams"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
              >
                Full exam directory
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={examQuery}
                  onChange={(e) => setExamQuery(e.target.value)}
                  placeholder="Search GATE, UPSC, JEE…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                />
              </div>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="sm:w-52 w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                aria-label="Filter by category"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {categories.slice(0, 8).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activeCategory === c
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {!hydratedFromApi && visibleExams.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 rounded-2xl border border-neutral-200 bg-neutral-100 animate-pulse"
                    />
                  ))
                : visibleExams.map((exam) => (
                    <GuestExamCard key={exam.slug} exam={exam} />
                  ))}
            </div>

            {hydratedFromApi && visibleExams.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-10">
                No exams match your search. Try a different keyword or category.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Product highlights */}
      <section className="pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: BookOpen,
                title: 'Topic-wise practice',
                desc: 'Chapter MCQs with solutions and progress tracking.',
                href: '/exams',
              },
              {
                icon: ClipboardList,
                title: 'Mock tests',
                desc: 'Timed tests with leaderboard rankings.',
                href: '/exams',
              },
              {
                icon: Newspaper,
                title: 'Daily updates',
                desc: 'Current affairs, jobs, and exam news in one place.',
                href: '/articles',
              },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                  <card.icon className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900 group-hover:text-emerald-900">
                  {card.title}
                </h3>
                <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{card.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <GuestArticleFeed categorySections={categorySections} />

      {/* Bottom CTA */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-neutral-900/10 bg-neutral-900 text-white p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Ready to start your prep?
              </h2>
              <p className="mt-2 text-neutral-300 text-sm sm:text-base max-w-lg mx-auto">
                Choose an exam, practice for free, and sign in when you want streaks, dashboards,
                and mock test rankings.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/exams"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-100 transition-colors"
                >
                  Browse exams
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/sign-up?redirect=%2F"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/25 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  Create free account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
