"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MetaDataJobs from "@/components/ui/Seo";
import toast from "react-hot-toast";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  FileJson,
  Info,
} from "lucide-react";

const SAMPLE_JSON = `[
  {
    "topic": "sample-topic-slug",
    "category": "GATE-CSE",
    "subject": "Algorithms",
    "chapter": "Sorting",
    "difficulty": "easy",
    "year": 2024,
    "question": "<p>What is the time complexity of merge sort?</p>",
    "options_A": "O(n)",
    "options_B": "O(n log n)",
    "options_C": "O(n²)",
    "options_D": "O(log n)",
    "correct_option": "B",
    "solution": "Merge sort divides and merges in O(n log n) time."
  }
]`;

const CHUNK_DEFAULT = 100;

function extractArray(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
  if (parsed && Array.isArray(parsed.data)) return parsed.data;
  return null;
}

export default function AdminBulkQuestionsPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  const [jsonText, setJsonText] = useState("");
  const [chunkSize, setChunkSize] = useState(CHUNK_DEFAULT);
  const [mode, setMode] = useState("upsert");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [defaultTopic, setDefaultTopic] = useState("");
  const [defaultSubject, setDefaultSubject] = useState("");
  const [defaultChapter, setDefaultChapter] = useState("");
  const [defaultDifficulty, setDefaultDifficulty] = useState("");

  const [parseOk, setParseOk] = useState(null);
  const [parseCount, setParseCount] = useState(0);
  const [parseError, setParseError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [lastSummary, setLastSummary] = useState(null);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in?redirect=/admin/bulk-questions");
    }
  }, [loading, user, router]);

  const defaultsPayload = useMemo(() => {
    const d = {};
    if (defaultCategory.trim()) d.category = defaultCategory.trim();
    if (defaultTopic.trim()) d.topic = defaultTopic.trim();
    if (defaultSubject.trim()) d.subject = defaultSubject.trim();
    if (defaultChapter.trim()) d.chapter = defaultChapter.trim();
    if (defaultDifficulty.trim()) d.difficulty = defaultDifficulty.trim();
    return d;
  }, [
    defaultCategory,
    defaultTopic,
    defaultSubject,
    defaultChapter,
    defaultDifficulty,
  ]);

  const validateJson = useCallback(() => {
    setParseError("");
    setParseOk(null);
    setParseCount(0);
    const trimmed = jsonText.trim();
    if (!trimmed) {
      setParseError("Paste JSON first.");
      return false;
    }
    try {
      const parsed = JSON.parse(trimmed);
      const arr = extractArray(parsed);
      if (!arr) {
        setParseError("Use a JSON array or { \"questions\": [ ... ] }.");
        return false;
      }
      if (arr.length === 0) {
        setParseError("Array is empty.");
        return false;
      }
      setParseOk(true);
      setParseCount(arr.length);
      toast.success(`${arr.length} object(s) parsed`);
      return true;
    } catch (e) {
      setParseError(e?.message || "Invalid JSON");
      return false;
    }
  }, [jsonText]);

  const runImport = useCallback(async () => {
    setParseError("");
    setParseOk(null);
    setParseCount(0);
    let arr;
    try {
      const parsed = JSON.parse(jsonText.trim());
      arr = extractArray(parsed);
      if (!arr || arr.length === 0) {
        setParseError(arr ? "Array is empty." : 'Use a JSON array or { "questions": [] }.');
        toast.error("Invalid or empty payload");
        return;
      }
      setParseOk(true);
      setParseCount(arr.length);
    } catch (e) {
      setParseError(e?.message || "Invalid JSON");
      toast.error("Invalid JSON");
      return;
    }

    const size = Math.min(250, Math.max(1, Number(chunkSize) || CHUNK_DEFAULT));
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }

    setSubmitting(true);
    setLastSummary(null);
    setProgress({ done: 0, total: chunks.length });

    let totalSaved = 0;
    let totalSkipped = 0;
    const allErrors = [];

    try {
      for (let c = 0; c < chunks.length; c++) {
        const res = await fetch("/api/admin/examtracker-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questions: chunks[c],
            defaults: defaultsPayload,
            mode,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || `Batch ${c + 1} failed (${res.status})`);
        }
        totalSaved += data.savedCount ?? 0;
        totalSkipped += data.skippedInvalid ?? 0;
        if (Array.isArray(data.errors)) {
          allErrors.push(...data.errors);
        }
        setProgress({ done: c + 1, total: chunks.length });
      }

      setLastSummary({
        ok: true,
        totalSaved,
        totalSkipped,
        errors: allErrors.slice(0, 25),
      });
      toast.success(`Imported ${totalSaved} row(s)`);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Import failed");
      setLastSummary({
        ok: false,
        message: e?.message || "Import failed",
        errors: allErrors.slice(0, 25),
      });
    } finally {
      setSubmitting(false);
    }
  }, [jsonText, chunkSize, mode, defaultsPayload]);

  if (!loading && !isAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <MetaDataJobs seoTitle="Bulk questions" seoDescription="Admin bulk import" />
        <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <h1 className="text-lg font-semibold text-neutral-900">Admin only</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Sign in with an admin account to import questions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <MetaDataJobs
        seoTitle="Bulk questions import"
        seoDescription="Import examtracker questions from JSON"
      />
<div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          Bulk questions (JSON → Supabase)
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Paste a JSON array (or <code className="rounded bg-neutral-100 px-1">{"{ questions: [] }"}</code>
          ). Rows are validated, then sent in optimized batches to{" "}
          <code className="rounded bg-neutral-100 px-1">examtracker</code>.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-950 sm:flex-row sm:items-start">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
        <div className="space-y-2">
          <p className="font-medium">Tips</p>
          <ul className="list-inside list-disc space-y-1 text-blue-900/90">
            <li>
              Set <strong>SUPABASE_SERVICE_ROLE_KEY</strong> in <code>.env.local</code> for reliable
              server-side inserts (bypasses RLS).
            </li>
            <li>
              Required per row (unless filled by defaults): <strong>topic</strong>,{" "}
              <strong>category</strong>, <strong>question</strong>.
            </li>
            <li>
              <strong>_id</strong> optional — auto-generated UUID if omitted. Upsert uses{" "}
              <code>_id</code> as conflict key.
            </li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-neutral-900">JSON payload</span>
              <button
                type="button"
                onClick={() => setJsonText(SAMPLE_JSON)}
                className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <FileJson className="h-3.5 w-3.5" />
                Load sample
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[ { "topic": "...", "category": "GATE-CSE", "question": "..." } ]'
              className="min-h-[220px] w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 font-mono text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 sm:min-h-[320px] sm:text-sm"
              spellCheck={false}
            />
            {parseError && (
              <p className="mt-2 text-xs text-red-600">{parseError}</p>
            )}
            {parseOk && (
              <p className="mt-2 flex items-center gap-1 text-xs text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Valid JSON — {parseCount} object(s)
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-900">Defaults (optional)</h2>
            <p className="mb-3 text-xs text-neutral-500">
              Applied when a row omits these fields.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Category e.g. GATE-CSE"
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              />
              <input
                type="text"
                placeholder="Topic slug"
                value={defaultTopic}
                onChange={(e) => setDefaultTopic(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              />
              <input
                type="text"
                placeholder="Subject"
                value={defaultSubject}
                onChange={(e) => setDefaultSubject(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              />
              <input
                type="text"
                placeholder="Chapter"
                value={defaultChapter}
                onChange={(e) => setDefaultChapter(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              />
              <select
                value={defaultDifficulty}
                onChange={(e) => setDefaultDifficulty(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              >
                <option value="">Difficulty default (optional)</option>
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-900">Import options</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-600">Batch size</label>
                <input
                  type="number"
                  min={1}
                  max={250}
                  value={chunkSize}
                  onChange={(e) => setChunkSize(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-[11px] text-neutral-500">Max 250 per API call (server limit).</p>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600">Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                >
                  <option value="upsert">Upsert (on _id)</option>
                  <option value="insert">Insert only</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={validateJson}
                disabled={submitting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
              >
                Validate JSON
              </button>
              <button
                type="button"
                onClick={runImport}
                disabled={submitting || loading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import to DB
                  </>
                )}
              </button>
            </div>

            {submitting && progress.total > 0 && (
              <p className="mt-3 text-center text-xs text-neutral-600">
                Batch {progress.done} / {progress.total}
              </p>
            )}
          </div>
        </div>
      </div>

      {lastSummary && (
        <div
          className={`mt-6 rounded-2xl border p-4 text-sm ${
            lastSummary.ok
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {lastSummary.ok ? (
            <p className="font-medium">
              Saved ~{lastSummary.totalSaved} row(s). Skipped invalid:{" "}
              {lastSummary.totalSkipped}.
            </p>
          ) : (
            <p className="font-medium">{lastSummary.message}</p>
          )}
          {lastSummary.errors?.length > 0 && (
            <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto text-xs opacity-90">
              {lastSummary.errors.map((e, i) => (
                <li key={i}>
                  {typeof e === "object" ? `Row ${e.index}: ${e.error}` : String(e)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-4 text-xs text-neutral-600">
        <p className="font-semibold text-neutral-800">Allowed fields (whitelist)</p>
        <p className="mt-2 font-mono leading-relaxed">
          _id, topic, category, difficulty, year, subject, question, options_A–D, correct_option,
          solution, questionCode, questionImage, solutiontext, topicList, topic_list, chapter,
          order_index, directionHTML
        </p>
      </div>
    </div>
  );
}
