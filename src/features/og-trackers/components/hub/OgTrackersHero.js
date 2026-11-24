'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, GraduationCap, Sparkles } from 'lucide-react';
import OgHeroVisual from '@/features/og-trackers/components/hub/OgHeroVisual';
import { GUEST_BRAND as BRAND } from '@/features/guest/components/guestMotion';
import { APP_GUTTER, APP_NAV_CONTENT_OFFSET } from '@/lib/appChrome';

const easeOut = [0.22, 1, 0.36, 1];

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

export default function OgTrackersHero({
  loading,
  user,
  featured,
  startHref,
  metrics,
  onOpenUserTrack,
}) {
  const mounted = useMounted();
  const prefersReduced = useReducedMotion();
  const animate = mounted && !prefersReduced;

  const enter = (delay = 0) =>
    animate
      ? {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: easeOut },
        }
      : { initial: false, animate: { opacity: 1, y: 0 } };

  const previewHref = featured?.slug
    ? `/og-trackers/exam/${featured.slug}`
    : '/og-trackers?track=exam';

  return (
    <section
      className="relative overflow-hidden pb-10 sm:pb-12"
      style={{ paddingTop: APP_NAV_CONTENT_OFFSET }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 85% 15%, #E8EDF8 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 10% 30%, #F0F4FF 0%, transparent 50%), linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 55%, #F5F5F5 100%)',
          }}
        />
      </div>

      <div className={`relative max-w-7xl mx-auto ${APP_GUTTER} pt-5 sm:pt-8 md:pt-9 lg:pt-10`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 md:items-center">
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left">
            <motion.p
              {...enter(0)}
              className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500"
            >
              OG Trackers
            </motion.p>

            <motion.h1
              {...enter(0.05)}
              className="mt-3 text-[clamp(2.1rem,6.5vw,3.25rem)] font-black tracking-tight text-neutral-950 leading-[1.02] max-w-md"
            >
              Exam track and User track.
            </motion.h1>

            <motion.p
              {...enter(0.12)}
              className="mt-4 text-sm sm:text-[15px] text-neutral-600 leading-relaxed max-w-md"
            >
              Shared chapter paths in Exam track. Private playlist trackers in User track. Watch,
              practice, and mock on one checklist.
            </motion.p>

            <motion.div
              {...enter(0.2)}
              className="mt-5 flex w-full max-w-md md:max-w-none flex-col sm:flex-row gap-2.5 justify-center md:justify-start"
            >
              {startHref ? (
                <Link
                  href={startHref}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99]"
                  style={{
                    backgroundColor: BRAND.blue,
                    boxShadow: `0 12px 32px -10px ${BRAND.blue}99`,
                  }}
                >
                  <GraduationCap className="h-4 w-4" />
                  {featured ? `Open ${featured.title}` : 'Open Exam track'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <span
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white/90"
                  style={{ backgroundColor: BRAND.blue }}
                >
                  Loading…
                </span>
              )}
              <button
                type="button"
                onClick={onOpenUserTrack}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
              >
                <Sparkles className="h-4 w-4" style={{ color: BRAND.blue }} />
                Open User track
              </button>
            </motion.div>

            {user ? (
              <motion.div {...enter(0.26)} className="mt-3">
                <Link
                  href="/og-trackers/ai"
                  className="inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: BRAND.blue }}
                >
                  <Sparkles className="h-4 w-4" />
                  Build from a playlist
                </Link>
              </motion.div>
            ) : (
              <motion.p {...enter(0.26)} className="mt-3 text-xs text-neutral-500 max-w-md">
                Sign in to save progress and open User track.
              </motion.p>
            )}

            <motion.div
              {...enter(0.3)}
              className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-neutral-500"
            >
              {(metrics || []).slice(0, 3).map((item) => (
                <span key={item.label}>
                  <span className="font-semibold tabular-nums text-neutral-900">
                    {loading ? '—' : item.value}
                  </span>{' '}
                  {item.label.toLowerCase()}
                </span>
              ))}
            </motion.div>
          </div>

          <div className="md:col-span-7">
            <OgHeroVisual
              examTitle={featured?.title || 'GATE CSE'}
              chapterTitle="Discrete Mathematics"
              href={previewHref}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
