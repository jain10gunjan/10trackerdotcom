'use client';

import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import OgExamCard from '@/features/og-trackers/components/hub/OgExamCard';
import { GUEST_BRAND } from '@/features/guest/components/guestMotion';

/**
 * Exam track — public catalog only (exams → chapters). Never mixes private user paths.
 */
export default function OgExamTrackPanel({
  exams = [],
  paths = [],
  loading = false,
  error = null,
  setupHint = null,
  hierarchyReady = false,
  gridRef = null,
}) {
  const showExams = exams.length > 0;
  // Catalog paths with no exam hierarchy still belong in Exam track.
  const orphanPaths = !showExams ? paths : [];

  return (
    <div>
      <div className="mb-6">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: GUEST_BRAND.blue }}
        >
          Exam track
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Official exam trackers
        </h2>
        <p className="mt-2 max-w-xl text-sm text-neutral-600">
          Shared for everyone. Open an exam, pick a chapter, then follow lectures, practice, and
          mocks.
        </p>
      </div>

      {setupHint ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {setupHint}
          {!hierarchyReady ? (
            <span className="mt-1 block text-amber-800/80">
              Also run <code className="text-xs">setup_og_exams_chapters.sql</code> for Exam →
              Chapter structure.
            </span>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-neutral-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" style={{ color: GUEST_BRAND.blue }} />
          Loading Exam track…
        </div>
      ) : showExams ? (
        <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {exams.map((exam) => (
            <OgExamCard key={exam.id || exam.slug} exam={exam} />
          ))}
        </div>
      ) : orphanPaths.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {orphanPaths.map((path) => (
            <Link
              key={path.slug}
              href={`/og-trackers/${path.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] transition-colors hover:border-[#3F5EB9]/40 sm:p-6"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Exam track
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-neutral-950 group-hover:text-[#1e2f6b]">
                {path.title}
              </h3>
              {path.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{path.description}</p>
              ) : null}
              <p className="mt-auto pt-4 text-xs tabular-nums text-neutral-500">
                {path.totalResources || 0} steps
                {typeof path.percent === 'number' ? ` · ${path.percent}%` : ''}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center text-sm text-neutral-600">
          No exams in Exam track yet. Publish GATE CSE chapters to seed this list.
        </div>
      )}
    </div>
  );
}
