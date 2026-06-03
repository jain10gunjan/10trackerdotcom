'use client';

import { motion } from 'framer-motion';
import { BookOpen, Target, Trophy, Flame } from 'lucide-react';
import Link from 'next/link';
import { getPracticeHubHref } from './MockTestBreadcrumb';

export default function MockTestPageHeader({
  examcategory,
  categoryLabel,
  testsCount,
  streak,
  subtitle,
  profileDisplayName,
}) {
  const hubHref = getPracticeHubHref(examcategory);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-6 sm:mb-8"
    >
      <div className="rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={hubHref}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              ← Back to {categoryLabel} practice
            </Link>
            <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-2 tracking-tight">
              {categoryLabel} Mock Tests
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 mt-2 max-w-xl">
              {subtitle ||
                'Full-length timed tests with analytics. Same clean experience as topic-wise practice.'}
            </p>
            {profileDisplayName && (
              <p className="text-sm text-neutral-500 mt-2">
                Competing as <span className="font-medium text-neutral-800">{profileDisplayName}</span>
              </p>
            )}
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-100 shrink-0">
              <Flame className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-lg font-bold text-orange-700 tabular-nums leading-none">{streak}</p>
                <p className="text-[10px] font-semibold text-orange-600 uppercase">day streak</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-neutral-100 text-xs sm:text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            {testsCount} tests
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            Exam simulation
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Trophy className="h-4 w-4" />
            Detailed analytics
          </span>
        </div>
      </div>
    </motion.div>
  );
}
