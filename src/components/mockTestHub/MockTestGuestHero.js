'use client';

import Link from 'next/link';
import { BookOpen, Users, Target, ArrowRight } from 'lucide-react';

export default function MockTestGuestHero({ testsCount, totalQuestions, signInHref }) {
  return (
    <div className="mb-5 sm:mb-6 rounded-3xl border border-neutral-200 bg-gradient-to-br from-emerald-50/80 to-white p-5 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-2">
        Browse mock tests — no sign-in required
      </h2>
      <p className="text-sm text-neutral-600 mb-4 max-w-xl">
        Explore full-length and topic-wise tests. Sign in only when you are ready to start and save your score.
      </p>
      <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mb-4">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          {testsCount} tests
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Target className="w-4 h-4 text-emerald-600" />
          {totalQuestions.toLocaleString()} questions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="w-4 h-4 text-emerald-600" />
          Join thousands of students
        </span>
      </div>
      <Link
        href={signInHref}
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
      >
        Sign in to track progress
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
