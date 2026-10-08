import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, Eye, Star } from 'lucide-react';
import { resolveFeaturedImageUrl } from '@/lib/resolveFeaturedImageUrl';
import { isNextImageAllowedSrc } from '@/lib/automationImage';

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

export default function ArticleListCard({
  article,
  accentColor = '#059669',
  featured = false,
}) {
  const imageSrc = resolveFeaturedImageUrl(article.featured_image_url);
  const useNextImage = isNextImageAllowedSrc(imageSrc);

  if (featured) {
    return (
      <article className="group">
        <Link
          href={`/articles/${article.slug}`}
          className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all hover:border-neutral-300 hover:shadow-md"
        >
          <div className="relative lg:col-span-5 aspect-[16/10] lg:aspect-auto lg:min-h-[280px] overflow-hidden bg-neutral-100">
            {imageSrc ? (
              useNextImage ? (
                <Image
                  src={imageSrc}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  priority
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              )
            ) : (
              <div
                className="flex h-full w-full min-h-[200px] items-center justify-center text-sm font-semibold text-white/90"
                style={{ backgroundColor: accentColor }}
              >
                10Tracker
              </div>
            )}
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              {article.is_featured ? (
                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-100 bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  Featured
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(article.created_at)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {(article.view_count || 0).toLocaleString()}
              </span>
            </div>

            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 leading-snug line-clamp-3 group-hover:text-neutral-700 transition-colors">
              {article.title}
            </h2>

            {article.excerpt ? (
              <p className="mt-3 text-sm sm:text-base text-neutral-600 leading-relaxed line-clamp-3 max-w-2xl">
                {article.excerpt}
              </p>
            ) : null}

            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
              Read article
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group h-full">
      <Link
        href={`/articles/${article.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:border-neutral-300 hover:shadow-md"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
          {imageSrc ? (
            useNextImage ? (
              <Image
                src={imageSrc}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
              />
            )
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-xs font-medium text-white/90"
              style={{ backgroundColor: accentColor }}
            >
              10Tracker
            </div>
          )}
          {article.is_featured ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg border border-amber-100 bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 shadow-sm">
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

          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
            Read
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </article>
  );
}
