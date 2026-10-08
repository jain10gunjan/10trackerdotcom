'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Newspaper,
  Search,
  X,
} from 'lucide-react';
import ArticleListCard from '@/features/articles/components/ArticleListCard';
import { articlesListHref } from '@/features/articles/lib/articlesListHref';

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800">
      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
      {children}
    </span>
  );
}

function CategoryChip({ href, active, children, color }) {
  return (
    <Link
      href={href}
      className={`shrink-0 snap-start rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors border ${
        active
          ? 'bg-neutral-900 text-white border-neutral-900'
          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
      }`}
      style={
        active && color
          ? { backgroundColor: color, borderColor: color, color: '#fff' }
          : undefined
      }
    >
      {children}
    </Link>
  );
}

export default function ArticlesPageClient({
  articles = [],
  totalCount = 0,
  page = 1,
  pageSize = 18,
  category = '',
  query = '',
  categories = [],
  fetchError = null,
}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === category) || null,
    [categories, category]
  );
  const accentColor = activeCategory?.color || '#059669';
  const hasFilters = Boolean(category || query);

  const categoryColorBySlug = useMemo(() => {
    const map = {};
    for (const c of categories) map[c.slug] = c.color || accentColor;
    return map;
  }, [categories, accentColor]);

  const featured = useMemo(() => {
    if (page !== 1 || hasFilters) return null;
    return articles.find((a) => a.is_featured) || articles[0] || null;
  }, [articles, page, hasFilters]);

  const gridArticles = useMemo(() => {
    if (!featured) return articles;
    return articles.filter((a) => a.id !== featured.id);
  }, [articles, featured]);

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(
      articlesListHref({
        page: 1,
        category,
        query: searchInput,
      })
    );
  };

  const clearFiltersHref = articlesListHref({ page: 1 });

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Hero */}
      <section className="pt-24 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-200/35 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-neutral-50/90 pointer-events-none" />

            <div className="relative p-6 sm:p-8 lg:p-10">
              <Pill>10Tracker · News &amp; updates</Pill>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-[2.5rem] font-bold tracking-tight text-neutral-900 leading-[1.15] max-w-3xl">
                {activeCategory ? activeCategory.name : 'Stay exam-ready with the latest updates'}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-neutral-600 max-w-2xl leading-relaxed">
                {activeCategory
                  ? `Browse ${activeCategory.name.toLowerCase()} articles, alerts, and prep notes.`
                  : 'Current affairs, exam alerts, admit cards, and preparation notes — clear and searchable.'}
              </p>

              <form
                onSubmit={handleSearch}
                className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl"
                role="search"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <input
                    type="search"
                    name="q"
                    placeholder="Search updates…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-colors"
                    aria-label="Search articles"
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Search
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-500">
                <span className="tabular-nums font-medium text-neutral-700">
                  {totalCount.toLocaleString()} {totalCount === 1 ? 'article' : 'articles'}
                </span>
                {query ? (
                  <span>
                    Matching “{query}”
                    <Link
                      href={articlesListHref({ page: 1, category })}
                      className="ml-2 font-semibold text-emerald-800 hover:text-emerald-900"
                    >
                      Clear
                    </Link>
                  </span>
                ) : null}
                {totalPages > 1 ? (
                  <span className="tabular-nums">
                    Page {page} of {totalPages}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        {/* Categories */}
        {categories.length > 0 ? (
          <section className="mb-8" aria-label="Filter by category">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Categories
              </p>
              {hasFilters ? (
                <Link
                  href={clearFiltersHref}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filters
                </Link>
              ) : null}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <CategoryChip href={articlesListHref({ page: 1, query })} active={!category}>
                All
              </CategoryChip>
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.slug}
                  href={articlesListHref({ page: 1, category: cat.slug, query })}
                  active={category === cat.slug}
                  color={cat.color}
                >
                  {cat.name}
                </CategoryChip>
              ))}
            </div>
          </section>
        ) : null}

        {/* Content */}
        {fetchError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50/60 p-8 sm:p-10 text-center">
            <Newspaper className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-neutral-900">Couldn’t load updates</h2>
            <p className="mt-2 text-sm text-neutral-600 max-w-md mx-auto">{fetchError}</p>
            <Link
              href="/articles"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-800"
            >
              Try again
            </Link>
          </div>
        ) : articles.length > 0 ? (
          <div className="space-y-8">
            {featured ? (
              <ArticleListCard
                article={featured}
                accentColor={categoryColorBySlug[featured.category] || accentColor}
                featured
              />
            ) : null}

            {gridArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {gridArticles.map((article) => (
                  <ArticleListCard
                    key={article.id}
                    article={article}
                    accentColor={categoryColorBySlug[article.category] || accentColor}
                  />
                ))}
              </div>
            ) : null}

            {totalPages > 1 ? (
              <nav
                className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 sm:px-5 shadow-sm"
                aria-label="Pagination"
              >
                {page > 1 ? (
                  <Link
                    href={articlesListHref({ page: page - 1, category, query })}
                    rel="prev"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3.5 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-100 px-3.5 py-2 text-sm font-medium text-neutral-300">
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </span>
                )}

                <span className="text-sm text-neutral-600 tabular-nums font-medium">
                  {page} / {totalPages}
                </span>

                {page < totalPages ? (
                  <Link
                    href={articlesListHref({ page: page + 1, category, query })}
                    rel="next"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3.5 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-100 px-3.5 py-2 text-sm font-medium text-neutral-300">
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </nav>
            ) : null}
          </div>
        ) : (
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 sm:p-12 text-center shadow-sm">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
              <Newspaper className="w-5 h-5 text-emerald-700" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">No updates found</h2>
            <p className="mt-2 text-sm text-neutral-600 max-w-sm mx-auto">
              {hasFilters
                ? 'Try a different search or category.'
                : 'New articles will show up here soon.'}
            </p>
            {hasFilters ? (
              <Link
                href={clearFiltersHref}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-900"
              >
                Clear filters
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900"
              >
                Back to home
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
