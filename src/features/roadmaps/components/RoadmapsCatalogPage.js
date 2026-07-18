'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Map, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMyRoadmaps } from '@/features/roadmaps/hooks/useMyRoadmaps';
import {
  examCategoriesFromRoadmaps,
  filterAndSortRoadmaps,
  pickFeaturedRoadmaps,
} from '@/features/roadmaps/lib/roadmapCatalogUtils';
import { ROADMAP_CATALOG_PAGE_SIZE } from '@/features/roadmaps/lib/constants';
import RoadmapCatalogCard from '@/features/roadmaps/components/RoadmapCatalogCard';
import RoadmapsDisclaimerBanner from '@/features/roadmaps/components/RoadmapsDisclaimerBanner';
import RoadmapsFeaturedPanel from '@/features/roadmaps/components/RoadmapsFeaturedPanel';
import RoadmapsFilterBar from '@/features/roadmaps/components/RoadmapsFilterBar';
import MyRoadmapsStrip from '@/features/roadmaps/components/MyRoadmapsStrip';

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800">
      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
      {children}
    </span>
  );
}

export default function RoadmapsCatalogPage({ initialRoadmaps = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { roadmaps: myRoadmaps, purchasedSlugs, loading: mineLoading } = useMyRoadmaps();

  const pageFromUrl = Math.max(1, Number(searchParams.get('page')) || 1);
  const searchFromUrl = searchParams.get('search') || '';
  const sortFromUrl = searchParams.get('sort') || 'featured';
  const categoryFromUrl = searchParams.get('category') || 'All';

  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const [sortBy, setSortBy] = useState(sortFromUrl);
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl);
  const [page, setPage] = useState(pageFromUrl);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const roadmaps = initialRoadmaps;
  const categories = useMemo(() => examCategoriesFromRoadmaps(roadmaps), [roadmaps]);

  const syncUrl = useCallback(
    (next) => {
      const params = new URLSearchParams();
      if (next.search) params.set('search', next.search);
      if (next.sort && next.sort !== 'featured') params.set('sort', next.sort);
      if (next.category && next.category !== 'All') params.set('category', next.category);
      if (next.page && next.page > 1) params.set('page', String(next.page));
      const qs = params.toString();
      router.replace(qs ? `/roadmaps?${qs}` : '/roadmaps', { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    setSearchTerm(searchFromUrl);
    setSortBy(sortFromUrl);
    setActiveCategory(categoryFromUrl);
    setPage(pageFromUrl);
  }, [searchFromUrl, sortFromUrl, categoryFromUrl, pageFromUrl]);

  const progressBySlug = useMemo(() => {
    const map = {};
    for (const r of myRoadmaps) {
      map[r.slug] = r.progressPercent;
    }
    return map;
  }, [myRoadmaps]);

  const featured = useMemo(() => pickFeaturedRoadmaps(roadmaps, { limit: 3 }), [roadmaps]);

  const filteredRoadmaps = useMemo(
    () => filterAndSortRoadmaps(roadmaps, { searchTerm, category: activeCategory, sortBy }),
    [roadmaps, searchTerm, activeCategory, sortBy]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRoadmaps.length / ROADMAP_CATALOG_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleRoadmaps = useMemo(() => {
    const offset = (safePage - 1) * ROADMAP_CATALOG_PAGE_SIZE;
    return filteredRoadmaps.slice(offset, offset + ROADMAP_CATALOG_PAGE_SIZE);
  }, [filteredRoadmaps, safePage]);

  const updateFilters = (patch) => {
    const next = {
      search: patch.searchTerm ?? searchTerm,
      sort: patch.sortBy ?? sortBy,
      category: patch.activeCategory ?? activeCategory,
      page: patch.page ?? 1,
    };
    if (patch.searchTerm != null) setSearchTerm(patch.searchTerm);
    if (patch.sortBy != null) setSortBy(patch.sortBy);
    if (patch.activeCategory != null) setActiveCategory(patch.activeCategory);
    if (patch.page != null) setPage(patch.page);
    else setPage(1);
    syncUrl(next);
  };

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
          onSearchChange={(v) => updateFilters({ searchTerm: v, page: 1 })}
          sortBy={sortBy}
          onSortChange={(v) => updateFilters({ sortBy: v, page: 1 })}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={(v) => updateFilters({ activeCategory: v, page: 1 })}
          resultCount={filteredRoadmaps.length}
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
          ) : filteredRoadmaps.length === 0 ? (
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
                onClick={() =>
                  updateFilters({ searchTerm: '', activeCategory: 'All', sortBy: 'featured', page: 1 })
                }
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
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

              {totalPages > 1 ? (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => updateFilters({ page: safePage - 1 })}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-neutral-500 tabular-nums">
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => updateFilters({ page: safePage + 1 })}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : null}
            </>
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
