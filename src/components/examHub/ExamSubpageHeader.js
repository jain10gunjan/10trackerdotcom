'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { useExamHub } from '@/context/ExamHubContext';

export default function ExamSubpageHeader({
  title,
  description,
  backHref,
  backLabel = 'Back to hub',
  children,
}) {
  const hub = useExamHub();
  const exam = hub?.exam;
  const categorySlug = hub?.categorySlug;
  const hubHref = categorySlug ? `/${categorySlug}` : '/exams';

  return (
    <header className="mb-5 sm:mb-7">
      <Link
        href={backHref || hubHref}
        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-700 mb-4"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {backLabel}
      </Link>

      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative p-5 sm:p-6 flex items-start gap-4">
          {exam?.image ? (
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-neutral-200 overflow-hidden shrink-0 bg-neutral-100">
              <Image src={exam.image} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl shrink-0">
              {exam?.icon || '📚'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {exam?.name ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {exam.name}
              </p>
            ) : null}
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight mt-0.5">
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{description}</p>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </header>
  );
}
