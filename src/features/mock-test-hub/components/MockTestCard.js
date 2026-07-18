'use client';

import { memo } from 'react';
import {
  Play,
  Clock,
  Target,
  Users,
  Trophy,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  Layers,
  BookOpen,
} from 'lucide-react';
import TestLeaderboardInline from '@/features/mock-test/components/TestLeaderboardInline';

const DIFFICULTY = {
  easy: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  hard: 'bg-rose-50 text-rose-800 border-rose-200',
  mixed: 'bg-neutral-100 text-neutral-700 border-neutral-200',
};

function formatDuration(minutes) {
  const m = Number(minutes) || 0;
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function MockTestCard({
  test,
  onStartTest,
  onViewResults,
  onRetakeTest,
  examcategory,
  user,
}) {
  const diff = String(test.difficulty || 'mixed').toLowerCase();
  const diffCls = DIFFICULTY[diff] || DIFFICULTY.mixed;

  return (
    <article className="rounded-3xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
          {test.isTopicWise ? (
            <Layers className="w-5 h-5 text-emerald-700" />
          ) : (
            <BookOpen className="w-5 h-5 text-emerald-700" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug pr-2">
              {test.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold capitalize ${diffCls}`}>
                {test.difficulty || 'Mixed'}
              </span>
              {test.userInProgress ? (
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  In progress
                </span>
              ) : null}
              {test.userCompleted && !test.userInProgress ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : null}
            </div>
          </div>

          {test.description ? (
            <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{test.description}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              {test.total_questions} questions
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              {formatDuration(test.duration)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              {test.attemptCount ?? 0} attempts
            </span>
          </div>

          {test.userCompleted && test.userBestScore != null ? (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-xs font-semibold text-amber-900">
              <Trophy className="w-3.5 h-3.5" />
              Best score: {test.userBestScore}%
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {test.userInProgress ? (
          <button
            type="button"
            onClick={() => onStartTest(test)}
            className="col-span-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            Continue test
          </button>
        ) : test.userCompleted ? (
          <>
            <button
              type="button"
              onClick={() => onViewResults(test)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4" />
              Results
            </button>
            <button
              type="button"
              onClick={() => onRetakeTest(test)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-neutral-200 text-neutral-800 text-sm font-semibold hover:bg-neutral-50"
            >
              <RefreshCw className="w-4 h-4" />
              Retake
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onStartTest(test)}
            className="col-span-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
          >
            <Play className="w-4 h-4" />
            Start test
            <ArrowRight className="w-4 h-4 opacity-80" />
          </button>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-neutral-100">
        <TestLeaderboardInline
          examcategory={examcategory}
          testId={test.id}
          testName={test.name}
          user={user}
          attemptCount={test.attemptCount}
        />
      </div>
    </article>
  );
}

export default memo(MockTestCard);
