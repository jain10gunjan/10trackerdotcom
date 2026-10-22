'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Check, ChevronRight, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { parseJsonResponse, toastPromise } from '@/lib/toastAsync';
import { mockTestAdminBase } from '@/features/mock-test/lib/mockTestAdminPaths';
import { mockTestHrefForSlug } from '@/lib/platformExams';

const SUBJECTS = [
  { name: 'Physics', count: 60 },
  { name: 'Chemistry', count: 60 },
  { name: 'Mathematics', count: 60 },
];
const STEPS = [...SUBJECTS.map((s) => s.name), 'Create'];

function AuditTable({ audit }) {
  if (!audit) return null;
  const rows = audit.chapterRows || [];
  const diff = audit.difficulty;
  const puc = audit.puc;
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
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-3 py-2 font-medium">Chapter</th>
              <th className="px-3 py-2 font-medium">PUC</th>
              <th className="px-3 py-2 font-medium">Target</th>
              <th className="px-3 py-2 font-medium">Picked</th>
              <th className="px-3 py-2 font-medium">Available</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className={r.shortfall > 0 ? 'bg-rose-50/60' : 'bg-white'}>
                <td className="px-3 py-1.5 text-neutral-800">{r.label || r.key}</td>
                <td className="px-3 py-1.5">{r.puc === 1 ? 'I' : 'II'}</td>
                <td className="px-3 py-1.5">{r.target}</td>
                <td className="px-3 py-1.5">{r.actual}</td>
                <td className="px-3 py-1.5">{r.available}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {puc ? (
        <p className="text-xs text-neutral-500">
          PUC split (soft): I {puc.actual?.[1] ?? 0}/{puc.target?.[1] ?? 0} · II {puc.actual?.[2] ?? 0}/
          {puc.target?.[2] ?? 0}
        </p>
      ) : null}
      {diff ? (
        <p className="text-xs text-neutral-500">
          Difficulty (soft): E {diff.actual?.easy}/{diff.target?.easy} · M {diff.actual?.medium}/
          {diff.target?.medium} · H {diff.actual?.hard}/{diff.target?.hard}
        </p>
      ) : null}
    </div>
  );
}

export default function KcetBlueprintWizard({ examcategory = 'kcet' }) {
  const base = mockTestAdminBase(examcategory);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [subjectResults, setSubjectResults] = useState({});
  const [addToMotd, setAddToMotd] = useState(true);
  const [createdTest, setCreatedTest] = useState(null);

  const excludedIdsFor = useCallback(
    (subject) => {
      const ids = [];
      for (const s of SUBJECTS) {
        if (s.name === subject) continue;
        const result = subjectResults[s.name];
        if (result?.pickIds?.length) ids.push(...result.pickIds);
      }
      return ids;
    },
    [subjectResults]
  );

  const runSubjectPreview = useCallback(
    async (subject) => {
      setBusy(true);
      try {
        const res = await fetch('/api/mock-test/admin/kcet/preview', {
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
    if (step >= SUBJECTS.length) return;
    const data = await runSubjectPreview(SUBJECTS[step].name);
    if (data?.ok) setStep((s) => Math.min(s + 1, SUBJECTS.length));
  };

  const handleCreate = async () => {
    const allOk = SUBJECTS.every(
      (s) => subjectResults[s.name]?.ok && subjectResults[s.name]?.pickIds?.length === s.count
    );
    if (!allOk) {
      toast.error('Complete every section without shortfalls first');
      return;
    }
    const questionIds = SUBJECTS.flatMap((s) => subjectResults[s.name].pickIds);
    setBusy(true);
    try {
      await toastPromise(
        async () => {
          const res = await fetch('/api/mock-test/admin/kcet/create', {
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
          loading: 'Creating KCET mock…',
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

  const currentSubject = step < SUBJECTS.length ? SUBJECTS[step] : null;
  const currentAudit = currentSubject ? subjectResults[currentSubject.name]?.audit : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          One-click blueprint
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900">KCET full mock</h1>
        <p className="mt-1 text-sm text-neutral-600">
          180 MCQs, 180 marks, 240 minutes (three papers of 80 minutes). Physics, Chemistry, and
          Mathematics are 60 questions each, +1 with no negative marking. Questions come from the KCET
          bank, then JEE Main. Creation stops if a chapter is short.
        </p>
      </div>

      <ol className="mb-6 flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => {
          const done = i < SUBJECTS.length ? Boolean(subjectResults[label]?.ok) : Boolean(createdTest);
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
          {currentSubject ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">{currentSubject.name}</h2>
                  <p className="text-sm text-neutral-500">
                    Preview {currentSubject.count} MCQs from the bank for this section.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleStartOrContinue}
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {subjectResults[currentSubject.name]?.ok ? 'Re-roll & continue' : 'Generate & continue'}
                </button>
              </div>
              <AuditTable audit={currentAudit || subjectResults[currentSubject.name]?.audit} />
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-neutral-900">Create test</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Every section passed audit. Create the 180-question mock (240 minutes, 180 marks, no
                negative marking).
              </p>
              <ul className="mt-3 space-y-1 text-sm text-neutral-700">
                {SUBJECTS.map((s) => (
                  <li key={s.name} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    {s.name}: {subjectResults[s.name]?.pickIds?.length || 0} Q
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
              <button
                type="button"
                disabled={busy}
                onClick={handleCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create KCET mock
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
