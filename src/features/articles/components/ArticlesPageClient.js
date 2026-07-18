'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import ArticleListCard from '@/features/articles/components/ArticleListCard';
import { articlesListHref } from '@/features/articles/lib/articlesListHref';

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

  React.useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const activeCategory = categories.find((c) => c.slug === category);
  const accentColor = activeCategory?.color || '#2563eb';

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
    <div className="min-h-screen bg-neutral-50 pt-20">
      <div className="border-b border-neutral-200/80 bg-white">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
          style={{
            background: 'linear-gradient(135deg, #2563eb06 0%, white 50%, white 100%)',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">
            10Tracker
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
            Updates
          </h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-2xl">
            Latest news, current affairs, exam alerts, and preparation updates — all in one place.
          </p>
          <p className="mt-3 text-sm text-neutral-500 tabular-nums">
            {totalCount} {totalCount === 1 ? 'article' : 'articles'}
            {category && activeCategory ? ` in ${activeCategory.name}` : ''}
            {query ? ` matching “${query}”` : ''}
            {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-5 rounded-2xl bg-white ring-1 ring-neutral-200/80 p-4 sm:p-5 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3" role="search">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="search"
                name="q"
                placeholder="Search updates…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl ring-1 ring-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
            >
              Search
            </button>
          </form>
          {query ? (
            <p className="mt-3 text-sm text-neutral-600">
              Showing results for &ldquo;{query}&rdquo; —{' '}
              <Link
                href={articlesListHref({ page: 1, category })}
                className="font-medium text-neutral-900 underline"
              >
                clear search
              </Link>
            </p>
          ) : null}
        </div>

        {categories.length > 0 ? (
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                Filter by category
              </p>
              {category ? (
                <Link
                  href={articlesListHref({ page: 1, query })}
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Clear
                </Link>
              ) : null}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                href={articlesListHref({ page: 1, query })}
                className={`snap-start shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  !category
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-white text-neutral-700 ring-1 ring-neutral-200/80 hover:ring-neutral-300'
                }`}
              >
                All
              </Link>
              {categories.map((cat) => {
                const active = category === cat.slug;
                return (
                  <Link
                    key={cat.slug}
                    href={articlesListHref({ page: 1, category: cat.slug, query })}
                    className={`snap-start shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                      active
                        ? 'text-white shadow-sm'
                        : 'bg-white text-neutral-700 ring-1 ring-neutral-200/80 hover:ring-neutral-300'
                    }`}
                    style={active ? { backgroundColor: cat.color || '#2563eb' } : undefined}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        {fetchError ? (
          <div className="text-center py-16 sm:py-20 rounded-2xl bg-white ring-1 ring-red-200/80">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Something went wrong</h2>
            <p className="text-neutral-600 mb-6 text-sm max-w-sm mx-auto">{fetchError}</p>
            <Link href="/articles" className="text-sm font-medium text-neutral-900 underline">
              Retry
            </Link>
          </div>
        ) : articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {articles.map((article) => (
                <ArticleListCard
                  key={article.id}
                  article={article}
                  accentColor={
                    categories.find((c) => c.slug === article.category)?.color || accentColor
                  }
                />
              ))}
            </div>

            {totalPages > 1 ? (
              <nav
                className="mt-10 flex items-center justify-center gap-3 rounded-2xl bg-white ring-1 ring-neutral-200/80 px-4 py-3"
                aria-label="Pagination"
              >
                {page > 1 ? (
                  <Link
                    href={articlesListHref({ page: page - 1, category, query })}
                    rel="prev"
                    className="px-4 py-2 rounded-xl text-sm font-medium ring-1 ring-neutral-200 hover:bg-neutral-50"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="px-4 py-2 rounded-xl text-sm font-medium ring-1 ring-neutral-100 text-neutral-300 cursor-not-allowed">
                    Previous
                  </span>
                )}
                <span className="text-sm text-neutral-600 tabular-nums">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={articlesListHref({ page: page + 1, category, query })}
                    rel="next"
                    className="px-4 py-2 rounded-xl text-sm font-medium ring-1 ring-neutral-200 hover:bg-neutral-50"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="px-4 py-2 rounded-xl text-sm font-medium ring-1 ring-neutral-100 text-neutral-300 cursor-not-allowed">
                    Next
                  </span>
                )}
              </nav>
            ) : null}
          </>
        ) : (
          <div className="text-center py-16 sm:py-20 rounded-2xl bg-white ring-1 ring-neutral-200/80">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">No updates found</h2>
            <p className="text-neutral-600 mb-6 text-sm max-w-sm mx-auto">
              {query || category
                ? 'Try a different search or category.'
                : 'New articles will appear here soon.'}
            </p>
            {(query || category) && (
              <Link href={clearFiltersHref} className="text-sm font-medium text-neutral-900 underline">
                Clear filters
              </Link>
            )}
          </div>
        )}

        {categories.length > 0 ? (
          <div className="mt-10 pt-8 border-t border-neutral-200/80">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4">Browse by category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/articles/category/${cat.slug}`}
                  className="rounded-xl bg-white ring-1 ring-neutral-200/80 px-4 py-3 text-sm font-medium text-neutral-800 hover:ring-neutral-300 hover:shadow-sm transition-all"
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                    style={{ backgroundColor: cat.color || '#737373' }}
                  />
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
