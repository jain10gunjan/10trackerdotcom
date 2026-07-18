import Link from 'next/link';
import { ChevronLeft, ChevronRight, Eye, Star } from 'lucide-react';
import { formatArticleDate, formatArticleDateParts } from '@/features/articles/lib/categoryMeta';
import { resolveFeaturedImageUrl } from '@/lib/resolveFeaturedImageUrl';

function pageHref(basePath, page, query) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function ArticleCategoryPagination({
  basePath,
  page,
  totalPages,
  totalCount,
  pageSize,
  query = '',
  embedded = false,
}) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    let lo = Math.max(2, page - 1);
    let hi = Math.min(totalPages - 1, page + 1);
    if (page <= 3) hi = Math.min(5, totalPages - 1);
    if (page >= totalPages - 2) lo = Math.max(2, totalPages - 4);
    if (lo > 2) pages.push('…');
    for (let i = lo; i <= hi; i++) pages.push(i);
    if (hi < totalPages - 1) pages.push('…');
    pages.push(totalPages);
  }

  const prevHref = page > 1 ? pageHref(basePath, page - 1, query) : null;
  const nextHref = page < totalPages ? pageHref(basePath, page + 1, query) : null;

  return (
    <nav
      className={
        embedded
          ? 'px-4 py-3 border-t border-neutral-100 bg-neutral-50/50'
          : 'mt-10 rounded-2xl bg-white ring-1 ring-neutral-200/80 px-4 sm:px-6 py-4'
      }
      aria-label="Pagination"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-neutral-500 tabular-nums">
          <span className="font-medium text-neutral-800">{start}–{end}</span> of{' '}
          <span className="font-medium text-neutral-800">{totalCount}</span>
        </p>

        <div className="flex items-center gap-1.5">
          {prevHref ? (
            <Link
              href={prevHref}
              rel="prev"
              aria-label="Previous page"
              className="p-2 rounded-xl ring-1 ring-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          ) : (
            <span className="p-2 rounded-xl ring-1 ring-neutral-100 bg-neutral-50 text-neutral-300 cursor-not-allowed">
              <ChevronLeft className="w-5 h-5" />
            </span>
          )}

          <div className="hidden sm:flex items-center gap-1">
            {pages.map((p, i) =>
              p === '…' ? (
                <span key={`e-${i}`} className="px-2 text-neutral-400 select-none">
                  …
                </span>
              ) : (
                <Link
                  key={p}
                  href={pageHref(basePath, p, query)}
                  aria-current={p === page ? 'page' : undefined}
                  className={`min-w-[2.5rem] h-9 px-2 flex items-center justify-center rounded-xl text-sm font-medium tabular-nums transition-colors ${
                    p === page
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 ring-1 ring-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  {p}
                </Link>
              )
            )}
          </div>

          <span className="sm:hidden px-3 py-1.5 text-sm font-medium text-neutral-700 tabular-nums">
            {page} / {totalPages}
          </span>

          {nextHref ? (
            <Link
              href={nextHref}
              rel="next"
              aria-label="Next page"
              className="p-2 rounded-xl ring-1 ring-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          ) : (
            <span className="p-2 rounded-xl ring-1 ring-neutral-100 bg-neutral-50 text-neutral-300 cursor-not-allowed">
              <ChevronRight className="w-5 h-5" />
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}

export function ArticleFeedCard({ article, accentColor = '#2563eb', compact = false }) {
  const date = formatArticleDate(article.created_at);
  const { day, month, year } = formatArticleDateParts(article.created_at);
  const thumb = resolveFeaturedImageUrl(article.featured_image_url);

  return (
    <article className="border-b border-neutral-100 last:border-0">
      <Link
        href={`/articles/${article.slug}`}
        className={`group flex gap-3 hover:bg-neutral-50/90 transition-colors ${
          compact ? 'px-3 py-3' : 'px-4 py-3.5'
        }`}
      >
        {thumb ? (
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-neutral-200/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white"
            style={{ backgroundColor: accentColor }}
          >
            News
          </div>
        )}

        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {article.is_featured ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Featured
              </span>
            ) : null}
            <span className="text-[11px] text-neutral-400 tabular-nums sm:hidden">{date}</span>
          </div>

          <h2 className="text-[13px] sm:text-sm font-semibold text-neutral-900 leading-snug group-hover:text-neutral-600 transition-colors line-clamp-2">
            {article.title}
          </h2>

          {!compact && article.excerpt ? (
            <p className="mt-1 text-xs text-neutral-500 line-clamp-2 leading-relaxed hidden sm:block">
              {article.excerpt}
            </p>
          ) : null}

          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-neutral-400">
            <span className="hidden sm:inline tabular-nums">
              {month} {day}, {year}
            </span>
            <span className="hidden sm:inline text-neutral-300">·</span>
            <span className="inline-flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {(article.view_count || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 shrink-0 self-center transition-colors" />
      </Link>
    </article>
  );
}

export function ArticleFeaturedHero({ article, accentColor = '#171717' }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block border-b border-neutral-200 bg-gradient-to-br from-neutral-50 to-white"
    >
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide text-white mb-3"
          style={{ backgroundColor: accentColor }}
        >
          <Star className="w-3 h-3 fill-white" />
          Top story
        </span>
        <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 leading-tight group-hover:text-neutral-600 transition-colors">
          {article.title}
        </h2>
        {article.excerpt ? (
          <p className="mt-3 text-sm sm:text-base text-neutral-600 line-clamp-3 leading-relaxed max-w-3xl">
            {article.excerpt}
          </p>
        ) : null}
        <p className="mt-4 text-xs text-neutral-500">
          {formatArticleDate(article.created_at)} · {(article.view_count || 0).toLocaleString()} views
        </p>
      </div>
    </Link>
  );
}

export function ArticleCategorySidebar({ categories, currentSlug }) {
  if (!categories?.length) return null;

  return (
    <div className="rounded-2xl bg-white ring-1 ring-neutral-200/80 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          Categories
        </h2>
      </div>
      <ul className="p-2 max-h-[min(420px,50vh)] overflow-y-auto [scrollbar-width:thin]">
        {categories.map((cat) => {
          const active = cat.slug === currentSlug;
          const color = cat.color || '#2563eb';
          return (
            <li key={cat.slug}>
              <Link
                href={`/articles/category/${cat.slug}`}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors ${
                  active ? 'font-semibold' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: `${color}10`,
                        color,
                        boxShadow: `inset 3px 0 0 ${color}`,
                      }
                    : undefined
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color || '#a3a3a3' }}
                  aria-hidden
                />
                <span className="truncate">{cat.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
