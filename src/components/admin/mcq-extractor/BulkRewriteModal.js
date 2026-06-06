"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Database, Loader2, Sparkles, X } from "lucide-react";
import { plainQuestionText, rewriteBulkWithApi, extractStem } from "@/lib/rewriteApi";
import {
  BULK_SCOPE,
  resolveBulkTarget,
  scopeLabel,
} from "@/lib/bulkRewriteTarget";
import { MathHtml } from "./MathContent";

const BATCH_OPTIONS = [10, 15, 20];

function stripTags(html) {
  return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function CompareCell({ label, tone, children, html }) {
  const toneClass =
    tone === "after"
      ? "border-emerald-200 bg-white"
      : "border-neutral-200 bg-neutral-50/80";
  const labelClass =
    tone === "after" ? "text-emerald-700" : "text-neutral-500";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className={`mb-1.5 text-[10px] font-semibold uppercase tracking-wide ${labelClass}`}>
        {label}
      </p>
      <div
        className={`min-h-[4.5rem] max-h-40 flex-1 overflow-y-auto rounded-lg border p-3 text-xs leading-relaxed text-neutral-800 ${toneClass}`}
      >
        {children ??
          (html && /<[a-z]/i.test(html) ? (
            <MathHtml html={html} className="prose prose-xs max-w-none" />
          ) : (
            <span className="whitespace-pre-wrap">{html || "—"}</span>
          ))}
      </div>
    </div>
  );
}

/** Side-by-side compare panels (same layout as drawer RewriteCompare). */
function SideBySideCompare({ title, before, after, isSolution }) {
  if (!after) return null;
  const beforeText = isSolution ? before : stripTags(before);
  const afterText = isSolution && /<[a-z]/i.test(after) ? null : after;

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
        {title}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <CompareCell label="Before" tone="before" html={isSolution ? before : undefined}>
          {!isSolution && (
            <span className="whitespace-pre-wrap">
              {beforeText || <span className="text-neutral-400">—</span>}
            </span>
          )}
        </CompareCell>
        <CompareCell
          label="After (plagiarism-safe)"
          tone="after"
          html={isSolution ? after : undefined}
        >
          {!isSolution && (
            <span className="whitespace-pre-wrap">{afterText}</span>
          )}
        </CompareCell>
      </div>
    </div>
  );
}

function RewriteResultCard({ result, rewriteQuestions, rewriteSolutions }) {
  if (result.status !== "ok") {
    return (
      <li className="rounded-xl border border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-neutral-500 truncate">{result._id}</span>
          <span
            className={`shrink-0 text-xs font-medium ${
              result.status === "error" ? "text-red-600" : "text-neutral-500"
            }`}
          >
            {result.status}
            {result.error ? ` — ${result.error}` : ""}
          </span>
        </div>
      </li>
    );
  }

  return (
    <li className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="font-mono text-[11px] text-neutral-500">{result._id}</p>
      {rewriteQuestions && result.questionAfter && (
        <SideBySideCompare
          title="Question"
          before={result.questionBefore}
          after={result.questionAfter}
          isSolution={false}
        />
      )}
      {rewriteSolutions && result.solutionAfter && (
        <SideBySideCompare
          title="Solution"
          before={result.solutionBefore}
          after={result.solutionAfter}
          isSolution
        />
      )}
    </li>
  );
}

