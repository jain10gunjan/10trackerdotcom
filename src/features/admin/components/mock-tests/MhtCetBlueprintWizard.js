'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Check, ChevronRight, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { parseJsonResponse, toastPromise } from '@/lib/toastAsync';
import { mockTestAdminBase } from '@/features/mock-test/lib/mockTestAdminPaths';
import { mockTestHrefForSlug } from '@/lib/platformExams';

const STEPS = ['Physics', 'Chemistry', 'Mathematics', 'Create'];

function AuditTable({ audit }) {
  if (!audit) return null;
  const rows = audit.chapterRows || [];
  const diff = audit.difficulty;
  const split = audit.classSplit;
  return (
    <div className="mt-4 space-y-3">
      {audit.errors?.length ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Shortfall — test will not be created
          </p>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            {audit.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Blueprint OK for {audit.subject}: {audit.total} MCQs
          {split
            ? ` · Class 11 ${split.actual?.class11}/${split.target?.class11} · Class 12 ${split.actual?.class12}/${split.target?.class12}`
            : ''}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-3 py-2 font-medium">Chapter</th>
              <th className="px-3 py-2 font-medium">Class</th>
              <th className="px-3 py-2 font-medium">Target</th>
              <th className="px-3 py-2 font-medium">Picked</th>
              <th className="px-3 py-2 font-medium">Available</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className={r.shortfall > 0 ? 'bg-rose-50/60' : 'bg-white'}>
                <td className="px-3 py-1.5 text-neutral-800">{r.label || r.key}</td>
                <td className="px-3 py-1.5 text-neutral-500">{r.classLevel || '—'}</td>
                <td className="px-3 py-1.5">{r.target}</td>
                <td className="px-3 py-1.5">{r.actual}</td>
                <td className="px-3 py-1.5">{r.available}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {diff ? (
        <p className="text-xs text-neutral-500">
          Difficulty (soft): E {diff.actual?.easy}/{diff.target?.easy} · M {diff.actual?.medium}/
          {diff.target?.medium} · H {diff.actual?.hard}/{diff.target?.hard}
        </p>
      ) : null}
    </div>
  );
}

export default function MhtCetBlueprintWizard({ examcategory = 'mht-cet' }) {
  const base = mockTestAdminBase(examcategory);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [subjectResults, setSubjectResults] = useState({});
  const [addToMotd, setAddToMotd] = useState(true);
  const [createdTest, setCreatedTest] = useState(null);

  const excludedIdsFor = useCallback(
    (subject) => {
      const ids = [];
      for (const s of ['Physics', 'Chemistry', 'Mathematics']) {
        if (s === subject) continue;
        const r = subjectResults[s];
        if (r?.pickIds?.length) ids.push(...r.pickIds);
      }
      return ids;
    },
    [subjectResults]
  );

  const runSubjectPreview = useCallback(
    async (subject) => {
      setBusy(true);
      try {
        const res = await fetch('/api/mock-test/admin/mht-cet/preview', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examCategory: examcategory,
            subject,
            excludedIds: excludedIdsFor(subject),
          }),
        });
        const data = await parseJsonResponse(res);
        if (!data.success) throw new Error(data.error || 'Preview failed');
        setSubjectResults((prev) => ({ ...prev, [subject]: data }));
        if (!data.ok) toast.error(`${subject}: blueprint shortfall — see audit`);
        else toast.success(`${subject}: ${data.pickIds?.length || 0} questions ready`);
        return data;
      } catch (e) {
        toast.error(e.message || 'Preview failed');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [examcategory, excludedIdsFor]
  );

  const handleStartOrContinue = async () => {
    if (step >= 3) return;
    const subject = STEPS[step];
    const data = await runSubjectPreview(subject);
    if (data?.ok) setStep((s) => Math.min(s + 1, 3));
  };

  const handleCreate = async () => {
    const allOk = ['Physics', 'Chemistry', 'Mathematics'].every(
      (s) => subjectResults[s]?.ok && subjectResults[s]?.pickIds?.length === 50
    );
    if (!allOk) {
      toast.error('Complete all subjects without shortfalls first');
      return;
    }

    const questionIds = [
      ...subjectResults.Physics.pickIds,
      ...subjectResults.Chemistry.pickIds,
      ...subjectResults.Mathematics.pickIds,
    ];

    setBusy(true);
    try {
      await toastPromise(
        async () => {
          const res = await fetch('/api/mock-test/admin/mht-cet/create', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              examCategory: examcategory,
              questionIds,
              addToMotdPool: addToMotd,
            }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) throw new Error(data.error || 'Create failed');
          setCreatedTest(data.test);
          return data.message || 'Mock created';
        },
        {
          loading: 'Creating MHT-CET mock…',
          success: (msg) => msg,
          error: (e) => e.message || 'Create failed',
        }
      );
    } catch {
      /* toasted */
    } finally {
      setBusy(false);
    }
  };

  const currentSubject = step < 3 ? STEPS[step] : null;
  const currentAudit = currentSubject ? subjectResults[currentSubject]?.audit : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          One-click blueprint
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900">MHT-CET full mock</h1>
        <p className="mt-1 text-sm text-neutral-600">
          150 MCQs from the MHT-CET bank (50 Physics + 50 Chemistry + 50 Mathematics). Physics and
          Chemistry are 1 mark each, Mathematics is 2 marks. No negative marking. 180 minutes.
          Each subject is 10 Class 11 + 40 Class 12. Creation stops if a chapter is short.
        </p>
      </div>

      <ol className="mb-6 flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => {
          const done = i < 3 ? Boolean(subjectResults[label]?.ok) : Boolean(createdTest);
          const active = i === step;
          return (
            <li key={label} className="flex items-center gap-2">
              {i > 0 ? <ChevronRight className="h-3.5 w-3.5 text-neutral-300" /> : null}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  done
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : active
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : null}
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      {createdTest ? (
        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <p className="font-semibold text-neutral-900">Mock created</p>
          <p className="mt-1 text-sm text-neutral-600">{createdTest.name}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`${mockTestHrefForSlug(examcategory)}/attempt/${createdTest.id}`}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Open attempt
            </Link>
            <Link
              href={base}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800"
            >
              Back to admin
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          {step < 3 ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">{currentSubject}</h2>
                  <p className="text-sm text-neutral-500">
                    Preview 50 MCQs (10 Class 11, 40 Class 12) from the bank.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleStartOrContinue}
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {subjectResults[currentSubject]?.ok ? 'Re-roll & continue' : 'Generate & continue'}
                </button>
              </div>
              <AuditTable audit={currentAudit || subjectResults[currentSubject]?.audit} />
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-neutral-900">Create test</h2>
              <p className="mt-1 text-sm text-neutral-600">
                All three subjects passed audit. Create the 150-question mock (180 minutes, 200
                marks, no negative marking).
              </p>
              <ul className="mt-3 space-y-1 text-sm text-neutral-700">
                {['Physics', 'Chemistry', 'Mathematics'].map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    {s}: {subjectResults[s]?.pickIds?.length || 0} Q
                    {s === 'Mathematics' ? ' · 2 marks' : ' · 1 mark'}
                  </li>
                ))}
              </ul>
              <label className="mt-4 flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={addToMotd}
                  onChange={(e) => setAddToMotd(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                Add to Mock of the Day pool
              </label>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create MHT-CET mock
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStep(0)}
                  className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700"
                >
                  Start over
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <p className="mt-4 text-center text-sm text-neutral-500">
        <Link href={base} className="font-medium text-neutral-700 hover:underline">
          ← Back to {examcategory} mocks
        </Link>
      </p>
    </div>
  );
}
