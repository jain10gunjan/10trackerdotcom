'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Briefcase, Cpu, Route, Sparkles } from 'lucide-react';
import { GUEST_BRAND } from '@/features/guest/components/guestMotion';
import { homePrimaryBtn } from '@/features/dashboard/lib/studentHomeBrand';

const TRACKS = [
  {
    slug: 'gate-cse',
    title: 'GATE CSE',
    meta: 'Exam track · chapters',
    description: 'Watch, practice, and mock on one chapter checklist.',
    icon: Cpu,
    href: '/og-trackers/exam/gate-cse',
  },
  {
    slug: 'dsa',
    title: 'DSA',
    meta: 'Interview fundamentals',
    description: 'Data structures and algorithms paths for interviews.',
    icon: BookOpen,
    href: '/og-trackers/exam/dsa',
  },
  {
    slug: 'placement',
    title: 'Placement',
    meta: 'Coding + aptitude',
    description: 'Interview-ready loops across aptitude and coding.',
    icon: Briefcase,
    href: '/og-trackers/exam/placement',
  },
];

function TrackCard({ track, index }) {
  const Icon = track.icon;
  return (
    <Link
      href={track.href}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.3)] transition-colors hover:border-[#3F5EB9]/40 sm:p-6"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-90"
        style={{
          background: `linear-gradient(90deg, ${GUEST_BRAND.blue}, ${GUEST_BRAND.blueBright})`,
        }}
        aria-hidden
      />
      <div className="flex items-start gap-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: GUEST_BRAND.blue }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Track {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="mt-0.5 text-base font-bold leading-snug tracking-tight text-neutral-950 transition-colors group-hover:text-[#1e2f6b] sm:text-lg">
            {track.title}
          </h3>
          <p className="mt-0.5 text-xs text-neutral-500">{track.meta}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-neutral-600">
        {track.description}
      </p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-neutral-900 transition-colors group-hover:text-[#3F5EB9]">
        Open exam track
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function UserTrackCard() {
  return (
    <Link
      href="/og-trackers?track=user"
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-950 p-5 text-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 70% 80% at 100% 0%, #3F5EB966 0%, transparent 55%)',
        }}
        aria-hidden
      />
      <div className="relative min-w-0">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-200">
          <Sparkles className="h-3.5 w-3.5" style={{ color: '#8BA3E8' }} />
          User track
        </span>
        <h3 className="mt-3 text-base font-bold tracking-tight sm:text-lg">
          Build a private path from a playlist
        </h3>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-neutral-300">
          Your AI playlist trackers live in User track — separate from shared Exam track paths.
        </p>
      </div>
      <span className="relative inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-white">
        Open User track
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/** Signed-in OG Trackers promo — no paid roadmap catalog / extension push. */
export default function DashboardMyRoadmaps() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {TRACKS.map((track, i) => (
          <TrackCard key={track.slug} track={track} index={i} />
        ))}
      </div>
      <UserTrackCard />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3.5 shadow-sm sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: GUEST_BRAND.soft, color: GUEST_BRAND.blue }}
          >
            <Route className="h-4 w-4" />
          </span>
          <p className="text-sm text-neutral-600">
            Prefer the full hub? Browse every live chapter path in one place.
          </p>
        </div>
        <Link href="/og-trackers" className={`${homePrimaryBtn} w-full sm:w-auto`}>
          Explore OG Trackers
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
