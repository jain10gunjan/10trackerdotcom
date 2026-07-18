'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export function getPracticeHubHref(examcategory) {
  if (!examcategory) return '/exams';
  return `/${examcategory}`;
}

export default function MockTestBreadcrumb({ examcategory, categoryLabel, current }) {
  const hubHref = getPracticeHubHref(examcategory);
  const label = categoryLabel || (examcategory || '').replace(/-/g, ' ').toUpperCase();

  return (
    <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-neutral-500">
        <li>
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-neutral-900 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        <li className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <Link href={hubHref} className="hover:text-neutral-900 transition-colors font-medium">
            {label}
          </Link>
        </li>
        <li className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <Link
            href={`/mock-test/${examcategory}`}
            className="hover:text-neutral-900 transition-colors"
          >
            Mock tests
          </Link>
        </li>
        {current ? (
          <li className="flex items-center gap-1.5 min-w-0">
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" />
            <span className="text-neutral-900 font-medium truncate max-w-[180px] sm:max-w-xs">
              {current}
            </span>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
