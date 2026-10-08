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
  Layers,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

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

function MockTestDesktopTable({
  tests,
  onStartTest,
  onViewResults,
  onRetakeTest,
}) {
  if (!tests?.length) return null;

  return (
    <div className="hidden lg:block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/90 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3 sm:px-5">Test</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Level</th>
              <th className="px-3 py-3 whitespace-nowrap">Qs</th>
              <th className="px-3 py-3 whitespace-nowrap">Time</th>
              <th className="px-3 py-3 whitespace-nowrap">Attempts</th>
              <th className="px-3 py-3 whitespace-nowrap">Your best</th>
              <th className="px-4 py-3 sm:px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {tests.map((test) => {
              const diff = String(test.difficulty || 'mixed').toLowerCase();
              const diffCls = DIFFICULTY[diff] || DIFFICULTY.mixed;
              return (
                <tr key={test.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="px-4 py-3.5 sm:px-5 max-w-[18rem]">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                          test.isTopicWise
                            ? 'bg-sky-50 border-sky-100 text-sky-700'
                            : 'bg-violet-50 border-violet-100 text-violet-700'
                        }`}
                      >
                        {test.isTopicWise ? (
                          <Layers className="w-4 h-4" />
                        ) : (
                          <BookOpen className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 line-clamp-1">{test.name}</p>
                        {test.description ? (
                          <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                            {test.description}
                          </p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {test.userInProgress ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              In progress
                            </span>
                          ) : null}
                          {test.userCompleted && !test.userInProgress ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                              <CheckCircle className="w-3 h-3" /> Done
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                        test.isTopicWise
                          ? 'bg-sky-50 text-sky-800 border border-sky-100'
                          : 'bg-violet-50 text-violet-800 border border-violet-100'
                      }`}
                    >
                      {test.isTopicWise ? 'Topic' : 'Full'}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-bold capitalize ${diffCls}`}
                    >
                      {test.difficulty || 'Mixed'}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-neutral-700">
                    <span className="inline-flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                      {test.total_questions ?? '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-neutral-700 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      {formatDuration(test.duration)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-neutral-600">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-neutral-400" />
                      {test.attemptCount ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-neutral-800 font-semibold">
                    {test.userBestScore != null ? (
                      <span className="inline-flex items-center gap-1 text-amber-800">
                        <Trophy className="w-3.5 h-3.5" />
                        {test.userBestScore}%
                      </span>
                    ) : (
                      <span className="text-neutral-400 font-normal">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5 text-right">
                    {test.userInProgress ? (
                      <button
                        type="button"
                        onClick={() => onStartTest(test)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Continue
                      </button>
                    ) : test.userCompleted ? (
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => onViewResults(test)}
                          className="inline-flex items-center gap-1 rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                        >
                          Results
                        </button>
                        <button
                          type="button"
                          onClick={() => onRetakeTest(test)}
                          className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Retake
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onStartTest(test)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                      >
                        Start
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(MockTestDesktopTable);
