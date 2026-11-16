'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ClipboardList, FileText } from 'lucide-react';
import { mockTestHrefForSlug, practiceHrefForSlug } from '@/lib/platformExams';
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

function ExamThumb({ exam, size = 'lg' }) {
  const [imageError, setImageError] = useState(false);
  const showImage = exam.image && !imageError;
  const box =
    size === 'lg'
      ? 'h-20 w-20 sm:h-24 sm:w-24 rounded-2xl'
      : 'h-11 w-11 rounded-xl';

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-[#3F5EB9]/15 bg-[#E8EDF8] ${box}`}
    >
      {showImage ? (
        <Image
          src={exam.image}
          alt=""
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl">
          {exam.icon || '📚'}
        </div>
      )}
    </div>
  );
}

function FeaturedExam({ exam, animate, show }) {
  if (!exam) return null;

  return (
    <motion.article
      {...revealProps(show, animate, 0.05)}
      className="relative overflow-hidden rounded-2xl sm:rounded-[1.5rem] border border-neutral-200/90 bg-white p-5 sm:p-7 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)] h-full"
    >
      <div
        className="absolute -top-16 -right-10 h-40 w-40 rounded-full blur-3xl pointer-events-none opacity-60"
        style={{ backgroundColor: GUEST_BRAND.soft }}
        aria-hidden
      />
      <div className="relative flex flex-col h-full">
        <div className="flex items-start gap-4">
          <ExamThumb exam={exam} size="lg" />
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: GUEST_BRAND.blue }}
            >
              Spotlight
            </p>
            <h3 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 leading-snug">
              {exam.name}
            </h3>
            {exam.category ? (
              <span className="mt-2 inline-flex rounded-full border border-[#3F5EB9]/20 bg-[#E8EDF8]/70 px-2.5 py-0.5 text-[10px] font-semibold text-[#1e2f6b]">
                {exam.category}
              </span>
            ) : null}
          </div>
        </div>

        {exam.description ? (
          <p className="mt-4 text-sm text-neutral-600 leading-relaxed line-clamp-3">
            {exam.description}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-1.5 text-xs text-neutral-500">
          <FileText className="h-3.5 w-3.5" style={{ color: GUEST_BRAND.blue }} />
          <span className="tabular-nums font-medium text-neutral-700">
            {(exam.count || 0).toLocaleString()}
          </span>{' '}
          questions
        </div>

        <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-2.5">
          <Link
            href={practiceHrefForSlug(exam.slug)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99]"
            style={{
              backgroundColor: GUEST_BRAND.blue,
              boxShadow: `0 12px 28px -12px ${GUEST_BRAND.blue}99`,
            }}
          >
            <BookOpen className="h-4 w-4" />
            Practice
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={mockTestHrefForSlug(exam.slug)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <ClipboardList className="h-4 w-4" style={{ color: GUEST_BRAND.blue }} />
            Mock tests
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

function RankedExamRow({ exam, index, animate }) {
  return (
    <motion.li
      custom={index}
      variants={staggerItem}
      whileHover={animate ? { x: 6 } : undefined}
      transition={{ duration: 0.2, ease: easeOut }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-xl border border-neutral-200/90 bg-white p-3.5 sm:p-4 shadow-sm transition-colors group-hover:border-[#3F5EB9]/35 group-hover:bg-[#E8EDF8]/35">
        <span
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: GUEST_BRAND.blue }}
          aria-hidden
        />
        <div className="flex items-start gap-3">
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums text-white"
            style={{ backgroundColor: GUEST_BRAND.blue }}
          >
            {String(index + 2).padStart(2, '0')}
          </span>
          <ExamThumb exam={exam} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900 truncate">{exam.name}</p>
            <p className="mt-0.5 text-xs text-neutral-500 tabular-nums">
              {(exam.count || 0).toLocaleString()} questions
              {exam.category ? ` · ${exam.category}` : ''}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
              <Link
                href={practiceHrefForSlug(exam.slug)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:text-[#3F5EB9]"
              >
                Practice <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                href={mockTestHrefForSlug(exam.slug)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-[#3F5EB9]"
              >
                Mocks <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.li>
  );
}

export default function GuestHomeExamSpotlight({ exams = [] }) {
  const ref = useRef(null);
  const { animate } = useGuestMotion();
  const show = useReveal(ref, { animate, amount: 0.2 });

  const featured = exams[0];
  const ranked = exams.slice(1, 4);

  return (
    <section id="practice" ref={ref} className="scroll-mt-24 pb-14 sm:pb-16">
      <div className={`max-w-7xl mx-auto ${APP_GUTTER}`}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8">
          <motion.div {...revealProps(show, animate)}>
            <p
              className="text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: GUEST_BRAND.blue }}
            >
              Practice
            </p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              Popular exams to start with
            </h2>
            <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-xl leading-relaxed">
              Jump into topic-wise MCQs or timed mocks — featured by activity across the platform.
            </p>
          </motion.div>
          <motion.div {...revealProps(show, animate, 0.08)}>
            <Link
              href="/exams"
              className="inline-flex items-center gap-2 shrink-0 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:border-[#3F5EB9]/40 hover:bg-[#E8EDF8]/50 transition-colors shadow-sm"
            >
              View all exams
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>

        {exams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white py-14 text-center text-sm text-neutral-500">
            Exams loading — check back shortly.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7 items-stretch">
            <div className="md:col-span-6 lg:col-span-5">
              <FeaturedExam exam={featured} animate={animate} show={show} />
            </div>
            <motion.ul
              className="md:col-span-6 lg:col-span-7 flex flex-col gap-3"
              variants={staggerContainer(show, animate)}
              initial="hidden"
              animate={show || !animate ? 'show' : 'hidden'}
            >
              {ranked.map((exam, i) => (
                <RankedExamRow key={exam.slug} exam={exam} index={i} animate={animate} />
              ))}
              {ranked.length === 0 ? (
                <li className="rounded-xl border border-dashed border-neutral-200 bg-white py-10 text-center text-sm text-neutral-500">
                  More exams coming soon.
                </li>
              ) : null}
            </motion.ul>
          </div>
        )}
      </div>
    </section>
  );
}
