'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Loader2 } from 'lucide-react';
import VendorAdminNav from './VendorAdminNav';
import VendorPortalShell from './VendorPortalShell';
import VendorPageHeader, {
  VendorCard,
  VendorPrimaryButton,
  VendorSecondaryButton,
  VendorStatTile,
} from './VendorUi';

function formatDuration(sec) {
  if (sec == null) return '—';
  const s = Math.max(0, Number(sec) || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

export default function VendorTestResultsClient({ slug, testId }) {
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState(null);
  const [releasing, setReleasing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resList, resStats] = await Promise.all([
        fetch(`/api/practice-tests/${slug}/results?testId=${encodeURIComponent(testId)}`),
        fetch(`/api/practice-tests/${slug}/results/${testId}/stats`),
      ]);
      const listData = await resList.json();
      const statsData = await resStats.json();
      if (!resList.ok || !listData.success) {
        throw new Error(listData.error || 'Failed to load results');
      }
      setTest(listData.test);
      setAttempts(listData.attempts || []);
      if (resStats.ok && statsData.success) setStats(statsData);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, testId]);

  useEffect(() => {
    load();
  }, [load]);

  const releaseResults = async () => {
    setReleasing(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results_released: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Release failed');
      toast.success('Results released to students');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReleasing(false);
    }
  };

  return (
    <VendorPortalShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <VendorAdminNav slug={slug} active="admin/results" />
        <VendorPageHeader
          backHref={`/practice-tests/${slug}/admin/results`}
          backLabel="All results"
          eyebrow="Admin"
          title={test?.title || 'Test results'}
          description={
            test
              ? `Release: ${test.result_release}${
                  test.results_released ? ' · released' : ' · not manually released'
                }`
              : 'Loading…'
          }
          actions={
            <>
              {!test?.results_released && test?.result_release === 'manual' ? (
                <VendorPrimaryButton
                  type="button"
                  disabled={releasing}
                  onClick={releaseResults}
                  className="!bg-neutral-900 hover:!bg-neutral-800 !py-2"
                >
                  {releasing ? 'Releasing…' : 'Release results'}
                </VendorPrimaryButton>
              ) : null}
              <VendorSecondaryButton
                as="a"
                href={`/api/practice-tests/${slug}/results/${testId}/export`}
                className="!py-2"
              >
                <Download className="h-4 w-4" /> CSV
              </VendorSecondaryButton>
            </>
          }
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
          </div>
        ) : (
          <>
            {stats?.aggregates ? (
              <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <VendorStatTile
                  label="Submitted"
                  value={stats.aggregates.submittedCount}
                  hint={`${stats.aggregates.totalAttempts} total attempts`}
                  tone="teal"
                />
                <VendorStatTile
                  label="Avg score"
                  value={stats.aggregates.avgScore ?? '—'}
                  hint={`Median ${stats.aggregates.medianScore ?? '—'}`}
                  tone="emerald"
                />
                <VendorStatTile
                  label="Avg %"
                  value={
                    stats.aggregates.avgPercentage != null
                      ? `${stats.aggregates.avgPercentage}%`
                      : '—'
                  }
                  hint={`Avg time ${formatDuration(stats.aggregates.avgDurationSeconds)}`}
                  tone="neutral"
                />
                <VendorStatTile
                  label="Anti-cheat"
                  value={stats.aggregates.antiCheatEvents}
                  hint={`${stats.aggregates.antiCheatAttempts} attempts with events`}
                  tone="amber"
                />
              </div>
            ) : null}

            <VendorCard className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Rank</th>
                    <th className="px-3 py-2.5 font-semibold">Enrollment</th>
                    <th className="px-3 py-2.5 font-semibold">Name</th>
                    <th className="px-3 py-2.5 font-semibold">Email</th>
                    <th className="px-3 py-2.5 font-semibold">Score</th>
                    <th className="px-3 py-2.5 font-semibold">Time</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="px-3 py-2.5 font-semibold">AC</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-neutral-500">
                        No attempts yet.
                      </td>
                    </tr>
                  ) : (
                    attempts.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-neutral-100 transition hover:bg-teal-50/30"
                      >
                        <td className="px-3 py-2.5 font-semibold tabular-nums text-neutral-900">
                          {a.denseRank ?? '—'}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-neutral-900">
                          {a.enrollment || '—'}
                        </td>
                        <td className="px-3 py-2.5">{a.displayName || '—'}</td>
                        <td className="px-3 py-2.5 text-neutral-600">{a.userEmail}</td>
                        <td className="px-3 py-2.5 tabular-nums">
                          {a.score != null ? `${a.score}/${a.maxScore ?? '—'}` : '—'}
                          {a.percentage != null ? (
                            <span className="text-xs text-neutral-500"> ({a.percentage}%)</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">
                          {formatDuration(a.durationTaken)}
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          {String(a.status || '').replace(/_/g, ' ')}
                          {a.cheated ? (
                            <span className="ml-1 inline-flex rounded-full bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-800">
                              cheated
                            </span>
                          ) : null}
                        </td>
                        <td
                          className={`px-3 py-2.5 tabular-nums ${
                            a.antiCheatEventCount > 0
                              ? 'font-semibold text-amber-700'
                              : 'text-neutral-500'
                          }`}
                          title={
                            a.antiCheatEventCount
                              ? (a.antiCheatEvents || []).map((e) => e.type).join(', ')
                              : ''
                          }
                        >
                          {a.antiCheatEventCount || 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </VendorCard>

            {stats?.questionStats?.length ? (
              <section className="mt-8">
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Question difficulty
                </h2>
                <VendorCard className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] uppercase tracking-wider text-neutral-500">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">#</th>
                        <th className="px-3 py-2.5 font-semibold">Topic</th>
                        <th className="px-3 py-2.5 font-semibold">Correct</th>
                        <th className="px-3 py-2.5 font-semibold">Incorrect</th>
                        <th className="px-3 py-2.5 font-semibold">Skipped</th>
                        <th className="px-3 py-2.5 font-semibold">Correct %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.questionStats.map((q) => (
                        <tr key={q.questionId} className="border-b border-neutral-100">
                          <td className="px-3 py-2.5">{q.questionOrder ?? '—'}</td>
                          <td className="px-3 py-2.5">
                            {q.topic || '—'}
                            {q.subject ? (
                              <span className="text-xs text-neutral-500"> · {q.subject}</span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2.5 text-emerald-800">{q.correct}</td>
                          <td className="px-3 py-2.5 text-rose-800">{q.incorrect}</td>
                          <td className="px-3 py-2.5">{q.skipped}</td>
                          <td className="px-3 py-2.5 font-medium tabular-nums">
                            {q.correctRate != null ? `${q.correctRate}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </VendorCard>
              </section>
            ) : null}
          </>
        )}
      </div>
    </VendorPortalShell>
  );
}
