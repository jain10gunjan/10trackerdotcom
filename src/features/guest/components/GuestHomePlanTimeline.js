'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock, Gift, Map } from 'lucide-react';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';
import { APP_GUTTER } from '@/lib/appChrome';
import {
  GUEST_BRAND,
  easeOut,
  useGuestMotion,
  useReveal,
  revealProps,
  staggerContainer,
  staggerItem,
} from '@/features/guest/components/guestMotion';

function DayPath({ totalDays = 0, freePreviewDays = 0, animate, show }) {
  const days = Math.min(Math.max(totalDays || 7, 5), 12);
  const free = Math.min(freePreviewDays || 0, days);

  return (
    <div className="mt-4 flex items-center gap-1 overflow-hidden" aria-hidden>
      {Array.from({ length: days }).map((_, i) => (
        <motion.span
          key={i}
          initial={animate ? { scaleY: 0.3, opacity: 0 } : false}
          animate={
            show || !animate
              ? { scaleY: 1, opacity: 1 }
              : { scaleY: 0.3, opacity: 0 }
          }
          transition={{ duration: 0.35, delay: 0.04 * i, ease: easeOut }}
          className="h-2 flex-1 rounded-full origin-bottom"
          style={{
            backgroundColor:
              i < free ? GUEST_BRAND.blue : i === free && free > 0 ? `${GUEST_BRAND.blue}55` : '#E5E7EB',
          }}
        />
      ))}
    </div>
  );
}

function PlanCard({ roadmap, index, animate, show }) {
  const href = `/roadmaps/${roadmap.slug}`;

  return (
    <motion.article
      custom={index}
      variants={staggerItem}
      whileHover={animate ? { y: -4 } : undefined}
      transition={{ duration: 0.22, ease: easeOut }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.3)]"
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
          <Map className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Plan {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="mt-0.5 text-base sm:text-lg font-bold tracking-tight text-neutral-950 leading-snug group-hover:text-[#1e2f6b] transition-colors">
            {roadmap.title}
          </h3>
        </div>
      </div>

      {roadmap.description ? (
        <p className="mt-3 text-sm text-neutral-600 line-clamp-2 leading-relaxed">
          {roadmap.description}
        </p>
      ) : null}

      <DayPath
        totalDays={roadmap.totalDays}
        freePreviewDays={roadmap.freePreviewDays}
        animate={animate}
        show={show}
      />

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-semibold text-neutral-800">
          ₹{roadmap.priceInr} · one-time
        </span>
        {roadmap.totalDays > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-neutral-600">
            <Calendar className="h-3 w-3" style={{ color: GUEST_BRAND.blue }} />
            {roadmap.totalDays} days
          </span>
        ) : null}
        {roadmap.freePreviewDays > 0 ? (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium"
            style={{
              borderColor: `${GUEST_BRAND.blue}33`,
              backgroundColor: GUEST_BRAND.soft,
              color: '#1e2f6b',
            }}
          >
            <Gift className="h-3 w-3" />
            {roadmap.freePreviewDays} free
          </span>
        ) : null}
      </div>

      <Link
        href={href}
        className="mt-auto pt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900 group-hover:text-[#3F5EB9] transition-colors"
      >
        View roadmap
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.article>
  );
}

function ComingSoon() {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 sm:p-10 text-center shadow-sm">
      <div
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border"
        style={{
          borderColor: `${GUEST_BRAND.blue}33`,
          backgroundColor: GUEST_BRAND.soft,
        }}
      >
        <Map className="h-6 w-6" style={{ color: GUEST_BRAND.blue }} aria-hidden />
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        Coming soon
      </span>
      <h3 className="mt-4 text-lg font-bold text-neutral-900">OG Trackers</h3>
      <p className="mt-2 text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
        Structured paths with YouTube lessons and coding practice will launch here. Until then,
        keep grinding exams and mocks.
      </p>
      <Link
        href="/exams"
        className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: GUEST_BRAND.blue }}
      >
        Browse exams
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function GuestHomePlanTimeline({ roadmaps = [] }) {
  const ref = useRef(null);
  const { animate } = useGuestMotion();
  const show = useReveal(ref, { animate, amount: 0.2 });
  const plans = roadmaps.slice(0, 3);

  return (
    <section id="roadmaps" ref={ref} className="scroll-mt-24 pb-14 sm:pb-16">
      <div className={`max-w-7xl mx-auto ${APP_GUTTER}`}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8">
          <motion.div {...revealProps(show, animate)}>
            <p
              className="text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: GUEST_BRAND.blue }}
            >
              Study plans
            </p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              {SHOW_OG_TRACKERS
                ? 'Structured roadmaps for serious prep'
                : 'Study plans — coming soon'}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-xl leading-relaxed">
              {SHOW_OG_TRACKERS
                ? 'YouTube lessons + coding practice on a day path. Preview free days, then unlock — progress syncs from the Chrome extension.'
                : 'Day-by-day learning paths with videos and coding practice are on the way. Practice exams are live today.'}
            </p>
          </motion.div>
          {SHOW_OG_TRACKERS ? (
            <motion.div {...revealProps(show, animate, 0.08)}>
              <Link
                href="/og-trackers"
                className="inline-flex items-center gap-2 shrink-0 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:border-[#3F5EB9]/40 hover:bg-[#E8EDF8]/50 transition-colors shadow-sm"
              >
                View all plans
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ) : null}
        </div>

        {!SHOW_OG_TRACKERS ? (
          <ComingSoon />
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white py-14 text-center text-sm text-neutral-500">
            Plans coming soon — check back shortly.
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
            variants={staggerContainer(show, animate)}
            initial="hidden"
            animate={show || !animate ? 'show' : 'hidden'}
          >
            {plans.map((roadmap, i) => (
              <PlanCard
                key={roadmap.slug}
                roadmap={roadmap}
                index={i}
                animate={animate}
                show={show}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
