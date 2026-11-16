'use client';

import Link from 'next/link';
import { ArrowRight, CircleDashed, Lock } from 'lucide-react';
import { GUEST_BRAND } from '@/features/guest/components/guestMotion';
import { HubIcon } from '@/features/og-trackers/components/hub/iconMap';

export default function OgChapterCard({ chapter }) {
  const live = chapter.status === 'live' && chapter.path;
  const locked = Boolean(chapter.path?.locked);
  const percent = Math.max(0, Math.min(100, Number(chapter.path?.percent) || 0));
  const href = live ? `/og-trackers/${chapter.path.slug}` : null;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              live ? 'text-white' : 'text-neutral-500 bg-neutral-100'
            }`}
            style={live ? { backgroundColor: GUEST_BRAND.blue } : undefined}
          >
            <HubIcon name={chapter.icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Chapter
            </p>
            <h3 className="mt-0.5 text-base sm:text-lg font-bold tracking-tight text-neutral-950 leading-snug">
              {chapter.title}
            </h3>
          </div>
        </div>
        {live ? (
          locked ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold shrink-0"
              style={{
                borderColor: `${GUEST_BRAND.blue}33`,
                backgroundColor: GUEST_BRAND.soft,
                color: '#1e2f6b',
              }}
            >
              <Lock className="h-3 w-3" />
              Premium
            </span>
          ) : (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800 shrink-0">
              Live
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-[10px] font-semibold text-neutral-600 shrink-0">
            <CircleDashed className="h-3 w-3" />
            Soon
          </span>
        )}
      </div>

      {chapter.description ? (
        <p className="mt-3 text-sm text-neutral-600 leading-relaxed line-clamp-2">
          {chapter.description}
        </p>
      ) : null}

      <div className="mt-auto pt-5">
        {live ? (
          <>
            <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
              <span className="tabular-nums">
                {chapter.path.totalResources} steps
                {chapter.path.completedResources > 0
                  ? ` · ${chapter.path.completedResources} done`
                  : ''}
              </span>
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
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900 group-hover:text-[#3F5EB9] transition-colors">
              {locked ? 'Unlock tracker' : percent > 0 ? 'Continue tracker' : 'Start tracker'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </>
        ) : (
          <p className="text-sm text-neutral-500">
            Structure ready — YouTube & practice land here when content is added.
          </p>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        data-gsap-item
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] transition-colors hover:border-[#3F5EB9]/40"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      data-gsap-item
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-dashed border-neutral-200 bg-white/80 p-5 sm:p-6"
    >
      {inner}
    </div>
  );
}
