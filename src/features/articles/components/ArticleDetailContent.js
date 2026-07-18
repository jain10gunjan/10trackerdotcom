import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, Eye, Tag } from 'lucide-react';
import '@/styles/article-content.css';
import ArticleShareButton from '@/features/articles/components/ArticleShareButton';
import ArticleViewTracker from '@/features/articles/components/ArticleViewTracker';
import ArticleEmbeds from '@/features/articles/components/ArticleEmbeds';
import FeaturedArticleImage from '@/features/articles/components/FeaturedArticleImage';
import MobileCategoryPills from '@/features/articles/components/MobileCategoryPills';
import AdSense from '@/components/AdSense';
import {
  ArticleCategorySidebar,
  ArticleFeedCard,
} from '@/features/articles/components/ArticleCategoryFeed';
import {
  formatArticleDate,
  getCategoryMeta,
} from '@/features/articles/lib/categoryMeta';
import {
  fetchAllCategories,
  fetchCategoryRow,
} from '@/features/articles/lib/fetchCategoryArticles';
import { RELATED_PAGE_SIZE, estimateReadMinutes } from '@/features/articles/lib/fetchArticle';
import { normalizeArticleContent } from '@/features/articles/lib/normalizeArticleContent';
import { sanitizeArticleHtml } from '@/features/articles/lib/sanitizeArticleHtml';
import { isNextImageAllowedSrc } from '@/lib/automationImage';
import { resolveFeaturedImageUrl } from '@/lib/resolveFeaturedImageUrl';

function relatedPageHref(slug, page) {
  return page <= 1 ? `/articles/${slug}` : `/articles/${slug}?relatedPage=${page}`;
}

