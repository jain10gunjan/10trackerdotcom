'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import VendorPortalShell from './VendorPortalShell';
import VendorPageHeader, {
  VendorCard,
  VendorPrimaryButton,
  VendorSecondaryButton,
} from './VendorUi';
import MathHtmlRenderer, {
  McqMathProvider,
} from '@/features/admin/components/mcq-creation/MathHtmlRenderer';

function formatDuration(sec) {
  if (sec == null) return '—';
  const s = Math.max(0, Number(sec) || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

export default function VendorAttemptAnalysisClient({ slug, attemptId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/practice-tests/${slug}/attempts/${attemptId}/analysis`
        );
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load analysis');
        if (!cancelled) setPayload(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, attemptId]);

  if (loading) {
    return (
      <VendorPortalShell>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
        </div>
      </VendorPortalShell>
    );
  }

  if (error || !payload) {
    return (
      <VendorPortalShell>
        <div className="mx-auto max-w-lg px-4 text-sm text-rose-700">
          {error || 'Could not load results.'}
        </div>
      </VendorPortalShell>
    );
  }

  const { summary, analysis, test, message } = payload;
  const frozen = summary.status === 'frozen_access_revoked';
  const finished = ['submitted', 'auto_submitted'].includes(summary.status);

  return (
    <McqMathProvider>
      <VendorPortalShell>
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <VendorPageHeader
            backHref={`/practice-tests/${slug}/tests/${summary.testId}`}
            backLabel={test?.title || 'Test'}
            title={
              frozen ? 'Attempt frozen' : finished ? 'Your results' : 'Attempt'
            }
            description={[
              String(summary.status || '').replace(/_/g, ' '),
              summary.submittedAt
                ? new Date(summary.submittedAt).toLocaleString()
                : null,
              summary.durationTaken != null
                ? formatDuration(summary.durationTaken)
                : null,
              summary.enrollment?.roll_no
                ? `Enrollment ${summary.enrollment.roll_no}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          />

          {frozen ? (
            <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              Access was revoked while this attempt was in progress. It was frozen and not
              scored.
            </p>
          ) : null}

          {finished && summary.cheated ? (
            <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              This attempt was auto-submitted and marked as cheated because fullscreen was left
              or the tab was switched more than the allowed number of times. Answers already
              given were still scored.
            </p>
          ) : null}

          {finished && !summary.resultsReleased ? (
            <VendorCard className="mb-5 border-amber-200 bg-amber-50/80 p-5">
              <p className="text-sm text-amber-900">
                {message ||
                  'Your answers were submitted. Detailed analysis will appear when your institute releases results.'}
              </p>
            </VendorCard>
          ) : null}

          {finished && summary.resultsReleased && analysis ? (
            <>
              <VendorCard className="mb-5 overflow-hidden">
                <div className="bg-gradient-to-br from-teal-700 to-teal-800 p-5 text-white sm:p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-100">
                    Overall score
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">
                    {summary.score ?? 0}{' '}
                    <span className="text-lg font-medium text-teal-100/80">
                      / {summary.maxScore ?? 0}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-teal-100/80">
                    {summary.percentage ?? 0}% · Rank {summary.denseRank ?? '—'} of{' '}
                    {summary.cohortSize ?? '—'} · {summary.percentile ?? '—'}th %ile
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4 sm:gap-3 sm:p-5">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <div className="flex items-center justify-between">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-xl font-bold tabular-nums text-emerald-900">
                        {summary.correctCount ?? 0}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-emerald-700">Correct</p>
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                    <div className="flex items-center justify-between">
                      <XCircle className="h-4 w-4 text-rose-600" />
                      <span className="text-xl font-bold tabular-nums text-rose-900">
                        {summary.incorrectCount ?? 0}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-rose-700">Incorrect</p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <div className="flex items-center justify-between">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-xl font-bold tabular-nums text-amber-900">
                        {summary.skippedCount ?? 0}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-amber-700">Skipped</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="flex items-center justify-between">
                      <Clock className="h-4 w-4 text-neutral-600" />
                      <span className="text-lg font-bold tabular-nums text-neutral-900">
                        {formatDuration(summary.durationTaken)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-neutral-700">Time</p>
                  </div>
                </div>
              </VendorCard>

              <section className="mb-6">
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  By subject
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(analysis.bySubject || {}).map(([name, stats]) => (
                    <VendorCard key={name} className="px-4 py-3">
                      <p className="font-semibold text-neutral-900">{name}</p>
                      <p className="mt-1 text-xs text-neutral-600">
                        {stats.correct}✓ · {stats.incorrect}✗ · {stats.skipped} skipped ·{' '}
                        {Math.round((stats.marks || 0) * 100) / 100} marks
                      </p>
                    </VendorCard>
                  ))}
                </div>
              </section>

              <section className="mb-6">
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  By topic
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(analysis.byTopic || {}).map(([name, stats]) => (
                    <VendorCard key={name} className="px-4 py-3">
                      <p className="font-semibold text-neutral-900">{name}</p>
                      <p className="mt-1 text-xs text-neutral-600">
                        {stats.correct}✓ · {stats.incorrect}✗ · {stats.skipped} skipped ·{' '}
                        {Math.round((stats.marks || 0) * 100) / 100} marks
                      </p>
                    </VendorCard>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Question review
                </h2>
                {(analysis.questions || []).map((q, i) => {
                  const tone =
                    q.isCorrect === true
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : q.isCorrect === false
                        ? 'border-rose-200 bg-rose-50/50'
                        : 'border-neutral-200/90 bg-white';
                  return (
                    <article
                      key={q.questionId || i}
                      className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${tone}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                        <span>
                          Q{q.questionOrder ?? i + 1}
                          {q.topic ? ` · ${q.topic}` : ''}
                          {q.subject ? ` · ${q.subject}` : ''}
                        </span>
                        <span className="font-medium">
                          {q.isCorrect === true
                            ? 'Correct'
                            : q.isCorrect === false
                              ? 'Incorrect'
                              : 'Skipped'}{' '}
                          · {q.marksAwarded ?? 0} marks · {formatDuration(q.timeTaken)}
                        </span>
                      </div>
                      {q.directionhtml ? (
                        <div className="mt-3 text-sm text-neutral-700">
                          <MathHtmlRenderer html={q.directionhtml} />
                        </div>
                      ) : null}
                      <div className="prose prose-sm mt-3 max-w-none text-neutral-900">
                        <MathHtmlRenderer html={q.question || ''} />
                      </div>
                      <dl className="mt-3 grid gap-1 text-sm">
                        <div>
                          <dt className="inline font-medium text-neutral-600">Your answer: </dt>
                          <dd className="inline text-neutral-900">{q.userAnswer || '—'}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-neutral-600">Correct: </dt>
                          <dd className="inline text-neutral-900">{q.correctAnswer || '—'}</dd>
                        </div>
                      </dl>
                      {q.solution ? (
                        <div className="mt-3 rounded-xl border border-neutral-200/80 bg-white/90 p-3 text-sm">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                            Solution
                          </p>
                          <div className="prose prose-sm mt-1 max-w-none">
                            <MathHtmlRenderer html={q.solution} />
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </section>

              {analysis.antiCheatEventCount > 0 ? (
                <p className="mt-6 text-xs text-neutral-500">
                  Focus / clipboard events logged: {analysis.antiCheatEventCount}
                </p>
              ) : null}
            </>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-3">
            <VendorSecondaryButton as={Link} href={`/practice-tests/${slug}/tests`}>
              All tests
            </VendorSecondaryButton>
            <VendorPrimaryButton as={Link} href={`/practice-tests/${slug}`}>
              Portal home
            </VendorPrimaryButton>
          </div>
        </div>
      </VendorPortalShell>
    </McqMathProvider>
  );
}