export default function BulkRewriteModal({
  open,
  mcqs,
  nextStartIndex = 0,
  lastFetchCount = 0,
  onClose,
  onApply,
  onSaveRewritten,
  savingDb = false,
}) {
  const [batchSize, setBatchSize] = useState(10);
  const [scope, setScope] = useState(BULK_SCOPE.CONTINUE);
  const [rewriteQuestions, setRewriteQuestions] = useState(true);
  const [rewriteSolutions, setRewriteSolutions] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState([]);
  const [batchUsage, setBatchUsage] = useState(null);
  const [openAiCalls, setOpenAiCalls] = useState(null);
  const [applied, setApplied] = useState(false);
  const [lastTargetMeta, setLastTargetMeta] = useState(null);

  const targetRange = useMemo(
    () =>
      resolveBulkTarget(mcqs, {
        scope,
        batchSize,
        nextStartIndex,
        lastFetchCount,
      }),
    [mcqs, scope, batchSize, nextStartIndex, lastFetchCount]
  );

  const targetList = targetRange.list;

  const okResults = useMemo(
    () => results.filter((r) => r.status === "ok"),
    [results]
  );

  const maxAvailable = useMemo(() => {
    if (scope === BULK_SCOPE.FROM_START) return mcqs.length;
    if (scope === BULK_SCOPE.LAST_LOADED) {
      return Math.min(lastFetchCount || mcqs.length, mcqs.length);
    }
    return Math.max(0, mcqs.length - nextStartIndex);
  }, [scope, mcqs.length, lastFetchCount, nextStartIndex]);

  const batchSizeOptions = useMemo(() => {
    const opts = BATCH_OPTIONS.filter((n) => n <= maxAvailable);
    return opts.length ? opts : maxAvailable > 0 ? [maxAvailable] : [10];
  }, [maxAvailable]);

  const defaultScopeOnOpen = useMemo(() => {
    if (nextStartIndex > 0 && nextStartIndex < mcqs.length) {
      return BULK_SCOPE.CONTINUE;
    }
    if (lastFetchCount > 0 && mcqs.length > lastFetchCount) {
      return BULK_SCOPE.LAST_LOADED;
    }
    return BULK_SCOPE.CONTINUE;
  }, [nextStartIndex, lastFetchCount, mcqs.length]);

  useEffect(() => {
    if (!open) return;
    setResults([]);
    setBatchUsage(null);
    setOpenAiCalls(null);
    setApplied(false);
    setLastTargetMeta(null);
    setScope(defaultScopeOnOpen);
    const preferred = batchSizeOptions.includes(10)
      ? 10
      : batchSizeOptions[batchSizeOptions.length - 1] ?? 10;
    setBatchSize(Math.min(preferred, maxAvailable || preferred));
  }, [open, defaultScopeOnOpen, batchSizeOptions, maxAvailable]);

  const applyMeta = useCallback(
    () =>
      lastTargetMeta ?? {
        startIndex: targetRange.start,
        endIndex: targetRange.end,
      },
    [lastTargetMeta, targetRange.start, targetRange.end]
  );

  const notifyApply = useCallback(
    (updates) => {
      onApply(updates, applyMeta());
    },
    [onApply, applyMeta]
  );

  const buildUpdates = useCallback(() => {
    return okResults.map((r) => ({
      _id: r._id,
      question: r.questionAfter ?? undefined,
      solution: r.solutionAfter ?? undefined,
    }));
  }, [okResults]);

  const runBulk = useCallback(async () => {
    if (!rewriteQuestions && !rewriteSolutions) {
      toast.error("Select at least one rewrite type");
      return;
    }
    if (!targetList.length) {
      toast.error(
        scope === BULK_SCOPE.CONTINUE && nextStartIndex >= mcqs.length
          ? "All loaded questions are already processed — load more or choose another scope"
          : "No questions in this batch — change scope or batch size"
      );
      return;
    }
    setLastTargetMeta({
      startIndex: targetRange.start,
      endIndex: targetRange.end,
    });
    setRunning(true);
    setResults([]);
    setBatchUsage(null);
    setOpenAiCalls(null);
    setApplied(false);
    setProgress({ done: 0, total: targetList.length });

    const questionPayload = rewriteQuestions
      ? targetList
          .filter((q) => plainQuestionText(q.question ?? "").trim())
          .map((q) => ({
            id: q._id,
            text: plainQuestionText(q.question),
          }))
      : [];

    const solutionPayload = rewriteSolutions
      ? targetList
          .filter((q) => String(q.solution ?? "").trim())
          .map((q) => ({ id: q._id, text: String(q.solution) }))
      : [];

    try {
      const bulk = await rewriteBulkWithApi({
        questions: questionPayload,
        solutions: solutionPayload,
        rewriteQuestions,
        rewriteSolutions,
      });

      setBatchUsage(bulk.usage ?? null);
      setOpenAiCalls(bulk.openAiCalls ?? null);

      const processed = targetList.map((q) => {
        const entry = {
          _id: q._id,
          status: "pending",
          error: null,
          questionBefore: q.question ?? "",
          questionAfter: null,
          solutionBefore: q.solution ?? "",
          solutionAfter: null,
          usage: null,
        };

        const qRes = bulk.questionResults?.[q._id];
        const sRes = bulk.solutionResults?.[q._id];

        if (rewriteQuestions && entry.questionBefore.trim()) {
          if (qRes?.ok && qRes.rewritten) {
            entry.questionAfter =
              extractStem(qRes.rewritten) || qRes.rewritten;
          } else if (qRes && !qRes.ok) {
            entry.error = qRes.error || "Question rewrite failed";
          }
        }

        if (rewriteSolutions && String(entry.solutionBefore).trim()) {
          if (sRes?.ok && sRes.rewritten) {
            entry.solutionAfter = sRes.rewritten.trim();
          } else if (sRes && !sRes.ok) {
            entry.error = entry.error
              ? `${entry.error}; ${sRes.error || "Solution rewrite failed"}`
              : sRes.error || "Solution rewrite failed";
          }
        }

        const wantedQ = rewriteQuestions && entry.questionBefore.trim();
        const wantedS = rewriteSolutions && String(entry.solutionBefore).trim();
        const gotQ = !wantedQ || Boolean(entry.questionAfter);
        const gotS = !wantedS || Boolean(entry.solutionAfter);

        if (wantedQ || wantedS) {
          if (gotQ && gotS) {
            entry.status = "ok";
          } else if (!gotQ && !gotS) {
            entry.status = "error";
            entry.error = entry.error || "Rewrite failed";
          } else {
            entry.status = "error";
            entry.error =
              entry.error ||
              (wantedQ && !gotQ ? "Question missing" : "Solution missing");
          }
        } else {
          entry.status = "skipped";
          entry.error = "Nothing to rewrite";
        }

        return entry;
      });

      setProgress({ done: targetList.length, total: targetList.length });
      setResults(processed);
      const ok = processed.filter((r) => r.status === "ok").length;
      const calls = bulk.openAiCalls;
      toast.success(
        `Bulk rewrite: ${ok}/${targetList.length} ok` +
          (calls != null ? ` (${calls} OpenAI call${calls === 1 ? "" : "s"})` : "") +
          (bulk.usedFallback ? " — used per-item fallback" : "")
      );
    } catch (e) {
      toast.error(e.message || "Bulk rewrite failed");
    } finally {
      setRunning(false);
    }
  }, [
    targetList,
    targetRange.start,
    targetRange.end,
    rewriteQuestions,
    rewriteSolutions,
    scope,
    nextStartIndex,
    mcqs.length,
  ]);

  const applyToList = useCallback(() => {
    const updates = buildUpdates();
    if (!updates.length) {
      toast.error("No successful rewrites to apply");
      return;
    }
    notifyApply(updates);
    setApplied(true);
    toast.success(
      `Applied ${updates.length} rewrite(s) (rows ${targetRange.start + 1}–${targetRange.end})`
    );
  }, [buildUpdates, notifyApply, targetRange.start, targetRange.end]);

  const saveRewrittenToDb = useCallback(async () => {
    const updates = buildUpdates();
    if (!updates.length) {
      toast.error("No successful rewrites to save");
      return;
    }
    if (!onSaveRewritten) {
      toast.error("Save handler not available");
      return;
    }
    try {
      notifyApply(updates);
      setApplied(true);
      await onSaveRewritten(updates);
    } catch {
      /* toast from parent */
    }
  }, [buildUpdates, notifyApply, onSaveRewritten]);

  const applyAndSave = useCallback(async () => {
    const updates = buildUpdates();
    if (!updates.length) {
      toast.error("No successful rewrites to apply");
      return;
    }
    notifyApply(updates);
    setApplied(true);
    try {
      await onSaveRewritten(updates);
      onClose();
    } catch {
      /* keep modal open on failure */
    }
  }, [buildUpdates, notifyApply, onSaveRewritten, onClose]);

  if (!open) return null;

  const totalUsage = batchUsage ?? {
    promptTokens: 0,
    completionTokens: 0,
    cachedTokens: 0,
  };

  const busy = running || savingDb;

  return (
    <>
      <button
        type="button"
        aria-label="Close bulk rewrite"
        className="fixed inset-0 z-[110] bg-black/50"
        onClick={busy ? undefined : onClose}
      />
      <div className="fixed inset-3 z-[111] mx-auto flex max-w-5xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(92vh,800px)] sm:w-[min(96vw,1024px)] sm:-translate-x-1/2 sm:-translate-y-1/2">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Bulk AI rewrite</h2>
            <p className="text-xs text-neutral-500">
              Target a slice of the loaded list (not the whole DB). After apply/save, the next
              batch continues from where you left off.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-2 hover:bg-neutral-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 space-y-3 border-b border-neutral-100 px-5 py-4">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex min-w-[11rem] flex-col gap-1 text-xs">
              <span className="font-medium text-neutral-600">Which questions</span>
              <select
                value={scope}
                disabled={busy}
                onChange={(e) => setScope(e.target.value)}
                className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
              >
                <option value={BULK_SCOPE.CONTINUE}>
                  {scopeLabel(BULK_SCOPE.CONTINUE)}
                </option>
                <option
                  value={BULK_SCOPE.LAST_LOADED}
                  disabled={!lastFetchCount || mcqs.length <= 0}
                >
                  {scopeLabel(BULK_SCOPE.LAST_LOADED)}
                </option>
                <option value={BULK_SCOPE.FROM_START}>
                  {scopeLabel(BULK_SCOPE.FROM_START)}
                </option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-neutral-600">Batch size</span>
              <select
                value={batchSize}
                disabled={busy}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
              >
                {batchSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={rewriteQuestions}
                disabled={busy}
                onChange={(e) => setRewriteQuestions(e.target.checked)}
              />
              Rewrite questions
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={rewriteSolutions}
                disabled={busy}
                onChange={(e) => setRewriteSolutions(e.target.checked)}
              />
              Rewrite solutions
            </label>
          </div>
          <p className="text-[10px] text-neutral-500">
            {targetRange.count > 0 ? (
              <>
                Targeting{" "}
                <span className="font-medium text-neutral-700">
                  rows {targetRange.start + 1}–{targetRange.end}
                </span>{" "}
                of {mcqs.length} loaded
                {nextStartIndex > 0 && scope === BULK_SCOPE.CONTINUE ? (
                  <span> · next batch after row {nextStartIndex}</span>
                ) : null}
                {lastFetchCount > 0 && scope === BULK_SCOPE.LAST_LOADED ? (
                  <span> · last fetch added {lastFetchCount}</span>
                ) : null}
              </>
            ) : (
              <span className="text-amber-700">
                No rows in this batch — switch scope, load more questions, or reset by reloading
                the chapter.
              </span>
            )}
          </p>
          <p className="text-[10px] text-neutral-400">
            One server request; OpenAI batched ~12 items per call.
          </p>
          <button
            type="button"
            disabled={busy || !targetRange.count}
            onClick={runBulk}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {running
              ? "Rewriting batch (single API request)…"
              : `Start bulk rewrite (${targetRange.count})`}
          </button>
          {results.length > 0 && (
            <p className="text-xs text-neutral-600">
              Total usage — In: {totalUsage.promptTokens ?? 0}, Out:{" "}
              {totalUsage.completionTokens ?? 0}, Cached: {totalUsage.cachedTokens ?? 0}
              {openAiCalls != null
                ? ` · ${openAiCalls} OpenAI call${openAiCalls === 1 ? "" : "s"}`
                : ""}
              {applied ? " · Applied to list" : ""}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {results.length === 0 && !running && (
            <p className="text-sm text-neutral-500">
              Results appear below with side-by-side before/after panels.
            </p>
          )}
          <ul className="space-y-4">
            {results.map((r) => (
              <RewriteResultCard
                key={r._id}
                result={r}
                rewriteQuestions={rewriteQuestions}
                rewriteSolutions={rewriteSolutions}
              />
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-neutral-200 px-5 py-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={busy || !okResults.length}
            onClick={applyToList}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 disabled:opacity-50 sm:flex-1"
          >
            Apply to list only
          </button>
          <button
            type="button"
            disabled={busy || !okResults.length || !onSaveRewritten}
            onClick={saveRewrittenToDb}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 disabled:opacity-50 sm:flex-1"
          >
            {savingDb ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Save all rewritten to DB
          </button>
          <button
            type="button"
            disabled={busy || !okResults.length || !onSaveRewritten}
            onClick={applyAndSave}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:flex-1"
          >
            {savingDb ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Apply &amp; save to DB
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