function RelatedPagination({ slug, page, totalPages, totalCount }) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * RELATED_PAGE_SIZE + 1;
  const end = Math.min(page * RELATED_PAGE_SIZE, totalCount);
  const prevHref = page > 1 ? relatedPageHref(slug, page - 1) : null;
  const nextHref = page < totalPages ? relatedPageHref(slug, page + 1) : null;

  return (
    <nav
      className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-neutral-100 bg-neutral-50/50 text-xs"
      aria-label="Related articles pagination"
    >
      <span className="text-neutral-500 tabular-nums">
        {start}–{end} of {totalCount}
      </span>
      <div className="flex items-center gap-1">
        {prevHref ? (
          <Link href={prevHref} className="p-1.5 rounded-lg ring-1 ring-neutral-200 bg-white hover:bg-neutral-50">
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span className="p-1.5 rounded-lg ring-1 ring-neutral-100 text-neutral-300">
            <ChevronLeft className="w-3.5 h-3.5" />
          </span>
        )}
        <span className="px-2 tabular-nums text-neutral-600">{page}/{totalPages}</span>
        {nextHref ? (
          <Link href={nextHref} className="p-1.5 rounded-lg ring-1 ring-neutral-200 bg-white hover:bg-neutral-50">
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span className="p-1.5 rounded-lg ring-1 ring-neutral-100 text-neutral-300">
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </nav>
  );
}

function ArticleMeta({ dateLabel, readMinutes, views, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-neutral-500 ${className}`}>
      <time dateTime={dateLabel}>{dateLabel}</time>
      <span className="text-neutral-300" aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" />
        {readMinutes} min read
      </span>
      <span className="text-neutral-300" aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Eye className="w-3.5 h-3.5" />
        {views.toLocaleString()} views
      </span>
    </div>
  );
}

export default async function ArticleDetailContent({
  article,
  relatedArticles,
  relatedPage,
  totalRelatedPages,
  totalRelatedCount,
  socialEmbeds,
}) {
  const [categoryRow, allCategories] = await Promise.all([
    fetchCategoryRow(article.category).catch(() => null),
    fetchAllCategories().catch(() => []),
  ]);

  const meta = getCategoryMeta(article.category);
  const displayCategory = categoryRow?.name || meta.name;
  const accentColor = categoryRow?.color || '#2563eb';
  const readMinutes = estimateReadMinutes(article.content);
  const dateLabel = formatArticleDate(article.created_at);
  const categoryHref = `/articles/category/${article.category}`;
  const bodyHtml = sanitizeArticleHtml(normalizeArticleContent(article.content));
  const featuredSrc = resolveFeaturedImageUrl(article.featured_image_url);
  const useNextImage = isNextImageAllowedSrc(featuredSrc);
  const views = article.view_count || 0;

  return (
    <div className="min-h-screen bg-neutral-50 pt-20 pb-8 sm:pb-12">
      <ArticleViewTracker articleId={article.id} />

      {/* Top bar */}
      <div className="border-b border-neutral-200/80 bg-white/90 backdrop-blur-sm sticky top-20 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-500 truncate">
              <li>
                <Link href="/" className="hover:text-neutral-900 transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-neutral-300">/</li>
              <li className="truncate">
                <Link href={categoryHref} className="hover:text-neutral-900 transition-colors">
                  {displayCategory}
                </Link>
              </li>
            </ol>
          </nav>
          <Link
            href={categoryHref}
            className="shrink-0 inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Back</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] gap-6 lg:gap-8 items-start">
          {/* Main */}
          <div className="min-w-0">
            <article className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200/70">
              {featuredSrc ? (
                <FeaturedArticleImage
                  src={featuredSrc}
                  alt={article.title}
                  caption={article.featured_image_caption}
                  useNextImage={useNextImage}
                />
              ) : null}

              <header className="px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-neutral-100">
                <Link
                  href={categoryHref}
                  className="inline-flex px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold mb-4 transition-opacity hover:opacity-80"
                  style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
                >
                  {displayCategory}
                </Link>

                <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-neutral-900 tracking-tight leading-[1.2]">
                  {article.title}
                </h1>

                {article.excerpt ? (
                  <p className="mt-3 sm:mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl">
                    {article.excerpt}
                  </p>
                ) : null}

                <ArticleMeta
                  dateLabel={dateLabel}
                  readMinutes={readMinutes}
                  views={views}
                  className="mt-4 sm:mt-5"
                />

                <div className="mt-4 sm:mt-5">
                  <ArticleShareButton
                    articleId={article.id}
                    title={article.title}
                    excerpt={article.excerpt}
                  />
                </div>
              </header>

              <div className="px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
                <div className="article-prose mx-auto max-w-3xl">
                  {socialEmbeds?.length > 0 ? <ArticleEmbeds embeds={socialEmbeds} /> : null}

                  {bodyHtml ? (
                    <div
                      className="article-content"
                      dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                  ) : (
                    <p className="text-neutral-500 text-sm">No content available.</p>
                  )}
                </div>

                <div className="mx-auto max-w-3xl mt-8 sm:mt-10 pt-6 border-t border-neutral-100">
                  <AdSense className="rounded-xl overflow-hidden" />
                </div>

                {Array.isArray(article.tags) && article.tags.length > 0 ? (
                  <div className="mx-auto max-w-3xl mt-8 pt-6 border-t border-neutral-100">
                    <div className="flex items-start gap-2 flex-wrap">
                      <Tag className="w-4 h-4 text-neutral-400 shrink-0 mt-1" aria-hidden />
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mx-auto max-w-3xl mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t border-neutral-100">
                  <Link
                    href={categoryHref}
                    className="inline-flex items-center justify-center sm:justify-start gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-700 ring-1 ring-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    More in {displayCategory}
                  </Link>
                  <ArticleShareButton
                    articleId={article.id}
                    title={article.title}
                    excerpt={article.excerpt}
                  />
                </div>
              </div>
            </article>

            {/* Mobile related — below article */}
            {relatedArticles.length > 0 ? (
              <div className="lg:hidden mt-6 rounded-2xl bg-white ring-1 ring-neutral-200/70 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-100">
                  <h2 className="text-sm font-semibold text-neutral-900">Related articles</h2>
                </div>
                <div>
                  {relatedArticles.map((item) => (
                    <ArticleFeedCard key={item.id} article={item} accentColor={accentColor} />
                  ))}
                </div>
                <RelatedPagination
                  slug={article.slug}
                  page={relatedPage}
                  totalPages={totalRelatedPages}
                  totalCount={totalRelatedCount}
                />
              </div>
            ) : null}
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden lg:block space-y-5 lg:sticky lg:top-[7.25rem]">
            <ArticleCategorySidebar
              categories={allCategories}
              currentSlug={article.category}
            />

            {relatedArticles.length > 0 ? (
              <div className="rounded-2xl bg-white ring-1 ring-neutral-200/70 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-100">
                  <h2 className="text-sm font-semibold text-neutral-900">Related</h2>
                  {totalRelatedPages > 1 ? (
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Page {relatedPage} of {totalRelatedPages}
                    </p>
                  ) : null}
                </div>
                <div>
                  {relatedArticles.map((item) => (
                    <ArticleFeedCard
                      key={item.id}
                      article={item}
                      accentColor={accentColor}
                      compact
                    />
                  ))}
                </div>
                <RelatedPagination
                  slug={article.slug}
                  page={relatedPage}
                  totalPages={totalRelatedPages}
                  totalCount={totalRelatedCount}
                />
              </div>
            ) : null}
          </aside>
        </div>

        {/* Mobile categories */}
        <div className="lg:hidden mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3 px-1">
            Browse categories
          </p>
          <MobileCategoryPills
            categories={allCategories}
            currentSlug={article.category}
            accentColor={accentColor}
          />
        </div>
      </div>
    </div>
  );
}
