'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import GoogleAuthButton from '@/features/auth/components/GoogleAuthButton';
import { APP_GUTTER } from '@/lib/appChrome';
import {
  GUEST_BRAND,
  useGuestMotion,
  useReveal,
  revealProps,
} from '@/features/guest/components/guestMotion';

/** The only Google sign-in on the guest home — a soft close after the user has seen the product. */
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
          className="relative overflow-hidden rounded-3xl border border-neutral-200/90 bg-white p-8 sm:p-10 shadow-[0_24px_60px_-32px_rgba(63,94,185,0.35)]"
        >
          <div
            className="absolute -top-24 -right-16 h-64 w-64 rounded-full blur-3xl pointer-events-none opacity-70"
            style={{ backgroundColor: GUEST_BRAND.soft }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p
                className="text-xs font-semibold uppercase tracking-[0.16em]"
                style={{ color: GUEST_BRAND.blue }}
              >
                When you’re ready
              </p>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                Save your progress
              </h2>
              <p className="mt-2 text-sm sm:text-base text-neutral-600 leading-relaxed">
                Sign in with Google to keep streaks, mock scores, and rankings across devices.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 md:items-end">
              <GoogleAuthButton
                size="hero"
                variant="primary"
                label="Sign in with Google"
                loadingLabel="Signing in…"
                loading={googleLoading}
                onClick={onGoogleSignIn}
                className="w-full justify-center md:w-auto"
              />
              <Link
                href="/exams"
                className="text-center md:text-right text-sm font-medium text-neutral-500 hover:text-[#3F5EB9] transition-colors"
              >
                Or keep browsing exams
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
