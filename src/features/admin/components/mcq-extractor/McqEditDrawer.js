"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Sparkles, X } from "lucide-react";
import { parseJsonResponse, toastPromise } from "@/lib/toastAsync";
import { plainQuestionText, rewriteWithApi } from "@/lib/rewriteApi";
import { MathHtml } from "./MathContent";

/** Stable field component — must NOT be defined inside McqEditDrawer (fixes one-char typing bug). */
function DrawerField({ label, value, onChange, multiline, rows = 3 }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={rows}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm leading-relaxed"
        />
      ) : (
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
      )}
    </label>
  );
}

function RewriteUsage({ usage, model, note }) {
  if (!usage) return null;
  const promptTokens = usage.promptTokens ?? 0;
  const completionTokens = usage.completionTokens ?? 0;
  const cachedTokens = usage.cachedTokens ?? 0;
  const cachePct =
    promptTokens > 0 ? Math.round((cachedTokens / promptTokens) * 100) : 0;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[10px] text-neutral-600">
      <p className="mb-1.5 font-semibold text-neutral-800">API usage</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono tabular-nums text-neutral-800">
        {model && (
          <li>
            <span className="font-sans text-neutral-500">Model </span>
            {model}
          </li>
        )}
        <li>
          <span className="font-sans text-neutral-500">In </span>
          {promptTokens}
        </li>
        <li>
          <span className="font-sans text-neutral-500">Out </span>
          {completionTokens}
        </li>
        <li>
          <span className="font-sans text-neutral-500">Cached </span>
          {cachedTokens}
          {cachedTokens > 0 ? (
            <span className="font-sans text-emerald-700"> ({cachePct}%)</span>
          ) : (
            <span className="font-sans text-neutral-400"> (none)</span>
          )}
        </li>
      </ul>
      {note && <p className="mt-2 text-neutral-500 leading-snug">{note}</p>}
    </div>
  );
}

