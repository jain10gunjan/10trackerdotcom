'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import {
  STUDENT_BRAND,
  useStudentMotion,
  useReveal,
  revealProps,
} from '@/features/dashboard/lib/studentHomeBrand';

/**
 * One job per section — matches guest homepage section chrome.
 */
export default function StudentHomeSection({
  eyebrow,
  title,
  description,
  href,
  linkLabel,
  children,
  className = '',
}) {
  const ref = useRef(null);
  const { animate } = useStudentMotion();
  const show = useReveal(ref, { animate, amount: 0.2 });

  return (
    <section ref={ref} className={`scroll-mt-24 ${className}`}>
      <motion.div
        {...revealProps(show, animate, 0)}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4 sm:mb-5"
      >
        <div className="min-w-0">
          {eyebrow ? (
            <p
              className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: STUDENT_BRAND.blue }}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-sm text-neutral-600 max-w-xl leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
        {href && linkLabel ? (
          <Link
            href={href}
            className="inline-flex items-center gap-2 shrink-0 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:border-[#3F5EB9]/35 hover:bg-[#E8EDF8]/50"
          >
            {linkLabel}
            <ArrowRight className="h-4 w-4" style={{ color: STUDENT_BRAND.blue }} />
          </Link>
        ) : null}
      </motion.div>
      <motion.div {...revealProps(show, animate, 0.06)}>{children}</motion.div>
    </section>
  );
}
