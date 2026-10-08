'use client';

import Link from 'next/link';
import VendorPortalShell from './VendorPortalShell';

export default function VendorAttemptSummaryClient({
  slug,
  attempt,
  test,
  resultsReleased,
}) {
  const finished = ['submitted', 'auto_submitted'].includes(attempt.status);
  const frozen = attempt.status === 'frozen_access_revoked';

  return (
    <VendorPortalShell>
      <div className="mx-auto max-w-lg px-4">
        <Link
          href={`/practice-tests/${slug}/tests/${test.id}`}
          className="text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          ← {test.title}
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-neutral-900">
          {frozen ? 'Attempt frozen' : finished ? 'Attempt submitted' : 'Attempt'}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Status: {String(attempt.status || '').replace(/_/g, ' ')}
          {attempt.submitted_at
            ? ` · ${new Date(attempt.submitted_at).toLocaleString()}`
            : ''}
          {attempt.duration_taken != null
            ? ` · ${Math.round(attempt.duration_taken / 60)} min taken`
            : ''}
        </p>

        {frozen ? (
          <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            Your institute revoked access while this attempt was in progress. It was
            frozen and not scored.
          </p>
        ) : null}

        {finished && resultsReleased ? (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Score
            </p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900">
              {attempt.score ?? 0}
              <span className="text-lg font-medium text-neutral-500">
                {' '}
                / {attempt.max_score ?? 0}
              </span>
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {attempt.percentage ?? 0}% · {attempt.correct_count ?? 0} correct ·{' '}
              {attempt.incorrect_count ?? 0} incorrect · {attempt.skipped_count ?? 0}{' '}
              skipped
            </p>
          </div>
        ) : null}

        {finished && !resultsReleased ? (
          <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Your answers were submitted. Results will appear when your institute
            releases them
            {test.result_release === 'after_window' && test.ends_at
              ? ` (after ${new Date(test.ends_at).toLocaleString()})`
              : ''}
            .
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link
            href={`/practice-tests/${slug}/tests`}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 font-medium text-neutral-800 hover:border-neutral-300"
          >
            All tests
          </Link>
          <Link
            href={`/practice-tests/${slug}`}
            className="rounded-xl bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
          >
            Portal home
          </Link>
        </div>

        <p className="mt-8 text-xs text-neutral-400">
          Detailed question-wise analysis ships in a later phase.
        </p>
      </div>
    </VendorPortalShell>
  );
}