function RewriteCompare({ label, before, after, usage, model, note, onApply, onDiscard }) {
  if (!after) return null;
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-800">
        AI rewrite preview — {label}
      </p>
      <RewriteUsage usage={usage} model={model} note={note} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[10px] text-neutral-500">Before</p>
          <div className="max-h-32 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-2 text-xs text-neutral-700">
            {before ? (
              <span className="whitespace-pre-wrap">{stripTags(before)}</span>
            ) : (
              <span className="text-neutral-400">—</span>
            )}
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] text-emerald-700">After (plagiarism-safe)</p>
          <div className="max-h-32 overflow-y-auto rounded-lg border border-emerald-200 bg-white p-2 text-xs text-neutral-900">
            {label === "Solution" && /<[a-z]/i.test(after) ? (
              <MathHtml html={after} className="prose prose-xs max-w-none" />
            ) : (
              <span className="whitespace-pre-wrap">{after}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onApply}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
        >
          Apply rewrite
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

function stripTags(html) {
  return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function FieldWithRewrite({
  label,
  fieldKey,
  form,
  updateField,
  multiline,
  rows = 4,
  rewriteMode,
  originalField,
}) {
  const [rewriting, setRewriting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [rewriteMeta, setRewriteMeta] = useState(null);

  const runRewrite = async () => {
    const source =
      (originalField && form[originalField]) || form[fieldKey];
    const text = String(source || "").trim();
    if (!text) {
      toast.error("Nothing to rewrite");
      return;
    }
    setRewriting(true);
    setRewriteMeta(null);
    try {
      const plain =
        rewriteMode === "rewrite-question" ? plainQuestionText(text) : text;
      const result = await toastPromise(
        async () => {
          const r = await rewriteWithApi(
            rewriteMode,
            plain,
            rewriteMode === "rewrite-solution" ? 280 : 200
          );
          return r;
        },
        { loading: "Rewriting with AI…", success: "Preview ready", error: (e) => e.message }
      );
      setPreview(result.out);
      setRewriteMeta({
        usage: result.usage,
        model: result.model,
        note: result.note,
      });
    } finally {
      setRewriting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          {label}
        </span>
        <button
          type="button"
          onClick={runRewrite}
          disabled={rewriting}
          className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-50"
        >
          {rewriting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          Rewrite with AI
        </button>
      </div>
      {multiline ? (
        <textarea
          rows={rows}
          value={form[fieldKey] || ""}
          onChange={(e) => updateField(fieldKey, e.target.value)}
          className="w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm leading-relaxed"
        />
      ) : (
        <input
          value={form[fieldKey] || ""}
          onChange={(e) => updateField(fieldKey, e.target.value)}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
      )}
      <RewriteCompare
        label={label}
        before={(originalField && form[originalField]) || form[fieldKey]}
        after={preview}
        usage={rewriteMeta?.usage}
        model={rewriteMeta?.model}
        note={rewriteMeta?.note}
        onApply={() => {
          updateField(fieldKey, preview);
          setPreview(null);
          setRewriteMeta(null);
          toast.success("Applied");
        }}
        onDiscard={() => {
          setPreview(null);
          setRewriteMeta(null);
        }}
      />
    </div>
  );
}

export default function McqEditDrawer({ question, onSave, onClose }) {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(question)));

  const updateField = useCallback((key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Close editor"
        onClick={onClose}
        className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm"
      />
      <div className="fixed top-0 right-0 bottom-0 z-[100] flex w-full max-w-xl flex-col border-l border-neutral-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Edit question</h2>
            <p className="mt-0.5 font-mono text-xs text-neutral-500">{form._id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DrawerField
              label="Subject"
              value={form.subject}
              onChange={(v) => updateField("subject", v)}
            />
            <DrawerField
              label="Chapter"
              value={form.chapter}
              onChange={(v) => updateField("chapter", v)}
            />
            <DrawerField
              label="Topic"
              value={form.topic}
              onChange={(v) => updateField("topic", v)}
            />
            <DrawerField
              label="Category"
              value={form.category}
              onChange={(v) => updateField("category", v)}
            />
            <DrawerField
              label="Year"
              value={form.year}
              onChange={(v) => updateField("year", v)}
            />
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Difficulty
              </span>
              <select
                value={form.difficulty || "medium"}
                onChange={(e) => updateField("difficulty", e.target.value)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
          </div>
          <DrawerField
            label="Original (PDF)"
            value={form.original_question}
            onChange={(v) => updateField("original_question", v)}
            multiline
            rows={3}
          />
          <FieldWithRewrite
            label="Question (published)"
            fieldKey="question"
            form={form}
            updateField={updateField}
            multiline
            rows={5}
            rewriteMode="rewrite-question"
            originalField="original_question"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DrawerField
              label="Option A"
              value={form.options_A}
              onChange={(v) => updateField("options_A", v)}
              multiline
              rows={2}
            />
            <DrawerField
              label="Option B"
              value={form.options_B}
              onChange={(v) => updateField("options_B", v)}
              multiline
              rows={2}
            />
            <DrawerField
              label="Option C"
              value={form.options_C}
              onChange={(v) => updateField("options_C", v)}
              multiline
              rows={2}
            />
            <DrawerField
              label="Option D"
              value={form.options_D}
              onChange={(v) => updateField("options_D", v)}
              multiline
              rows={2}
            />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Correct option
            </span>
            <select
              value={form.correct_option || "A"}
              onChange={(e) => updateField("correct_option", e.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              {["A", "B", "C", "D"].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <FieldWithRewrite
            label="Solution"
            fieldKey="solution"
            form={form}
            updateField={updateField}
            multiline
            rows={6}
            rewriteMode="rewrite-solution"
          />
          <DrawerField
            label="Direction HTML"
            value={form.directionHTML}
            onChange={(v) => updateField("directionHTML", v)}
            multiline
            rows={3}
          />
        </div>
        <div className="flex shrink-0 gap-2 border-t border-neutral-200 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              onSave(form);
              onClose();
            }}
            className="flex-1 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
