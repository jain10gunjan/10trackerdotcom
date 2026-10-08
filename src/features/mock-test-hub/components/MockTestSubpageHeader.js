'use client';

import Link from 'next/link';
import { ChevronLeft, Sparkles } from 'lucide-react';

export default function MockTestSubpageHeader({
  backHref,
  backLabel = 'Back to mock tests',
  title,
  description,
}) {
  return (
    <header className="mb-4 sm:mb-5">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-3 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {backLabel}
      </Link>
      {title ? (
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.07),transparent_45%)] pointer-events-none" />
          <div className="relative px-4 sm:px-5 py-4">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              Mock test
            </span>
            <h1 className="mt-2 text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight leading-tight">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 text-sm text-neutral-500 leading-snug">{description}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
