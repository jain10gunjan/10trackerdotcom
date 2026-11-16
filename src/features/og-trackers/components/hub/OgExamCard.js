'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { GUEST_BRAND } from '@/features/guest/components/guestMotion';
import { HubIcon } from '@/features/og-trackers/components/hub/iconMap';

export default function OgExamCard({ exam }) {
  const live = exam.liveChapterCount || 0;
  const total = exam.chapterCount || 0;
  const percent = Math.max(0, Math.min(100, Number(exam.percent) || 0));

  return (
    <Link
      href={`/og-trackers/exam/${exam.slug}`}
      data-gsap-item
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] transition-colors hover:border-[#3F5EB9]/40"
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${GUEST_BRAND.blue}, ${GUEST_BRAND.blueBright})`,
        }}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: GUEST_BRAND.blue }}
          >
            <HubIcon name={exam.icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            {exam.isFeatured ? (
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: GUEST_BRAND.blue }}
              >
                Featured
              </p>
            ) : (
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Exam track
              </p>
            )}
            <h2 className="mt-0.5 text-lg sm:text-xl font-bold tracking-tight text-neutral-950 group-hover:text-[#1e2f6b] transition-colors">
              {exam.title}
            </h2>
          </div>
        </div>
      </div>

      {exam.description ? (
        <p className="mt-3 text-sm text-neutral-600 leading-relaxed line-clamp-2">
          {exam.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-neutral-600">
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1">
          {live}/{total || '—'} chapters live
        </span>
        {exam.totalSteps > 0 ? (
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 tabular-nums">
            {exam.totalSteps} steps
          </span>
        ) : null}
      </div>

      <div className="mt-auto pt-5">
        {exam.totalSteps > 0 ? (
          <>
            <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
              <span>Progress</span>
              <span className="tabular-nums font-semibold text-neutral-800">{percent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(percent, percent === 0 ? 3 : percent)}%`,
                  backgroundColor: GUEST_BRAND.blue,
                }}
              />
            </div>
          </>
        ) : (
          <p className="text-xs text-neutral-500">Chapters opening soon — structure is ready.</p>
        )}

        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900 group-hover:text-[#3F5EB9] transition-colors">
          Open chapters
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
