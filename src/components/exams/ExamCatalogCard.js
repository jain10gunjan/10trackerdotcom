'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, ClipboardList, FileText } from 'lucide-react';
import { mockTestHrefForSlug, practiceHrefForSlug } from '@/lib/platformExams';

export default function ExamCatalogCard({ exam }) {
  const [imageError, setImageError] = useState(false);
  const showImage = exam.image && !imageError;

  return (
    <article className="group rounded-3xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden">
          {showImage ? (
            <Image
              src={exam.image}
              alt=""
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
              {exam.icon}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 truncate">
                {exam.name}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 line-clamp-2 mt-1 leading-relaxed">
                {exam.description}
              </p>
            </div>
            {exam.category ? (
              <span className="hidden sm:inline-flex text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                {exam.category}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-400">
            <FileText className="w-3.5 h-3.5" />
            <span>{(exam.count || 0).toLocaleString()} questions</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={practiceHrefForSlug(exam.slug)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Practice
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={mockTestHrefForSlug(exam.slug)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-800 text-sm font-semibold hover:bg-neutral-50 hover:border-emerald-200 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Mock tests
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
