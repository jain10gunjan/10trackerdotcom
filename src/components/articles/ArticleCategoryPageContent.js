import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Search } from 'lucide-react';
import ArticleCategoryPagination, {
  ArticleCategorySidebar,
  ArticleFeaturedHero,
} from '@/components/articles/ArticleCategoryFeed';
import ArticleListCard from '@/components/articles/ArticleListCard';
import MobileCategoryPills from '@/components/articles/MobileCategoryPills';
import {
  ARTICLE_PAGE_SIZE,
  getCategoryMeta,
  safeArticlePage,
  sanitizeSearchQuery,
} from '@/lib/articles/categoryMeta';
import {
  fetchAllCategories,
  fetchCategoryArticles,
  fetchCategoryRow,
} from '@/lib/articles/fetchCategoryArticles';

function buildCanonical(siteUrl, cate, page, query) {
  const base = `${siteUrl}/article/${cate}`;
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function generateArticleCategoryMetadata(cate, page = 1, query = '') {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com';
  const meta = getCategoryMeta(cate);
  const dbCat = await fetchCategoryRow(cate).catch(() => null);
  const displayName = dbCat?.name || meta.name;
  const description = meta.description;

  const title =
    page > 1
      ? `${displayName} — Page ${page} | 10Tracker`
      : `${displayName} | 10Tracker`;
  const canonical = buildCanonical(siteUrl, cate, page, query);

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName: '10Tracker',
      images: [{ url: `${siteUrl}/10tracker.png`, width: 1200, height: 630, alt: '10Tracker' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/10tracker.png`],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ArticleCategoryPageContent({ cate, searchParams }) {
  const resolved = await searchParams;
  const page = safeArticlePage(resolved?.page);
  const query = sanitizeSearchQuery(resolved?.q);
  const basePath = `/article/${cate}`;
  const meta = getCategoryMeta(cate);

  let categoryRow = null;
  let allCategories = [];
  let articles = [];
  let totalCount = 0;

  try {
    [categoryRow, allCategories] = await Promise.all([
      fetchCategoryRow(cate),
      fetchAllCategories().catch(() => []),
    ]);
    const result = await fetchCategoryArticles({
      category: cate,
      page,
      pageSize: ARTICLE_PAGE_SIZE,
      query,
    });
    articles = result.articles;
    totalCount = result.totalCount;
  } catch (err) {
    console.error('[article category]', cate, err);
  }

  const displayName = categoryRow?.name || meta.name;
  const accentColor = categoryRow?.color || '#2563eb';
  const totalPages = Math.max(1, Math.ceil(totalCount / ARTICLE_PAGE_SIZE));

  if (page > totalPages && totalCount > 0) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (totalPages > 1) params.set('page', String(totalPages));
    const qs = params.toString();
    redirect(qs ? `${basePath}?${qs}` : basePath);
  }

  const safePage = page;
  const showFeatured =
    safePage === 1 && !query && articles.length > 0 && articles[0].is_featured;
  const listArticles = showFeatured ? articles.slice(1) : articles;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: displayName,
    description: meta.description,
    url: buildCanonical(siteUrl, cate, safePage, query),
    isPartOf: { '@type': 'WebSite', name: '10Tracker', url: siteUrl },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalCount,
      itemListElement: articles.slice(0, 10).map((a, i) => ({
        '@type': 'ListItem',
        position: (safePage - 1) * ARTICLE_PAGE_SIZE + i + 1,
        url: `${siteUrl}/articles/${a.slug}`,
        name: a.title,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div
        className="border-b border-neutral-200/80 bg-white"
        style={{
          background: `linear-gradient(135deg, ${accentColor}08 0%, white 45%, white 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All updates
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3"
                style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
              >
                {displayName}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
                {displayName}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-2xl leading-relaxed">
                {meta.description}
              </p>
              <p className="mt-3 text-sm text-neutral-500 tabular-nums">
                {totalCount} {totalCount === 1 ? 'article' : 'articles'}
                {totalPages > 1 ? ` · Page ${safePage} of ${totalPages}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-6 lg:gap-8 items-start">
          <div className="min-w-0 space-y-5">
            {/* Search */}
            <div className="rounded-2xl bg-white ring-1 ring-neutral-200/80 p-4 sm:p-5 shadow-sm">
              <form action={basePath} method="get" className="flex flex-col sm:flex-row gap-3" role="search">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder={`Search in ${displayName}…`}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl ring-1 ring-neutral-200 bg-neutral-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:bg-white transition-colors"
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
                  Results for &ldquo;{query}&rdquo; —{' '}
                  <Link href={basePath} className="font-medium text-neutral-900 underline">
                    show all
                  </Link>
                </p>
              ) : null}
            </div>

            {articles.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-white ring-1 ring-neutral-200/80">
                <p className="text-neutral-900 font-semibold">No articles found</p>
                <p className="text-sm text-neutral-500 mt-1">
                  {query ? 'Try a different search term.' : 'New stories will appear here soon.'}
                </p>
                <Link
                  href="/articles"
                  className="inline-block mt-5 text-sm font-semibold text-neutral-900 underline"
                >
                  Browse all updates
                </Link>
              </div>
            ) : (
              <>
                {showFeatured ? (
                  <div className="rounded-2xl overflow-hidden ring-1 ring-neutral-200/80 shadow-sm bg-white">
                    <ArticleFeaturedHero article={articles[0]} accentColor={accentColor} />
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {listArticles.map((article) => (
                    <ArticleListCard
                      key={article.id}
                      article={article}
                      accentColor={accentColor}
                    />
                  ))}
                </div>

                <ArticleCategoryPagination
                  basePath={basePath}
                  page={safePage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={ARTICLE_PAGE_SIZE}
                  query={query}
                />
              </>
            )}
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-24">
            <ArticleCategorySidebar categories={allCategories} currentSlug={cate} />
          </aside>
        </div>

        <div className="lg:hidden mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
            Categories
          </p>
          <MobileCategoryPills
            categories={allCategories}
            currentSlug={cate}
            accentColor={accentColor}
          />
        </div>
      </div>
    </div>
  );
}
