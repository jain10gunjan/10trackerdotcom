'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Code2, Gift, Play, Route } from 'lucide-react';
import { APP_GUTTER } from '@/lib/appChrome';
import {
  GUEST_BRAND,
  useGuestMotion,
  useReveal,
  revealProps,
  staggerContainer,
  staggerItem,
} from '@/features/guest/components/guestMotion';

const POINTS = [
  { icon: Play, text: 'Watch each day’s lesson in-app — progress is tracked for you' },
  { icon: Code2, text: 'Pair videos with coding practice and mocks on one checklist' },
  { icon: Gift, text: 'GATE CSE, DSA, and Placement tracks — free to browse' },
];

const SAMPLE_PATHS = [
  { title: 'GATE CSE', meta: 'Exam track · chapters' },
  { title: 'DSA', meta: 'Interview fundamentals' },
  { title: 'Placement', meta: 'Coding + aptitude loop' },
];

function PathRow({ title, meta, index, animate }) {
  return (
    <motion.li custom={index} variants={staggerItem}>
      <Link
        href="/og-trackers"
        className="group flex items-center gap-3 rounded-xl border border-neutral-200/90 bg-white p-4 shadow-sm transition-colors hover:border-[#3F5EB9]/35 hover:bg-[#E8EDF8]/35"
      >
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: GUEST_BRAND.blue }}
        >
          <Route className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">{title}</p>
          {meta ? (
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" style={{ color: GUEST_BRAND.blue }} />
                {meta}
              </span>
            </p>
          ) : null}
        </div>
        <ArrowRight
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-all group-hover:text-[#3F5EB9] ${
            animate ? 'group-hover:translate-x-0.5' : ''
          }`}
        />
      </Link>
    </motion.li>
  );
}

/** One job — introduce OG Trackers and send people to /og-trackers. */
export default function GuestHomeOgTrackers() {
  const ref = useRef(null);
  const { animate } = useGuestMotion();
  const show = useReveal(ref, { animate, amount: 0.2 });

  return (
    <section id="og-trackers" ref={ref} className="scroll-mt-24 pb-14 sm:pb-16">
      <div className={`max-w-7xl mx-auto ${APP_GUTTER}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <motion.div {...revealProps(show, animate)} className="lg:col-span-6">
            <p
              className="text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: GUEST_BRAND.blue }}
            >
              OG Trackers
            </p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              Exam track and User track, one checklist
            </h2>
            <p className="mt-2 text-sm sm:text-base text-neutral-600 leading-relaxed max-w-lg">
              Shared chapter paths for everyone, plus private playlist trackers when you sign in.
            </p>
            <ul className="mt-5 space-y-3">
              {POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-neutral-700">
                  <span
                    className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#3F5EB9]/20 bg-[#E8EDF8]"
                    style={{ color: GUEST_BRAND.blue }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/og-trackers"
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99]"
              style={{
                backgroundColor: GUEST_BRAND.blue,
                boxShadow: `0 12px 28px -12px ${GUEST_BRAND.blue}99`,
              }}
            >
              Explore OG Trackers
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.ul
            className="lg:col-span-6 flex flex-col gap-3"
            variants={staggerContainer(show, animate)}
            initial="hidden"
            animate={show || !animate ? 'show' : 'hidden'}
          >
            {SAMPLE_PATHS.map((path, i) => (
              <PathRow
                key={path.title}
                title={path.title}
                meta={path.meta}
                index={i}
                animate={animate}
              />
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
