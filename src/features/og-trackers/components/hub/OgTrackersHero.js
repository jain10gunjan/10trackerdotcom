'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Chrome,
  Crown,
  GraduationCap,
  Settings2,
} from 'lucide-react';
import OgHeroVisual from '@/features/og-trackers/components/hub/OgHeroVisual';
import ExtensionStatus from '@/features/extension-auth/components/ExtensionStatus';
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

/**
 * OG Trackers hero — homepage design tokens, OG-only story & composition.
 */
export default function OgTrackersHero({
  loading,
  user,
  isPremium,
  featured,
  startHref,
  metrics,
  onGoPremium,
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

  const previewHref = '/og-trackers/gate-cse-discrete-mathematics';

  return (
    <section
      className="relative overflow-hidden pb-10 sm:pb-12"
      style={{ paddingTop: APP_NAV_CONTENT_OFFSET }}
    >
      {/* Same atmosphere language as homepage — not the same layout copy */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 85% 15%, #E8EDF8 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 10% 30%, #F0F4FF 0%, transparent 50%), linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 55%, #F5F5F5 100%)',
          }}
        />
        {animate ? (
          <>
            <motion.div
              className="absolute top-[4%] right-[12%] h-64 w-64 sm:h-80 sm:w-80 rounded-full blur-[100px] will-change-transform"
              style={{ backgroundColor: `${BRAND.blue}28` }}
              animate={{ x: [0, 20, 0], y: [0, 14, 0], opacity: [0.35, 0.55, 0.35] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute top-[28%] left-[4%] h-56 w-56 rounded-full blur-[90px] bg-sky-200/40 will-change-transform"
              animate={{ x: [0, -16, 0], y: [0, 18, 0], opacity: [0.25, 0.4, 0.25] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
          </>
        ) : null}
      </div>

      <div className={`relative max-w-7xl mx-auto ${APP_GUTTER} pt-5 sm:pt-8 md:pt-9 lg:pt-10`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 md:items-center">
          {/* Copy — OG story */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left">
            <motion.p
              {...enter(0)}
              className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500"
            >
              Structured study paths
            </motion.p>

            <motion.h1
              {...enter(0.05)}
              className="mt-3 text-[clamp(2.1rem,6.5vw,3.25rem)] font-black tracking-tight text-neutral-950 leading-[1.02] max-w-md"
            >
              Finish every chapter — watch, practice, mock.
            </motion.h1>

            <motion.p
              {...enter(0.12)}
              className="mt-4 text-sm sm:text-[15px] text-neutral-600 leading-relaxed max-w-md"
            >
              OG Trackers turn each exam into chapters with one checklist. Lessons sync from
              YouTube through our Chrome extension; practice and mocks use what’s already on
              10Tracker.
            </motion.p>

            {user ? (
              <motion.div {...enter(0.18)} className="mt-4 w-full max-w-md text-left">
                <ExtensionStatus variant="both" enabled />
              </motion.div>
            ) : (
              <motion.div
                {...enter(0.18)}
                className="mt-4 w-full max-w-md rounded-2xl border border-[#3F5EB9]/20 bg-white/90 px-4 py-3.5 text-left shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: BRAND.blue }}
                  >
                    <Chrome className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-950">
                      Extension = YouTube progress that actually counts
                    </p>
                    <p className="mt-1 text-[13px] text-neutral-600 leading-relaxed">
                      Sign in, install once, connect your account. Watch % writes into the chapter
                      tracker for catalogued videos.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              {...enter(0.24)}
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
                  {featured ? `Open ${featured.title}` : 'Browse exams'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <span
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white/90"
                  style={{ backgroundColor: BRAND.blue }}
                >
                  Loading exams…
                </span>
              )}
              {!user ? (
                <Link
                  href="/extension/connect"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
                >
                  <Chrome className="h-4 w-4" style={{ color: BRAND.blue }} />
                  Connect extension
                </Link>
              ) : null}
            </motion.div>

            {isPremium ? (
              <motion.div {...enter(0.28)} className="mt-3">
                <Link
                  href="/og-trackers/settings"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700"
                >
                  <Settings2 className="h-4 w-4" />
                  Judge settings
                </Link>
              </motion.div>
            ) : user ? (
              <motion.div {...enter(0.28)} className="mt-3">
                <button
                  type="button"
                  onClick={onGoPremium}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900"
                >
                  <Crown className="h-4 w-4 text-amber-600" />
                  Go premium for judge sync
                </button>
              </motion.div>
            ) : (
              <motion.p
                {...enter(0.28)}
                className="mt-3 text-xs text-neutral-500 max-w-md"
              >
                Sign in to keep checklist progress across devices.
              </motion.p>
            )}

            <motion.div
              {...enter(0.32)}
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

          {/* Visual — unique to OG, not homepage showcase clone */}
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
