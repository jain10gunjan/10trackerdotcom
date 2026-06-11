'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, ChevronRight, Newspaper } from 'lucide-react';

function SectionHeader({ title, subtitle, href, hrefLabel }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">{title}</h2>
        {subtitle ? <p className="text-sm text-neutral-500 mt-1">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900 shrink-0"
        >
          {hrefLabel || 'View all'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      ) : null}
    </div>
  );
}

export default function GuestArticleFeed({ categorySections = [] }) {
  const sections = (categorySections || []).filter((s) => s?.items?.length > 0);
  if (!sections.length) return null;

  return (
    <section className="py-12 md:py-16 bg-white border-y border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Latest updates"
          subtitle="Fresh articles from 10Tracker, grouped by category"
          href="/articles"
          hrefLabel="All articles"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sections.map((section) => (
            <div
              key={section.slug}
              className="rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-4 sm:px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                    style={{
                      backgroundColor: `${section.color}20`,
                      color: section.color,
                    }}
                  >
                    {section.name}
                  </span>
                  <span className="text-xs text-neutral-500 truncate">
                    {section.items.length} latest
                  </span>
                </div>
                <Link
                  href={`/articles/category/${section.slug}`}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 shrink-0"
                >
                  View all
                </Link>
              </div>

              <div className="px-4 sm:px-5 divide-y divide-neutral-100">
                {section.items.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={`/articles/${item.slug}`}
                    className="group flex items-start gap-3 py-3.5"
                  >
                    <div className="w-16 h-12 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200">
                      <img
                        src={item.featuredImageUrl || '/10tracker.png'}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          if (e?.currentTarget?.src?.includes('/10tracker.png')) return;
                          e.currentTarget.src = '/10tracker.png';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 group-hover:text-emerald-800 line-clamp-2 leading-snug">
                        {item.title}
                        {item.isFeatured ? (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 align-middle">
                            Featured
                          </span>
                        ) : null}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        <span className="inline-flex items-center gap-1 text-neutral-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.dateLabel}
                        </span>
                        <span className="text-neutral-300">•</span>
                        <span className="inline-flex items-center gap-1 text-neutral-400">
                          <Newspaper className="w-3.5 h-3.5" />
                          {section.name}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 flex-shrink-0 text-neutral-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all mt-1" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 sm:hidden text-center">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700"
          >
            Browse all articles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
