'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import VendorPortalShell from '@/features/vendor-tests/components/VendorPortalShell';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANG_MONACO = {
  python: 'python',
  java: 'java',
  javascript: 'javascript',
  'c++': 'cpp',
  c: 'c',
};

function monacoLang(name) {
  const lower = String(name || '').toLowerCase();
  for (const [k, v] of Object.entries(LANG_MONACO)) {
    if (lower.startsWith(k)) return v;
  }
  return 'plaintext';
}

function verdictColor(verdict) {
  const v = String(verdict || '').toLowerCase();
  if (v === 'accepted') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (v.includes('wrong') || v.includes('error') || v.includes('exceeded')) {
    return 'text-red-700 bg-red-50 border-red-200';
  }
  if (v === 'queued' || v === 'judging' || v === 'processing') {
    return 'text-amber-800 bg-amber-50 border-amber-200';
  }
  return 'text-neutral-700 bg-neutral-50 border-neutral-200';
}

export default function ContestProblemClient({ slug, contestId, problemId }) {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [languageId, setLanguageId] = useState('');
  const [source, setSource] = useState('// write your solution\n');
  const [stdin, setStdin] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [history, setHistory] = useState([]);
  const pollRef = useRef(null);
  const languageReady = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/practice-tests/${slug}/coding-contests/${contestId}/problems/${problemId}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setPayload(data);
      setHistory(data.submissions || []);
      if (data.languages?.length && !languageReady.current) {
        setLanguageId(data.languages[0].id);
        languageReady.current = true;
      }
      if (data.testCases?.[0] && !stdin) {
        setStdin(data.testCases[0].input || '');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, contestId, problemId, stdin]);

  useEffect(() => {
    load();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, contestId, problemId]);

  const selectedLang = useMemo(
    () => (payload?.languages || []).find((l) => l.id === languageId),
    [payload, languageId]
  );

  const fetchSubmissionOnce = useCallback(
    async (submissionId) => {
      const res = await fetch(`/api/practice-tests/${slug}/coding-submissions/${submissionId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load submission status');
      }
      return data.submission;
    },
    [slug]
  );

  const watchSubmission = useCallback(
    (submissionId) => {
      stopPolling();
      setStatusNote('Queued — waiting for the judge worker…');
      let ticks = 0;
      let delay = 800;

      const schedule = () => {
        pollRef.current = setTimeout(tick, delay);
      };

      const tick = async () => {
        ticks += 1;
        try {
          const submission = await fetchSubmissionOnce(submissionId);
          setLive(submission);
          if (submission.status === 'judging') {
            setStatusNote('Judging against test cases…');
            delay = Math.min(2500, 900 + ticks * 50);
          } else if (submission.status === 'queued') {
            setStatusNote(
              ticks > 10
                ? 'Still queued. Is `npm run worker:judge` running?'
                : 'Queued — waiting for the judge worker…'
            );
            delay = Math.min(4000, 800 + ticks * 120);
          } else if (submission.status === 'done' || submission.status === 'error') {
            stopPolling();
            setStatusNote('');
            const v = submission.verdict || submission.status;
            if (String(v).toLowerCase() === 'accepted') toast.success(v);
            else toast.error(v || 'Finished with errors');
            load();
            return;
          }
        } catch (err) {
          setStatusNote(err.message);
          delay = Math.min(5000, delay + 500);
        }
        schedule();
      };

      tick();
    },
    [fetchSubmissionOnce, load, stopPolling]
  );

  const submit = async (mode) => {
    if (!languageId) {
      toast.error('Pick a language');
      return;
    }
    if (!(payload?.languages || []).length) {
      toast.error('No languages enabled. Admin → Coding → Sync Judge0 languages');
      return;
    }
    setBusy(true);
    setLive({
      id: null,
      status: 'queued',
      verdict: null,
      results: [],
    });
    setStatusNote(mode === 'run' ? 'Sending run request…' : 'Sending submission…');
    try {
      const path =
        mode === 'run'
          ? `/api/practice-tests/${slug}/coding-contests/${contestId}/problems/${problemId}/run`
          : `/api/practice-tests/${slug}/coding-contests/${contestId}/problems/${problemId}/submit`;
      const body =
        mode === 'run'
          ? { languageId, sourceCode: source, stdin }
          : { languageId, sourceCode: source };
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      toast.success(mode === 'run' ? 'Run started' : 'Submitted');
      setLive({ id: data.submissionId, status: 'queued', results: [] });
      watchSubmission(data.submissionId);
    } catch (err) {
      setStatusNote(err.message);
      setLive((prev) =>
        prev
          ? { ...prev, status: 'error', verdict: err.message, error_message: err.message }
          : {
              status: 'error',
              verdict: err.message,
              results: [],
            }
      );
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <VendorPortalShell>
        <Toaster position="top-right" />
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-12 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      </VendorPortalShell>
    );
  }

  if (!payload) {
    return (
      <VendorPortalShell>
        <Toaster position="top-right" />
        <p className="mx-auto max-w-5xl px-4 py-12 text-sm">Problem not found.</p>
      </VendorPortalShell>
    );
  }

  const { problem, contest, testCases, hiddenTestCaseCount, active } = payload;
  const livePending = live && (live.status === 'queued' || live.status === 'judging');

  return (
    <VendorPortalShell>
      <Toaster position="top-right" />
      <div className="mx-auto max-w-5xl px-4 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link
              href={`/practice-tests/${slug}/coding-contests/${contestId}`}
              className="text-sm font-medium text-teal-700"
            >
              ← {contest.title}
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-900">{problem.title}</h1>
            <p className="mt-1 text-xs text-neutral-500">
              Limits: {problem.cpu_time_limit}s CPU · {problem.memory_limit_kb} KB ·{' '}
              {problem.points} pts
              {!active ? ' · Contest not active (Submit disabled; Run still works)' : ''}
            </p>
          </div>
          <Link
            href={`/practice-tests/${slug}/coding-contests/${contestId}/leaderboard`}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium"
          >
            Leaderboard
          </Link>
        </div>

        <pre className="mt-6 whitespace-pre-wrap rounded-2xl border border-neutral-200 bg-white p-5 text-sm leading-relaxed text-neutral-800">
          {problem.statement || 'No statement.'}
        </pre>

        {(testCases || []).length > 0 ? (
          <div className="mt-4 space-y-2">
            <h2 className="text-sm font-semibold">Sample tests</h2>
            {testCases.map((tc) => (
              <div
                key={tc.id}
                className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs"
              >
                <p className="font-sans text-[11px] font-semibold uppercase text-neutral-500">
                  Sample
                </p>
                <pre className="mt-1 whitespace-pre-wrap">{`Input:\n${tc.input}`}</pre>
                <pre className="mt-1 whitespace-pre-wrap">{`Output:\n${tc.expected_output}`}</pre>
              </div>
            ))}
            {hiddenTestCaseCount ? (
              <p className="text-xs text-neutral-500">
                + {hiddenTestCaseCount} hidden test case(s) used for judging
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <select
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
            value={languageId}
            onChange={(e) => setLanguageId(e.target.value)}
          >
            {(payload.languages || []).length === 0 ? (
              <option value="">No languages — sync in admin</option>
            ) : (
              (payload.languages || []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))
            )}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => submit('run')}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? 'Working…' : 'Run'}
          </button>
          <button
            type="button"
            disabled={busy || !active}
            onClick={() => submit('submit')}
            className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            title={!active ? 'Contest is not active' : 'Submit for judging'}
          >
            Submit
          </button>
        </div>
        {!active ? (
          <p className="mt-2 text-xs text-amber-700">
            Contest is outside its start/end window or not published — Submit is disabled. You can
            still use Run.
          </p>
        ) : null}

        <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200">
          <MonacoEditor
            height="360px"
            language={monacoLang(selectedLang?.name)}
            theme="vs-light"
            value={source}
            onChange={(v) => setSource(v || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Custom stdin (Run only)
          <textarea
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm"
            rows={3}
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
          />
        </label>

        {live ? (
          <div
            className={`mt-6 rounded-2xl border p-4 ${verdictColor(live.verdict || live.status)}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {livePending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <h2 className="text-sm font-semibold">
                Result:{' '}
                <span className="font-bold">{live.verdict || live.status || '…'}</span>
              </h2>
            </div>
            {statusNote ? <p className="mt-2 text-sm opacity-90">{statusNote}</p> : null}
            {live.error_message ? (
              <p className="mt-2 text-sm text-red-800">{live.error_message}</p>
            ) : null}
            <ul className="mt-3 space-y-2">
              {(live.results || []).length === 0 && livePending ? (
                <li className="rounded-xl border border-current/10 bg-white/60 px-3 py-2 text-sm">
                  Waiting for per-test results…
                </li>
              ) : null}
              {(live.results || []).map((r, idx) => {
                const caseNo = idx + 1;
                const label = r.is_hidden ? `Hidden test #${caseNo}` : `Sample test #${caseNo}`;
                return (
                  <li
                    key={r.id || `case-${caseNo}-${r.verdict}`}
                    className="rounded-xl border border-current/10 bg-white/70 px-3 py-2 text-sm text-neutral-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{label}</span>
                      <strong
                        className={
                          String(r.verdict || '').toLowerCase() === 'accepted'
                            ? 'text-emerald-700'
                            : String(r.verdict || '').toLowerCase().includes('wrong') ||
                                String(r.verdict || '').toLowerCase().includes('error')
                              ? 'text-red-700'
                              : ''
                        }
                      >
                        {r.verdict || r.status || '…'}
                      </strong>
                    </div>
                    {!r.is_hidden && r.stdout ? (
                      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs text-neutral-700">
                        {`Output:\n${r.stdout}`}
                      </pre>
                    ) : null}
                    {!r.is_hidden && r.stderr ? (
                      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs text-red-700">
                        {r.stderr}
                      </pre>
                    ) : null}
                    {r.is_hidden ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        Input/output hidden (admin test case #{caseNo} in problem order)
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="mt-8">
          <h2 className="text-sm font-semibold">Submission history</h2>
          <div className="mt-2 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Verdict</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-neutral-500" colSpan={4}>
                      No submissions yet.
                    </td>
                  </tr>
                ) : (
                  history.map((s) => (
                    <tr key={s.id} className="border-b border-neutral-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">{s.status}</td>
                      <td className="px-3 py-2 font-medium">{s.verdict || '—'}</td>
                      <td className="px-3 py-2">
                        {s.time_ms != null ? `${s.time_ms} ms` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VendorPortalShell>
  );
}
