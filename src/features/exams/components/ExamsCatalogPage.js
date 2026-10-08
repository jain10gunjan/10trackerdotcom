'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import {
  examCategoriesFromList,
  filterAndSortExams,
  pickFeaturedExams,
} from '@/features/exams/lib/examCatalogUtils';
import ExamCatalogCard from '@/features/exams/components/ExamCatalogCard';
import ExamsFeaturedPanel from '@/features/exams/components/ExamsFeaturedPanel';
import ExamsFilterBar from '@/features/exams/components/ExamsFilterBar';

export default function ExamsCatalogPage({ initialExams = [] }) {
  const { user } = useAuth();
  const { profile } = useProfileGate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const exams = initialExams;
  const categories = useMemo(() => examCategoriesFromList(exams), [exams]);

  const primarySlug = String(profile?.target_exam || '').trim().toLowerCase() || null;

  const featured = useMemo(
    () => pickFeaturedExams(exams, { primarySlug: user ? primarySlug : null, limit: 3 }),
    [exams, user, primarySlug]
  );

  const visibleExams = useMemo(
    () => filterAndSortExams(exams, { searchTerm, category: activeCategory, sortBy }),
    [exams, searchTerm, activeCategory, sortBy]
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/70 via-neutral-50 to-neutral-100 text-neutral-900">
      <section className="pt-24 pb-5 sm:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
            <div className="lg:col-span-7">
              <header className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white/95 shadow-sm">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),transparent_45%,rgba(139,92,246,0.04))] pointer-events-none" />
                <div className="absolute -top-16 -right-12 h-40 w-40 rounded-full bg-emerald-200/35 blur-3xl pointer-events-none" />
                <div className="relative p-5 sm:p-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    Exam catalog
                  </span>
                  <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 leading-tight">
                    Every active exam. One place to start.
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-xl leading-relaxed">
                    Filter by category, then jump into chapter practice or mock tests — only exams
                    you can use today.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-semibold text-neutral-800 tabular-nums">
                      {exams.length} active
                    </span>
                    <Link
                      href="/"
                      className="font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
                    >
                      Back to home
                    </Link>
                  </div>
                </div>
              </header>
            </div>

            <div className="lg:col-span-5">
              <ExamsFeaturedPanel featured={featured} isSignedIn={Boolean(user)} />
            </div>
          </div>
        </div>
      </section>

      <ExamsFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        resultCount={visibleExams.length}
        showMobileFilters={showMobileFilters}
        onToggleMobileFilters={() => setShowMobileFilters((v) => !v)}
      />

      <section className="py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-3.5 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-emerald-100 bg-emerald-50 text-[10px] font-bold text-emerald-800">
              01
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                Browse
              </p>
              <h2 className="text-sm font-bold text-neutral-900 leading-none mt-0.5">All exams</h2>
            </div>
          </div>

          {visibleExams.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white py-12 text-center px-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5 text-neutral-400" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">No exams match your filters</h3>
              <p className="text-sm text-neutral-500 mt-1.5 max-w-md mx-auto">
                Try clearing search or choosing a different category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('All');
                  setSortBy('popular');
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {visibleExams.map((exam) => (
                <ExamCatalogCard key={exam.slug} exam={exam} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-14 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-900 text-white p-6 sm:p-8">
            <div className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                  Next step
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">
                  {user ? 'Continue on your dashboard' : 'Track progress across exams'}
                </h2>
                <p className="mt-1.5 text-sm text-neutral-300 max-w-lg leading-relaxed">
                  {user
                    ? 'Streaks, mock rankings, and subject progress live on your personalized home.'
                    : 'Create a free account to save practice history, streaks, and mock rankings.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                {user ? (
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-100 transition-colors"
                  >
                    Go to dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/sign-up?redirect=%2Fexams"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-100 transition-colors"
                    >
                      Get started free
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                    >
                      Back to home
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
