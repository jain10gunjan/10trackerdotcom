'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, FileText } from 'lucide-react';
import { practiceHrefForSlug } from '@/lib/platformExams';

export default function GuestExamCard({ exam, compact = false }) {
  const [imageError, setImageError] = useState(false);
  const isActive = exam.active !== false;
  const showImage = exam.image && !imageError;
  const href = isActive ? practiceHrefForSlug(exam.slug) : '#';

  return (
    <Link
      href={href}
      aria-disabled={!isActive}
      onClick={(e) => {
        if (!isActive) e.preventDefault();
      }}
      className={`group block rounded-2xl border bg-white shadow-sm transition-all duration-200 ${
        compact ? 'p-3' : 'p-4'
      } ${
        isActive
          ? 'border-neutral-200 hover:border-emerald-200 hover:shadow-md'
          : 'border-neutral-200 bg-neutral-50/70 cursor-not-allowed opacity-70'
      }`}
    >
      <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
        <div
          className={`${compact ? 'w-11 h-11 rounded-lg' : 'w-14 h-14 rounded-xl'} bg-neutral-100 flex-shrink-0 overflow-hidden`}
        >
          {showImage ? (
            <Image
              src={exam.image}
              alt=""
              width={56}
              height={56}
              className={`w-full h-full object-cover transition-transform duration-200 ${
                isActive ? 'group-hover:scale-105' : 'grayscale'
              }`}
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">
              {exam.icon}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-semibold truncate ${
                compact ? 'text-sm' : 'text-sm'
              } ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`}
            >
              {exam.name}
            </h3>
            {!isActive ? (
              <span className="text-[10px] font-semibold text-neutral-400 bg-white border border-neutral-200 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                Soon
              </span>
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            )}
          </div>
          {!compact && (
            <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
              {isActive ? exam.description || 'Topic-wise practice with solutions' : 'Coming soon'}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400">
            <FileText className="w-3 h-3" />
            <span>{(exam.count || 0).toLocaleString()} questions</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
