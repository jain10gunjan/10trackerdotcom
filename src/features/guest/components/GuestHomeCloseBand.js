'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Map, Target } from 'lucide-react';
import GoogleAuthButton from '@/features/auth/components/GoogleAuthButton';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';
import { APP_GUTTER } from '@/lib/appChrome';
import {
  GUEST_BRAND,
  useGuestMotion,
  useReveal,
  revealProps,
} from '@/features/guest/components/guestMotion';

export default function GuestHomeCloseBand({
  onGoogleSignIn,
  googleLoading = false,
}) {
  const ref = useRef(null);
  const { animate } = useGuestMotion();
  const show = useReveal(ref, { animate, amount: 0.3 });

  return (
    <section ref={ref} className="pb-16 md:pb-20">
      <div className={`max-w-7xl mx-auto ${APP_GUTTER}`}>
        <motion.div
          {...revealProps(show, animate)}
          className="relative overflow-hidden rounded-3xl border border-neutral-900/10 text-white p-8 sm:p-10 lg:p-12"
          style={{
            background:
              'linear-gradient(135deg, #0a0a0a 0%, #121826 45%, #1a2440 100%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.12] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
            aria-hidden
          />

          {animate ? (
            <>
              <motion.div
                className="absolute -top-20 -right-16 h-72 w-72 rounded-full blur-3xl pointer-events-none"
                style={{ backgroundColor: `${GUEST_BRAND.blue}55` }}
                animate={{ x: [0, 18, 0], y: [0, 12, 0], opacity: [0.35, 0.55, 0.35] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              />
              <motion.div
                className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full blur-3xl pointer-events-none bg-sky-400/20"
                animate={{ x: [0, -12, 0], y: [0, 16, 0], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                aria-hidden
              />
            </>
          ) : (
            <div
              className="absolute top-0 right-0 h-72 w-72 rounded-full blur-3xl pointer-events-none opacity-40"
              style={{ backgroundColor: `${GUEST_BRAND.blue}40` }}
              aria-hidden
            />
          )}

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-200">
                <Target className="h-3.5 w-3.5" style={{ color: '#8BA3E8' }} />
                Start today
              </div>
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">
                {SHOW_OG_TRACKERS
                  ? 'Pick an exam or roadmap and begin your prep'
                  : 'Pick an exam and begin your prep'}
              </h2>
              <p className="mt-3 text-neutral-300 text-sm sm:text-base leading-relaxed max-w-lg">
                {SHOW_OG_TRACKERS
                  ? 'Free practice, preview tracker days, sync YouTube from Chrome, then sign in with Google for streaks, heatmaps, and rankings.'
                  : 'Practice for free today. Study plans are coming soon — sign in with Google to save progress, streaks, and rankings.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 lg:justify-end">
              <Link
                href="/exams"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-100 transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Browse exams
              </Link>
              {SHOW_OG_TRACKERS ? (
                <Link
                  href="/og-trackers"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/25 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  <Map className="h-4 w-4" />
                  Explore plans
                </Link>
              ) : null}
              <GoogleAuthButton
                size="hero"
                variant="primary"
                label="Sign in with Google"
                loadingLabel="Signing in…"
                loading={googleLoading}
                onClick={onGoogleSignIn}
                className="w-full sm:w-auto justify-center"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
