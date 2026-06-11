'use client';

import Link from 'next/link';

export default function MobileCategoryPills({ categories, currentSlug, accentColor = '#2563eb' }) {
  if (!categories?.length) return null;

  return (
    <div className="relative -mx-4 sm:mx-0">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-neutral-50 to-transparent z-10 sm:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-neutral-50 to-transparent z-10 sm:hidden" />
      <div className="flex gap-2 overflow-x-auto px-4 sm:px-0 pb-1 snap-x snap-mandatory scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => {
          const active = cat.slug === currentSlug;
          const color = cat.color || accentColor;
          return (
            <Link
              key={cat.slug}
              href={`/articles/category/${cat.slug}`}
              className={`snap-start shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                active
                  ? 'text-white shadow-sm'
                  : 'bg-white text-neutral-700 ring-1 ring-neutral-200/80 hover:ring-neutral-300'
              }`}
              style={active ? { backgroundColor: color } : undefined}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
