'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, BookOpen, Search } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import {
  examCategoriesFromList,
  filterAndSortExams,
  pickFeaturedExams,
} from '@/lib/exams/examCatalogUtils';
import ExamCatalogCard from '@/components/exams/ExamCatalogCard';
import ExamsFeaturedPanel from '@/components/exams/ExamsFeaturedPanel';
import ExamsFilterBar from '@/components/exams/ExamsFilterBar';

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800">
      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
      {children}
    </span>
  );
}

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
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Hero */}
      <section className="pt-24 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-16 w-56 h-56 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-neutral-50/80 pointer-events-none" />

                <div className="relative p-6 sm:p-8">
                  <Pill>10Tracker exam catalog</Pill>
                  <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
                    Every active exam. One place to start.
                  </h1>
                  <p className="mt-3 text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed">
                    Browse the full catalog, filter by category, and jump into topic-wise practice
                    or mock tests — no clutter, only exams you can use today.
                  </p>
                  <Link
                    href="/"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
                  >
                    <BookOpen className="w-4 h-4" />
                    Back to home
                  </Link>
                </div>
              </div>
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

      {/* Catalog grid */}
      <section className="py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {visibleExams.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200 bg-white py-16 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-neutral-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900">No exams match your filters</h2>
              <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">
                Try clearing search or choosing a different category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('All');
                  setSortBy('popular');
                }}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {visibleExams.map((exam) => (
                <ExamCatalogCard key={exam.slug} exam={exam} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-neutral-900/10 bg-neutral-900 text-white p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              {user ? (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Continue on your dashboard
                  </h2>
                  <p className="mt-2 text-neutral-300 text-sm sm:text-base max-w-lg mx-auto">
                    Track streaks, mock rankings, and subject progress from your personalized home.
                  </p>
                  <Link
                    href="/"
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-100 transition-colors"
                  >
                    Go to dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Track progress across exams
                  </h2>
                  <p className="mt-2 text-neutral-300 text-sm sm:text-base max-w-lg mx-auto">
                    Create a free account to save practice history, streaks, and mock test rankings.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href="/sign-up?redirect=%2Fexams"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-100 transition-colors"
                    >
                      Get started free
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/25 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                    >
                      Back to home
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
