'use client';

import Link from 'next/link';
import { BookOpen, Users, Target, ArrowRight } from 'lucide-react';

export default function MockTestGuestHero({ testsCount, totalQuestions, signInHref }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-5 sm:p-6 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
        Guest browse
      </p>
      <h2 className="mt-1.5 text-lg sm:text-xl font-bold text-neutral-900">
        Explore mocks without signing in
      </h2>
      <p className="mt-1.5 text-sm text-neutral-600 max-w-xl leading-relaxed">
        Full-length and topic-wise tests are open to browse. Sign in when you start so your
        score and rank are saved.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-600">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold tabular-nums text-neutral-900">{testsCount}</span> tests
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Target className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold tabular-nums text-neutral-900">
            {totalQuestions.toLocaleString()}
          </span>{' '}
          questions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="w-4 h-4 text-emerald-600" />
          Join thousands of students
        </span>
      </div>
      <Link
        href={signInHref}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
      >
        Sign in to track progress
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
