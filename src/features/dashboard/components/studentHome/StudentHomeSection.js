'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Same header language as the guest homepage: blue eyebrow, large title, outline link.
 * No opacity-0 entrance — titles must always paint.
 */
export default function StudentHomeSection({
  eyebrow,
  title,
  description,
  href,
  linkLabel,
  children,
  className = '',
}) {
  return (
    <section className={`scroll-mt-24 ${className}`}>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3F5EB9]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {href && linkLabel ? (
          <Link
            href={href}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:border-[#3F5EB9]/40 hover:bg-[#E8EDF8]/50"
          >
            {linkLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
