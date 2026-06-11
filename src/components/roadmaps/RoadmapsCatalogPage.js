'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Map, Search } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useMyRoadmaps } from '@/hooks/useMyRoadmaps';
import {
  examCategoriesFromRoadmaps,
  filterAndSortRoadmaps,
  pickFeaturedRoadmaps,
} from '@/lib/roadmaps/roadmapCatalogUtils';
import RoadmapCatalogCard from '@/components/roadmaps/RoadmapCatalogCard';
import RoadmapsDisclaimerBanner from '@/components/roadmaps/RoadmapsDisclaimerBanner';
import RoadmapsFeaturedPanel from '@/components/roadmaps/RoadmapsFeaturedPanel';
import RoadmapsFilterBar from '@/components/roadmaps/RoadmapsFilterBar';
import MyRoadmapsStrip from '@/components/roadmaps/MyRoadmapsStrip';

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800">
      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
      {children}
    </span>
  );
}

export default function RoadmapsCatalogPage({ initialRoadmaps = [] }) {
  const { user } = useAuth();
  const { roadmaps: myRoadmaps, purchasedSlugs, loading: mineLoading } = useMyRoadmaps();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const roadmaps = initialRoadmaps;
  const categories = useMemo(() => examCategoriesFromRoadmaps(roadmaps), [roadmaps]);

  const progressBySlug = useMemo(() => {
    const map = {};
    for (const r of myRoadmaps) {
      map[r.slug] = r.progressPercent;
    }
    return map;
  }, [myRoadmaps]);

  const featured = useMemo(() => pickFeaturedRoadmaps(roadmaps, { limit: 3 }), [roadmaps]);

  const visibleRoadmaps = useMemo(
    () => filterAndSortRoadmaps(roadmaps, { searchTerm, category: activeCategory, sortBy }),
    [roadmaps, searchTerm, activeCategory, sortBy]
  );

  const isEmptyCatalog = roadmaps.length === 0;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="pt-24 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-16 w-56 h-56 bg-violet-200/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-neutral-50/80 pointer-events-none" />

                <div className="relative p-6 sm:p-8">
                  <Pill>10Tracker roadmap marketplace</Pill>
                  <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
                    Structured plans. One-time purchase.
                  </h1>
                  <p className="mt-3 text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed">
                    Day-by-day study roadmaps with tasks, resources, and progress tracking. Preview
                    free days, then unlock the full plan when you are ready.
                  </p>
                  <Link
                    href="/"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
                  >
                    <Map className="w-4 h-4" />
                    Back to home
                  </Link>
                </div>
              </div>

              <RoadmapsDisclaimerBanner />
            </div>

            <div className="lg:col-span-5">
              {!isEmptyCatalog ? <RoadmapsFeaturedPanel featured={featured} /> : null}
            </div>
          </div>
        </div>
      </section>

      {user ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MyRoadmapsStrip roadmaps={myRoadmaps} loading={mineLoading} show />
        </div>
      ) : null}

      {!isEmptyCatalog ? (
        <RoadmapsFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          resultCount={visibleRoadmaps.length}
          showMobileFilters={showMobileFilters}
          onToggleMobileFilters={() => setShowMobileFilters((v) => !v)}
        />
      ) : null}

      <section className="py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isEmptyCatalog ? (
            <div className="rounded-3xl border border-neutral-200 bg-white py-16 sm:py-20 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
                <Map className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
                Roadmaps are on the way
              </h2>
              <p className="text-sm sm:text-base text-neutral-500 mt-3 max-w-md mx-auto leading-relaxed">
                We are preparing structured study plans for your exams. Meanwhile, explore topic-wise
                practice and mock tests in the exam catalog.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/exams"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 transition-colors"
                >
                  Browse exams
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-800 font-semibold text-sm hover:bg-neutral-50 transition-colors"
                >
                  View practice plans
                </Link>
              </div>
            </div>
          ) : visibleRoadmaps.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200 bg-white py-16 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-neutral-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900">No roadmaps match your filters</h2>
              <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">
                Try clearing search or choosing a different exam category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('All');
                  setSortBy('featured');
                }}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {visibleRoadmaps.map((roadmap) => {
                const owned = purchasedSlugs.includes(roadmap.slug);
                return (
                  <RoadmapCatalogCard
                    key={roadmap.id}
                    roadmap={roadmap}
                    owned={owned}
                    progressPercent={owned ? progressBySlug[roadmap.slug] : null}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RoadmapsDisclaimerBanner />
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-neutral-900/10 bg-neutral-900 text-white p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              {user ? (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Need unlimited practice too?
                  </h2>
                  <p className="mt-2 text-neutral-300 text-sm sm:text-base max-w-lg mx-auto">
                    Roadmaps are separate from unlimited practice plans. Compare options on pricing.
                  </p>
                  <Link
                    href="/pricing"
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-100 transition-colors"
                  >
                    View pricing
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Preview free days — sign in to save progress
                  </h2>
                  <p className="mt-2 text-neutral-300 text-sm sm:text-base max-w-lg mx-auto">
                    Create a free account to track tasks across devices and unlock full roadmaps with
                    a one-time purchase.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href="/sign-up?redirect=%2Froadmaps"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-100 transition-colors"
                    >
                      Get started free
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/25 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                    >
                      Unlimited practice plans
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
