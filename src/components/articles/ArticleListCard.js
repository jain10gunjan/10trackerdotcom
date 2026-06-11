import Link from 'next/link';
import { Calendar, Eye, Star, ArrowUpRight } from 'lucide-react';
import { resolveFeaturedImageUrl } from '@/lib/resolveFeaturedImageUrl';

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ArticleListCard({ article, accentColor = '#2563eb' }) {
  const imageSrc = resolveFeaturedImageUrl(article.featured_image_url);

  return (
    <article className="group h-full">
      <Link
        href={`/articles/${article.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/80 shadow-sm transition-all hover:shadow-md hover:ring-neutral-300/80"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-xs font-medium text-white/90"
              style={{ backgroundColor: accentColor }}
            >
              10Tracker
            </div>
          )}
          {article.is_featured ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 shadow-sm">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              Featured
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(article.created_at)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {(article.view_count || 0).toLocaleString()}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-neutral-700 transition-colors">
            {article.title}
          </h2>

          {article.excerpt ? (
            <p className="mt-2 text-sm text-neutral-500 line-clamp-2 leading-relaxed flex-1">
              {article.excerpt}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          <span
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium transition-colors"
            style={{ color: accentColor }}
          >
            Read article
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </article>
  );
}
