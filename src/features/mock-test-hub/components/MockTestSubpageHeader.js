'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function MockTestSubpageHeader({
  backHref,
  backLabel = 'Back to mock tests',
  title,
  description,
}) {
  return (
    <header className="mb-5 sm:mb-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-700 mb-3"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {backLabel}
      </Link>
      {title ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1.5 text-sm text-neutral-500">{description}</p>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
