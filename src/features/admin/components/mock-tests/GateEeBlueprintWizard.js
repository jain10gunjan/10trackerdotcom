'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Check, ChevronRight, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { parseJsonResponse, toastPromise } from '@/lib/toastAsync';
import { mockTestAdminBase } from '@/features/mock-test/lib/mockTestAdminPaths';
import { mockTestHrefForSlug } from '@/lib/platformExams';
import { GATE_EE_BLOCKS } from '@/features/mock-test/lib/gateEeBlueprint';

const BLOCK_STEPS = GATE_EE_BLOCKS.map((b) => ({ id: b.id, label: b.label }));
const CREATE_STEP = BLOCK_STEPS.length;

function AuditTable({ audit }) {
  if (!audit) return null;
  const rows = audit.slotRows || [];
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
          Blueprint OK for {audit.subject}: {audit.total} Q · {audit.marks} marks
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-3 py-2 font-medium">Slot</th>
              <th className="px-3 py-2 font-medium">Marks</th>
              <th className="px-3 py-2 font-medium">Target</th>
              <th className="px-3 py-2 font-medium">Picked</th>
              <th className="px-3 py-2 font-medium">Available</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={`${r.marks}-${r.key}`}
                className={r.shortfall > 0 ? 'bg-rose-50/60' : 'bg-white'}
              >
                <td className="px-3 py-1.5 font-mono text-neutral-800">{r.key}</td>
                <td className="px-3 py-1.5">{r.marks}</td>
                <td className="px-3 py-1.5">{r.target}</td>
                <td className="px-3 py-1.5">{r.actual}</td>
                <td className="px-3 py-1.5">{r.available}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function GateEeBlueprintWizard({ examcategory = 'gate-ee' }) {
  const base = mockTestAdminBase(examcategory);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [blockResults, setBlockResults] = useState({});
  const [addToMotd, setAddToMotd] = useState(true);
  const [createdTest, setCreatedTest] = useState(null);

  const excludedIdsFor = useCallback(
    (blockId) => {
      const ids = [];
      for (const b of BLOCK_STEPS) {
        if (b.id === blockId) continue;
        const r = blockResults[b.id];
        if (r?.pickIds?.length) ids.push(...r.pickIds);
      }
      return ids;
    },
    [blockResults]
  );

  const runBlockPreview = useCallback(
    async (blockId) => {
      setBusy(true);
      try {
        const res = await fetch('/api/mock-test/admin/gate-ee/preview', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examCategory: examcategory,
            blockId,
            excludedIds: excludedIdsFor(blockId),
          }),
        });
        const data = await parseJsonResponse(res);
        if (!data.success) throw new Error(data.error || 'Preview failed');
        setBlockResults((prev) => ({
          ...prev,
          [blockId]: data,
        }));
        const label = BLOCK_STEPS.find((b) => b.id === blockId)?.label || blockId;
        if (!data.ok) {
          toast.error(`${label}: blueprint shortfall — see audit`);
        } else {
          toast.success(`${label}: ${data.pickIds?.length || 0} questions ready`);
        }
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
    if (step >= CREATE_STEP) return;
    const block = BLOCK_STEPS[step];
    const data = await runBlockPreview(block.id);
    if (data?.ok) {
      setStep((s) => Math.min(s + 1, CREATE_STEP));
    }
  };

  const handleCreate = async () => {
    const allOk = BLOCK_STEPS.every((b) => blockResults[b.id]?.ok);
    if (!allOk) {
      toast.error('Complete all subjects without shortfalls first');
      return;
    }

    const questionIds = [];
    const pickMeta = [];
    for (const b of BLOCK_STEPS) {
      const r = blockResults[b.id];
      (r.picks || []).forEach((p) => {
        questionIds.push(p.id);
        pickMeta.push({
          id: p.id,
          marks: p.marks,
          blueprintKey: p.blueprintKey,
          blockId: b.id,
        });
      });
      if (!r.picks?.length && r.pickIds?.length) {
        r.pickIds.forEach((id) => {
          questionIds.push(id);
          pickMeta.push({ id, marks: 1, blockId: b.id });
        });
      }
    }

    setBusy(true);
    try {
      await toastPromise(
        async () => {
          const res = await fetch('/api/mock-test/admin/gate-ee/create', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              examCategory: examcategory,
              questionIds,
              pickMeta,
              addToMotdPool: addToMotd,
            }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) {
            throw new Error(data.error || 'Create failed');
          }
          setCreatedTest(data.test);
          return data.message || 'Mock created';
        },
        {
          loading: 'Creating GATE EE mock…',
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

  const currentBlock = step < CREATE_STEP ? BLOCK_STEPS[step] : null;
  const currentAudit = currentBlock
    ? blockResults[currentBlock.id]?.audit
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          One-click blueprint
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900">GATE EE full mock</h1>
        <p className="mt-1 text-sm text-neutral-600">
          65 questions from examtracker (100 marks, 180 min). Continues subject by subject; stops
          with an audit if any slot is short. MCQ −m/3; NAT wrong = 0.
        </p>
      </div>

      <ol className="mb-6 flex flex-wrap items-center gap-1.5">
        {[...BLOCK_STEPS.map((b) => b.label), 'Create'].map((label, i) => {
          const blockId = i < BLOCK_STEPS.length ? BLOCK_STEPS[i].id : null;
          const done =
            i < BLOCK_STEPS.length
              ? Boolean(blockResults[blockId]?.ok)
              : Boolean(createdTest);
          const active = i === step;
          return (
            <li key={label} className="flex items-center gap-1.5">
              {i > 0 ? <ChevronRight className="h-3 w-3 text-neutral-300" /> : null}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  done
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : active
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {done ? <Check className="h-2.5 w-2.5" /> : null}
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
          {step < CREATE_STEP ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    {currentBlock?.label}
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Preview this subject block from the bank.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleStartOrContinue}
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {blockResults[currentBlock?.id]?.ok
                    ? 'Re-roll & continue'
                    : 'Generate & continue'}
                </button>
              </div>
              <AuditTable
                audit={currentAudit || blockResults[currentBlock?.id]?.audit}
              />
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-neutral-900">Create test</h2>
              <p className="mt-1 text-sm text-neutral-600">
                All subjects passed audit. Create the 65-question mock (180 minutes, 100 marks).
              </p>
              <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm text-neutral-700">
                {BLOCK_STEPS.map((b) => (
                  <li key={b.id} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    {b.label}: {blockResults[b.id]?.pickIds?.length || 0} Q
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
                  Create GATE EE mock
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
