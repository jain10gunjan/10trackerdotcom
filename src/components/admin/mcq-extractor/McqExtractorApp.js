"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileJson,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
  Upload,
  Database,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  MCQ_EXTRACTOR_PROXY_BASE,
  toMcqProxyUrl,
  drainSseBuffer,
  extractSettingsFromExam,
  mergeMcqLists,
  normalizeMcqList,
  parseExtractPayload,
  processSseEvent,
  stripHtml,
} from "@/lib/mcqExtractor";
import {
  categoryForDb,
  examtrackerRowToMcq,
  mcqToExamtrackerPayload,
} from "@/lib/examtrackerAdmin";
import { parseJsonResponse, toastPromise } from "@/lib/toastAsync";
import { McqMathProvider, MathHtml } from "./MathContent";
import McqEditDrawer from "./McqEditDrawer";
import BulkRewriteModal from "./BulkRewriteModal";

const API_BASE = MCQ_EXTRACTOR_PROXY_BASE;
const REVIEW_PAGE_SIZES = [10, 20, 50, 100, 200, 500];

function Spinner({ className = "h-3.5 w-3.5" }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

function Chip({ label, active }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        active
          ? "bg-neutral-900 text-white"
          : "bg-neutral-100 text-neutral-600 border border-neutral-200"
      }`}
    >
      {label}
    </span>
  );
}

function QText({ text, className = "" }) {
  if (!text) return null;
  const hasHtml = /<[a-z][\s\S]*>/i.test(text);
  if (
    hasHtml &&
    !text.includes("[IMAGE]") &&
    !text.includes("[This question contains")
  ) {
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }
  if (!text.includes("[IMAGE]") && !text.includes("[This question contains")) {
    return <span className={className}>{text}</span>;
  }
  const parts = text.split(/(\[This question contains[^\]]+\])/g);
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.startsWith("[This question contains") ? (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800 align-middle mx-1"
          >
            Image · {p.replace(/^\[/, "").replace(/\]$/, "")}
          </span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </span>
  );
}

function QuestionBlock({ label, sublabel, text }) {
  if (!text) return null;
  return (
    <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </span>
        {sublabel && (
          <span className="text-[10px] text-neutral-400">{sublabel}</span>
        )}
      </div>
      <div className="text-sm font-medium leading-relaxed text-neutral-900 sm:text-[15px]">
        <QText text={text} />
      </div>
    </section>
  );
}

function SavedOutputs() {
  const [files, setFiles] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/outputs`, { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setFiles(d.files || []);
    } catch (e) {
      toast.error(e.message || "Could not load saved outputs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto mt-4 flex w-full max-w-md items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
      >
        Previously saved outputs
      </button>
    );
  }

  return (
    <div className="mx-auto mt-4 w-full max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2.5">
        <span className="text-xs font-medium text-neutral-700">
          Saved outputs ({files.length})
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="text-xs text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
          >
            {loading ? "…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {files.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-neutral-500">
            No saved outputs yet
          </p>
        ) : (
          files.map((f) => (
            <div
              key={f.id || f.filename}
              className="flex items-center justify-between gap-2 border-b border-neutral-50 px-3 py-2 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[10px] text-neutral-800">
                  {f.source_pdf || f.filename}
                </p>
                <p className="text-[10px] text-neutral-500">
                  {f.total_mcqs} MCQs · {f.size_kb}KB
                  {f.extracted_at
                    ? ` · ${new Date(f.extracted_at).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <a
                href={toMcqProxyUrl(f.downloadUrl)}
                download
                className="shrink-0 rounded-lg border border-neutral-200 px-2 py-1 text-[10px] font-medium text-neutral-700 hover:bg-neutral-50"
              >
                ↓
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ExtractPanel({
  onDone,
  onChunk,
  onStart,
  onFinish,
  platformExams,
  selectedExamSlug,
  onSelectExam,
}) {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [settings, setSettings] = useState({
    id_prefix: "MCQ",
    start_number: 1,
    subject: "General Studies",
    chapter: "",
    category: "PYQ",
    default_topic: "general",
  });
  const inputRef = useRef();
  const logsRef = useRef();

  useEffect(() => {
    if (!selectedExamSlug || !platformExams?.length) return;
    const exam = platformExams.find((e) => e.slug === selectedExamSlug);
    if (!exam) return;
    const derived = extractSettingsFromExam(exam);
    setSettings((s) => ({ ...s, ...derived }));
  }, [selectedExamSlug, platformExams]);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") {
      setFile(f);
      setLogs([]);
    }
  }, []);

  const extract = async () => {
    if (!file || running) return;
    setRunning(true);
    setLogs([]);
    onStart?.();
    const form = new FormData();
    form.append("pdf", file);
    Object.entries(settings).forEach(([k, v]) => form.append(k, String(v)));

    const tid = toast.loading("Extracting MCQs…");
    let finished = false;
    let downloadRef = null;

    const handleEvent = (event, data) => {
      if (event === "status") {
        setLogs((p) => [
          ...p,
          { msg: data.message, ok: data.message?.startsWith("✓") },
        ]);
      } else if (event === "chunk") {
        const { mcqs: chunk } = parseExtractPayload(data);
        if (chunk.length) onChunk?.(chunk, data.total_so_far);
      } else if (event === "error") {
        toast.error(data.message, { id: tid });
        setRunning(false);
        throw new Error(data.message);
      } else if (event === "done") {
        const { mcqs } = parseExtractPayload(data);
        finished = true;
        setRunning(false);
        if (mcqs.length > 0) {
          toast.success(`${data.total_mcqs ?? mcqs.length} MCQs extracted`, {
            id: tid,
          });
          onDone({ ...data, mcqs });
        } else if (data.total_mcqs > 0) {
          toast.success(`${data.total_mcqs} MCQs extracted`, { id: tid });
          onDone(data);
        } else if (data.downloadUrl || data.outputId) {
          downloadRef = data;
        } else {
          toast.error("Extraction finished but no MCQs were returned.", {
            id: tid,
          });
        }
      }
    };

    try {
      const r = await fetch(`${API_BASE}/extract`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!r.ok) throw new Error(`Server error (${r.status})`);
      if (!r.body) throw new Error("No response stream from server");

      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (value) buf += dec.decode(value, { stream: true });
        buf = drainSseBuffer(buf, handleEvent);
        if (done) break;
      }
      if (buf.trim()) processSseEvent(buf, handleEvent);

      if (!finished && downloadRef) {
        const url =
          downloadRef.downloadUrl || `/api/download/${downloadRef.outputId}`;
        const dl = await fetch(toMcqProxyUrl(url), { credentials: "include" });
        if (!dl.ok) throw new Error(`Failed to load results (${dl.status})`);
        const doc = await dl.json();
        const { mcqs, meta } = parseExtractPayload(doc);
        if (!mcqs.length) throw new Error("Downloaded file contains no MCQs");
        finished = true;
        toast.success(`${mcqs.length} MCQs extracted`, { id: tid });
        setRunning(false);
        onDone({ ...(meta || downloadRef), mcqs });
      }

      if (!finished) {
        toast.error(
          "Stream ended before results were received. Check server logs.",
          { id: tid }
        );
        setRunning(false);
      }
    } catch (e) {
      if (e.message !== "Abort") toast.error(e.message, { id: tid });
      setRunning(false);
    } finally {
      onFinish?.();
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => !running && inputRef.current?.click()}
        className={`mb-5 cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          running
            ? "cursor-not-allowed opacity-50 border-neutral-200"
            : drag
              ? "border-neutral-900 bg-neutral-50"
              : file
                ? "border-emerald-300 bg-emerald-50/50"
                : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          hidden
          onChange={(e) => {
            if (e.target.files[0]) {
              setFile(e.target.files[0]);
              setLogs([]);
            }
          }}
        />
        <Upload className="mx-auto mb-2 h-8 w-8 text-neutral-400" />
        {file ? (
          <>
            <p className="text-sm font-semibold text-neutral-900">{file.name}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-neutral-900">Drop your PDF</p>
            <p className="mt-1 text-xs text-neutral-500">
              or click to browse · 50 MB max
            </p>
          </>
        )}
      </div>

      {platformExams?.length > 0 && (
        <label className="mb-4 flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Platform exam
          </span>
          <select
            value={selectedExamSlug}
            onChange={(e) => onSelectExam?.(e.target.value)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          >
            {platformExams.map((exam) => (
              <option key={exam.slug} value={exam.slug}>
                {exam.name}
                {exam.is_active === false ? " (inactive)" : ""}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-neutral-500">
            Fills subject, category, and default topic from the exam catalog.
          </p>
        </label>
      )}

      <details className="mb-5 rounded-xl border border-neutral-200 bg-white group">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs text-neutral-600">
          <span className="font-medium text-neutral-800">Settings</span>
          <span>
            {settings.default_topic} · {settings.category}
          </span>
        </summary>
        <div className="grid grid-cols-1 gap-3 border-t border-neutral-100 px-4 pb-4 pt-3 sm:grid-cols-2">
          {[
            { key: "subject", label: "Subject", placeholder: "General Studies" },
            { key: "chapter", label: "Chapter", placeholder: "Modern India" },
            { key: "category", label: "Category", placeholder: "PYQ or Non-PYQ" },
            { key: "default_topic", label: "Default topic", placeholder: "modern-india" },
            { key: "id_prefix", label: "ID prefix", placeholder: "MCQ" },
            { key: "start_number", label: "Start number", placeholder: "1", type: "number" },
          ].map(({ key, label, placeholder, type }) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                {label}
              </span>
              <input
                value={settings[key]}
                type={type || "text"}
                placeholder={placeholder}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    [key]:
                      type === "number"
                        ? e.target.value === ""
                          ? ""
                          : Number(e.target.value)
                        : e.target.value,
                  }))
                }
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
          ))}
        </div>
      </details>

      <button
        type="button"
        onClick={extract}
        disabled={!file || running}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? (
          <>
            <Spinner className="h-4 w-4 text-white" />
            Extracting…
          </>
        ) : (
          "Extract questions"
        )}
      </button>

      {logs.length > 0 && (
        <div
          ref={logsRef}
          className="max-h-36 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-xs text-neutral-600 space-y-1.5"
        >
          {logs.map((l, i) => (
            <div
              key={i}
              className={`flex gap-2 ${l.ok ? "text-emerald-700" : ""}`}
            >
              <span className="shrink-0 text-neutral-400">·</span>
              <span>{l.msg}</span>
            </div>
          ))}
          {running && (
            <div className="flex gap-2 text-neutral-500">
              <Spinner />
              <span>Processing…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionNavBar({ index, total, onPrev, onNext }) {
  return (
    <div className="z-20 flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:px-6">
      <button
        type="button"
        onClick={onPrev}
        disabled={index === 0}
        className="inline-flex min-w-[100px] items-center justify-center gap-1 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      <div className="flex items-center gap-2 font-mono text-sm text-neutral-600">
        <input
          type="number"
          min={1}
          max={total}
          defaultValue={index + 1}
          key={index}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = parseInt(e.target.value, 10);
              if (v >= 1 && v <= total) {
                const diff = v - 1 - index;
                if (diff > 0) for (let i = 0; i < diff; i++) onNext();
                else for (let i = 0; i < -diff; i++) onPrev();
              }
            }
          }}
          className="w-14 rounded-lg border border-neutral-300 py-2 text-center text-sm font-semibold"
        />
        <span className="text-neutral-500">/ {total}</span>
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={index === total - 1}
        className="inline-flex min-w-[100px] items-center justify-center gap-1 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm disabled:opacity-40"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function QuestionCard({ question, onEdit, onDelete }) {
  const cardRef = useRef();
  useLayoutEffect(() => {
    if (window.MathJax?.typesetPromise && cardRef.current) {
      window.MathJax.typesetPromise([cardRef.current]).catch(() => {});
    }
  }, [question]);

  const q = question;
  const options = [
    { key: "A", text: q.options_A },
    { key: "B", text: q.options_B },
    { key: "C", text: q.options_C },
    { key: "D", text: q.options_D },
  ].filter((o) => o.text);
  const hasOriginal = Boolean(q.original_question?.trim());
  const correctKey = (q.correct_option || "A").toUpperCase().charAt(0);
  const metaLine = [q.subject, q.chapter, q.topic].filter(Boolean).join(" · ");

  return (
    <div ref={cardRef} className="h-full overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-xs text-neutral-500">{q._id}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
              Question
            </h2>
            <Chip label={q.difficulty || "medium"} />
            {q.category && <Chip label={q.category} />}
            {q.has_image && <Chip label="Image" active />}
          </div>
          {metaLine && (
            <p className="mt-1 truncate text-xs text-neutral-500">{metaLine}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {q.year && <p className="text-xs text-neutral-500">{q.year}</p>}
          {q.directionHTML && (
            <div
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: q.directionHTML }}
            />
          )}
          <div className="space-y-4">
            <QuestionBlock
              label="From PDF"
              sublabel={hasOriginal ? null : "Re-extract to capture"}
              text={
                hasOriginal ? q.original_question : "Original text not available."
              }
            />
            <QuestionBlock
              label="Rewritten"
              sublabel="For publication"
              text={q.question}
            />
          </div>
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Options
            </p>
            <div className="space-y-2">
              {options.map(({ key, text }) => {
                const isCorrect = key === correctKey;
                return (
                  <div
                    key={key}
                    className={`flex gap-3 rounded-xl border px-3 py-3 ${
                      isCorrect
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                        isCorrect
                          ? "bg-emerald-200 text-emerald-900"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {key}
                    </span>
                    <span
                      className={`flex-1 pt-0.5 text-sm leading-relaxed ${
                        isCorrect ? "text-neutral-900" : "text-neutral-600"
                      }`}
                    >
                      <QText text={text} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {q.solution ? (
            <section>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Solution
              </p>
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
                <MathHtml
                  html={q.solution}
                  className="prose prose-sm max-w-none text-neutral-800"
                />
              </div>
            </section>
          ) : (
            <p className="py-6 text-center text-xs text-neutral-400">No solution</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  mcqs,
  currentIndex,
  onSelect,
  meta,
  extracting,
  onLoadMore,
  reviewHasMore,
  reviewLoading,
}) {
  const [search, setSearch] = useState("");
  const filtered = mcqs
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        q.question?.toLowerCase().includes(s) ||
        q.original_question?.toLowerCase().includes(s) ||
        q._id?.toLowerCase().includes(s) ||
        q.topic?.toLowerCase().includes(s)
      );
    });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-neutral-200 p-4">
        {extracting && (
          <div className="mb-3 flex items-center gap-2 text-xs text-neutral-600">
            <Spinner />
            <span>Extracting…</span>
          </div>
        )}
        <p className="mb-3 text-2xl font-semibold tabular-nums text-neutral-900">
          {meta?.total_mcqs || mcqs.length}
        </p>
        <div className="mb-4 flex gap-4 text-[10px] uppercase tracking-wider text-neutral-500">
          <span>{meta?.with_images ?? 0} images</span>
          {meta?.cost?.usd != null && <span>${meta.cost.usd}</span>}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 scrollbar-thin">
        {filtered.map(({ q, i }) => {
          const active = i === currentIndex;
          return (
            <button
              key={q._id || i}
              type="button"
              onClick={() => onSelect(i)}
              className={`mb-0.5 w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
              }`}
            >
              <span
                className={`mb-1 block font-mono text-[10px] ${
                  active ? "text-neutral-400" : "text-neutral-400"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`line-clamp-2 block text-xs leading-snug ${
                  active ? "text-white" : "text-neutral-600"
                }`}
              >
                {stripHtml(q.question || q.original_question).substring(0, 90)}
              </span>
            </button>
          );
        })}
      </div>
      {onLoadMore && reviewHasMore && (
        <div className="shrink-0 border-t border-neutral-200 p-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={reviewLoading}
            className="w-full rounded-lg border border-neutral-300 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
          >
            {reviewLoading ? "Loading…" : `Load more (${mcqs.length} loaded)`}
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewFiltersBar({
  filterCategory,
  filterSubject,
  filterChapter,
  filterOptions,
  onChange,
  onLoad,
  onLoadMore,
  loading,
  loadingFilters,
  totalCount,
  loadedCount,
  pageSize,
  onPageSizeChange,
}) {
  const hasMore = totalCount != null && loadedCount < totalCount;
  return (
    <div className="shrink-0 border-b border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-6">
      {loadingFilters && (
        <p className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
          <Spinner className="h-3 w-3" />
          Updating filter lists…
        </p>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[140px] flex-1 flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase text-neutral-500">Category</span>
          <select
            value={filterCategory}
            onChange={(e) => onChange({ category: e.target.value, subject: "", chapter: "" })}
            className="rounded-lg border border-neutral-200 bg-white px-2 py-2 text-sm"
          >
            <option value="">All categories</option>
            {(filterOptions.categories || []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[140px] flex-1 flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase text-neutral-500">Subject</span>
          <select
            value={filterSubject}
            disabled={!filterCategory}
            onChange={(e) => onChange({ subject: e.target.value, chapter: "" })}
            className="rounded-lg border border-neutral-200 bg-white px-2 py-2 text-sm disabled:opacity-50"
          >
            <option value="">All subjects</option>
            {(filterOptions.subjects || []).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[140px] flex-1 flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase text-neutral-500">Chapter</span>
          <select
            value={filterChapter}
            disabled={!filterCategory || !filterSubject}
            onChange={(e) => onChange({ chapter: e.target.value })}
            className="rounded-lg border border-neutral-200 bg-white px-2 py-2 text-sm disabled:opacity-50"
          >
            <option value="">All chapters</option>
            {(filterOptions.chapters || []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex w-24 flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase text-neutral-500">Per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-neutral-200 bg-white px-2 py-2 text-sm"
          >
            {REVIEW_PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onLoad}
          disabled={loading || !filterCategory || !filterSubject || !filterChapter}
          title={
            !filterCategory || !filterSubject || !filterChapter
              ? "Select category, subject, and chapter first"
              : "Load questions for this filter"
          }
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? <Spinner className="h-4 w-4 text-white" /> : <Search className="h-4 w-4" />}
          Load questions
        </button>
        {hasMore && loadedCount > 0 && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 disabled:opacity-50"
          >
            Load more
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        Filters use SQL DISTINCT (RPC). Load questions only after category, subject, and chapter
        are selected.
      </p>
      {totalCount != null && (
        <p className="mt-1 text-xs text-neutral-600">
          Showing {loadedCount} of {totalCount} matching rows
          {hasMore ? " — use Load more for the next page" : ""}
        </p>
      )}
    </div>
  );
}

function Toolbar({
  mcqs,
  meta,
  onReset,
  onLoadOutput,
  extracting,
  mode,
  onModeChange,
  onSaveCurrent,
  onSaveAll,
  saving,
}) {
  const fileRef = useRef();

  const buildOutput = () => ({
    meta: meta || {
      total_mcqs: mcqs.length,
      generated_at: new Date().toISOString(),
    },
    mcqs,
  });

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(buildOutput(), null, 2));
    toast.success("Full JSON copied");
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(buildOutput(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mcqs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON downloaded");
  };

  const loadFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        onLoadOutput(data);
        const { mcqs: loaded } = parseExtractPayload(data);
        toast.success(`Loaded ${loaded.length} MCQs`);
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div>
          <h1 className="text-sm font-semibold text-neutral-900">MCQ Extractor</h1>
          <p className="text-[11px] text-neutral-500 truncate">
            {extracting
              ? "Extracting…"
              : mode === "review"
                ? "Review examtracker"
                : "Extract API (proxied)"}
          </p>
        </div>
        <div className="flex rounded-lg border border-neutral-200 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => onModeChange("extract")}
            className={`rounded-md px-2.5 py-1 font-medium ${mode === "extract" ? "bg-neutral-900 text-white" : "text-neutral-600"}`}
          >
            Extract PDF
          </button>
          <button
            type="button"
            onClick={() => onModeChange("review")}
            className={`rounded-md px-2.5 py-1 font-medium ${mode === "review" ? "bg-neutral-900 text-white" : "text-neutral-600"}`}
          >
            Review DB
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <input ref={fileRef} type="file" accept=".json" hidden onChange={loadFile} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <FileJson className="h-3.5 w-3.5" />
          Import
        </button>
        {mcqs.length > 0 && (
          <>
            <button
              type="button"
              onClick={onSaveCurrent}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
            >
              <Database className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save to Supabase"}
            </button>
            <button
              type="button"
              onClick={onSaveAll}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-800 disabled:opacity-50"
            >
              Save all ({mcqs.length})
            </button>
            <button
              type="button"
              onClick={copyJSON}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
            <button
              type="button"
              onClick={downloadJSON}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            {meta?.downloadUrl && (
              <a
                href={toMcqProxyUrl(meta.downloadUrl)}
                download
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800"
              >
                <Download className="h-3.5 w-3.5" />
                Server JSON
              </a>
            )}
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <Link
              href="/admin/bulk-questions"
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Bulk import →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function McqExtractorApp() {
  const [mcqs, setMcqs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [idx, setIdx] = useState(0);
  const [editing, setEditing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showUpload, setShowUpload] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [platformExams, setPlatformExams] = useState([]);
  const [selectedExamSlug, setSelectedExamSlug] = useState("");
  const [workspaceMode, setWorkspaceMode] = useState("extract");
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    subjects: [],
    chapters: [],
  });
  const [dbTotalCount, setDbTotalCount] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [reviewPageSize, setReviewPageSize] = useState(20);
  const [bulkRewriteOpen, setBulkRewriteOpen] = useState(false);
  /** Index in loaded list where the next "continue" bulk batch should start. */
  const [bulkRewriteNextIndex, setBulkRewriteNextIndex] = useState(0);
  /** How many rows the last review fetch returned (initial load or load more). */
  const [reviewLastFetchCount, setReviewLastFetchCount] = useState(0);
  const filterCacheRef = useRef(new Map());

  const fetchFilterScope = useCallback(async (scope, { category, subject, chapter } = {}) => {
    const cacheKey = `${scope}|${category || ""}|${subject || ""}|${chapter || ""}`;
    if (filterCacheRef.current.has(cacheKey)) {
      return filterCacheRef.current.get(cacheKey);
    }
    const params = new URLSearchParams({ action: "filters", scope });
    if (category) params.set("category", category);
    if (subject) params.set("subject", subject);
    if (chapter) params.set("chapter", chapter);
    const res = await fetch(`/api/admin/examtracker?${params}`, { credentials: "include" });
    const data = await parseJsonResponse(res);
    if (!data.success) throw new Error(data.error || "Failed to load filters");
    filterCacheRef.current.set(cacheKey, data.filters);
    return data.filters;
  }, []);

  useEffect(() => {
    if (workspaceMode !== "review") return;
    let cancelled = false;
    setLoadingFilters(true);
    fetchFilterScope("categories")
      .then((f) => {
        if (!cancelled) {
          setFilterOptions((prev) => ({
            ...prev,
            categories: f.categories || [],
          }));
        }
      })
      .catch((e) => {
        if (!cancelled) toast.error(e.message || "Failed to load categories");
      })
      .finally(() => {
        if (!cancelled) setLoadingFilters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceMode, fetchFilterScope]);

  useEffect(() => {
    if (workspaceMode !== "review" || !filterCategory) {
      setFilterOptions((prev) => ({ ...prev, subjects: [], chapters: [] }));
      return;
    }
    let cancelled = false;
    setLoadingFilters(true);
    fetchFilterScope("subjects", { category: filterCategory })
      .then((f) => {
        if (!cancelled) {
          setFilterOptions((prev) => ({
            ...prev,
            subjects: f.subjects || [],
            chapters: [],
          }));
          if (!f.subjects?.length) {
            toast.error(
              "No subjects found for this category. Check spelling or run add_examtracker_filter_rpc.sql for faster scans.",
              { duration: 5000 }
            );
          }
        }
      })
      .catch((e) => {
        if (!cancelled) toast.error(e.message || "Failed to load subjects");
      })
      .finally(() => {
        if (!cancelled) setLoadingFilters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceMode, filterCategory, fetchFilterScope]);

  useEffect(() => {
    if (workspaceMode !== "review" || !filterCategory || !filterSubject) {
      setFilterOptions((prev) => ({ ...prev, chapters: [] }));
      return;
    }
    let cancelled = false;
    setLoadingFilters(true);
    fetchFilterScope("chapters", {
      category: filterCategory,
      subject: filterSubject,
    })
      .then((f) => {
        if (!cancelled) {
          setFilterOptions((prev) => ({
            ...prev,
            chapters: f.chapters || [],
          }));
        }
      })
      .catch((e) => {
        if (!cancelled) toast.error(e.message || "Failed to load chapters");
      })
      .finally(() => {
        if (!cancelled) setLoadingFilters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceMode, filterCategory, filterSubject, fetchFilterScope]);

  const saveDefaults = useCallback(() => {
    const exam = platformExams.find((e) => e.slug === selectedExamSlug);
    const derived = extractSettingsFromExam(exam);
    return {
      topic: derived.default_topic,
      category: categoryForDb(derived.category, selectedExamSlug),
      subject: derived.subject,
      chapter: derived.chapter || filterChapter,
    };
  }, [platformExams, selectedExamSlug, filterChapter]);

  const saveCurrentToSupabase = useCallback(async () => {
    const q = mcqs[idx];
    if (!q) return;
    setSaving(true);
    try {
      const payload = mcqToExamtrackerPayload(q, saveDefaults());
      await toastPromise(
        async () => {
          const res = await fetch("/api/admin/examtracker", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: payload, defaults: saveDefaults() }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) throw new Error(data.error || "Save failed");
          return "Saved to examtracker";
        },
        { loading: "Saving…", success: (m) => m, error: (e) => e.message }
      );
      setMcqs((prev) =>
        prev.map((item, i) => (i === idx ? { ...item, _fromDb: true } : item))
      );
    } finally {
      setSaving(false);
    }
  }, [mcqs, idx, saveDefaults]);

  const saveAllToSupabase = useCallback(async () => {
    if (!mcqs.length) return;
    setSaving(true);
    try {
      const rows = mcqs.map((q) => mcqToExamtrackerPayload(q, saveDefaults()));
      await toastPromise(
        async () => {
          const res = await fetch("/api/admin/examtracker-bulk", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questions: rows, mode: "upsert", defaults: saveDefaults() }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) throw new Error(data.error || "Bulk save failed");
          return `Saved ${data.savedCount} question(s)`;
        },
        { loading: "Saving all…", success: (m) => m, error: (e) => e.message }
      );
    } finally {
      setSaving(false);
    }
  }, [mcqs, saveDefaults]);

  const fetchReviewPage = useCallback(
    async (offset, append) => {
      if (!filterCategory || !filterSubject || !filterChapter) {
        toast.error("Select category, subject, and chapter before loading questions");
        return;
      }
      setLoadingReview(true);
      try {
        const params = new URLSearchParams({
          category: filterCategory,
          limit: String(reviewPageSize),
          offset: String(offset),
        });
        if (filterSubject) params.set("subject", filterSubject);
        if (filterChapter) params.set("chapter", filterChapter);
        const res = await fetch(`/api/admin/examtracker?${params}`, {
          credentials: "include",
        });
        const data = await parseJsonResponse(res);
        if (!data.success) throw new Error(data.error || "Load failed");
        const list = (data.questions || []).map(examtrackerRowToMcq).filter(Boolean);
        setDbTotalCount(data.count ?? null);
        setReviewLastFetchCount(list.length);
        setMcqs((prev) => {
          if (!append) return list;
          const map = new Map(prev.map((q) => [q._id, q]));
          for (const q of list) map.set(q._id, q);
          return [...map.values()];
        });
        if (!append) {
          setBulkRewriteNextIndex(0);
        }
        setMeta({ total_mcqs: data.count, source: "examtracker" });
        if (!append) setIdx(0);
        setShowUpload(false);
        const loaded = append ? offset + list.length : list.length;
        toast.success(
          append
            ? `Loaded ${list.length} more (${Math.min(loaded, data.count)} / ${data.count})`
            : `Loaded ${list.length} of ${data.count} question(s)`
        );
      } catch (e) {
        toast.error(e.message || "Failed to load");
      } finally {
        setLoadingReview(false);
      }
    },
    [filterCategory, filterSubject, filterChapter, reviewPageSize]
  );

  const loadReviewQuestions = useCallback(() => {
    fetchReviewPage(0, false);
  }, [fetchReviewPage]);

  const loadMoreReviewQuestions = useCallback(() => {
    fetchReviewPage(mcqs.length, true);
  }, [fetchReviewPage, mcqs.length]);

  const reviewHasMore =
    dbTotalCount != null && mcqs.length > 0 && mcqs.length < dbTotalCount;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/platform-exams", {
          credentials: "include",
        });
        const data = await parseJsonResponse(res);
        if (!data.success || cancelled) return;
        const list = (data.exams || []).slice().sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
        const active = list.filter((e) => e.is_active !== false);
        const pick = active.length ? active : list;
        setPlatformExams(pick);
        if (pick[0]?.slug) setSelectedExamSlug(pick[0].slug);
      } catch (e) {
        if (!cancelled) toast.error(e.message || "Failed to load platform exams");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mcqs.length) {
      if (idx !== 0) setIdx(0);
      return;
    }
    if (idx >= mcqs.length) setIdx(mcqs.length - 1);
  }, [mcqs.length, idx]);

  const handleChunk = (chunk) => {
    setMcqs((prev) => mergeMcqLists(prev, chunk));
    setShowUpload(false);
    setSidebarOpen(false);
  };

  const handleExtractStart = () => {
    setExtracting(true);
    setMcqs([]);
    setMeta(null);
    setIdx(0);
    setShowUpload(true);
  };

  const handleDone = (data) => {
    const { mcqs: list, meta: m } = parseExtractPayload(data);
    setExtracting(false);
    setMcqs((prev) => (list.length ? list : prev));
    setMeta(m ?? (data.total_mcqs ? data : null));
    setShowUpload(false);
    const count = list.length || data.total_mcqs || 0;
    if (!count) toast.error("No MCQs found in extraction result");
  };

  const handleLoadOutput = (data) => {
    const { mcqs: list, meta: m } = parseExtractPayload(data);
    setMcqs(list);
    setMeta(m);
    setIdx(0);
    setExtracting(false);
    setShowUpload(false);
  };

  const handleSave = (updated) => {
    setMcqs((prev) =>
      prev.map((q) => (q._id === updated._id ? updated : q))
    );
  };

  const mergeRewriteUpdates = useCallback((updates) => {
    const byId = new Map(updates.map((u) => [u._id, u]));
    return (prev) =>
      prev.map((q) => {
        const u = byId.get(q._id);
        if (!u) return q;
        return {
          ...q,
          ...(u.question !== undefined ? { question: u.question } : {}),
          ...(u.solution !== undefined ? { solution: u.solution } : {}),
        };
      });
  }, []);

  const handleBulkRewriteApply = useCallback(
    (updates, meta) => {
      setMcqs(mergeRewriteUpdates(updates));
      if (meta?.endIndex != null) {
        setBulkRewriteNextIndex((prev) => Math.max(prev, meta.endIndex));
      }
    },
    [mergeRewriteUpdates]
  );

  const saveRewrittenToSupabase = useCallback(
    async (updates) => {
      if (!updates?.length) return;
      setSaving(true);
      try {
        const byId = new Map(updates.map((u) => [u._id, u]));
        const merged = mcqs
          .filter((q) => byId.has(q._id))
          .map((q) => {
            const u = byId.get(q._id);
            return {
              ...q,
              ...(u.question !== undefined ? { question: u.question } : {}),
              ...(u.solution !== undefined ? { solution: u.solution } : {}),
            };
          });
        const rows = merged.map((q) => mcqToExamtrackerPayload(q, saveDefaults()));
        await toastPromise(
          async () => {
            const res = await fetch("/api/admin/examtracker-bulk", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                questions: rows,
                mode: "upsert",
                defaults: saveDefaults(),
              }),
            });
            const data = await parseJsonResponse(res);
            if (!data.success) throw new Error(data.error || "Bulk save failed");
            return `Saved ${data.savedCount} rewritten question(s) to examtracker`;
          },
          {
            loading: "Saving rewritten…",
            success: (m) => m,
            error: (e) => e.message,
          }
        );
        setMcqs((prev) =>
          prev.map((q) =>
            byId.has(q._id) ? { ...q, _fromDb: true } : q
          )
        );
      } finally {
        setSaving(false);
      }
    },
    [mcqs, saveDefaults]
  );

  const handleDelete = () => {
    if (mcqs.length === 1) {
      setMcqs([]);
      setShowUpload(true);
      toast.success("Question removed");
      return;
    }
    toast(
      (t) => (
        <span className="flex items-center gap-2 text-xs">
          Remove this question?
          <button
            type="button"
            onClick={() => {
              setMcqs((prev) => prev.filter((_, i) => i !== idx));
              setIdx((prev) => Math.min(prev, mcqs.length - 2));
              toast.dismiss(t.id);
              toast.success("Removed");
            }}
            className="rounded bg-red-600 px-2 py-1 text-[11px] font-medium text-white"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="text-neutral-600 underline"
          >
            Cancel
          </button>
        </span>
      ),
      { duration: 6000 }
    );
  };

  const currentQ = mcqs[idx];

  return (
    <McqMathProvider>
      <div className="-mx-4 flex h-[calc(100vh-11rem)] min-h-[520px] max-h-[900px] flex-col overflow-hidden border border-neutral-200 bg-white sm:-mx-6 sm:rounded-2xl lg:-mx-8">
        <Toolbar
          mcqs={mcqs}
          meta={meta}
          extracting={extracting}
          mode={workspaceMode}
          onModeChange={(m) => {
            setWorkspaceMode(m);
            if (m === "extract") setShowUpload(true);
            if (m === "review") setShowUpload(false);
          }}
          saving={saving}
          onSaveCurrent={saveCurrentToSupabase}
          onSaveAll={saveAllToSupabase}
          onReset={() => {
            setMcqs([]);
            setMeta(null);
            setIdx(0);
            setExtracting(false);
            setShowUpload(workspaceMode === "extract");
          }}
          onLoadOutput={handleLoadOutput}
        />

        {workspaceMode === "review" && (
          <ReviewFiltersBar
            filterCategory={filterCategory}
            filterSubject={filterSubject}
            filterChapter={filterChapter}
            filterOptions={filterOptions}
            loading={loadingReview}
            loadingFilters={loadingFilters}
            totalCount={dbTotalCount}
            loadedCount={mcqs.length}
            pageSize={reviewPageSize}
            onPageSizeChange={setReviewPageSize}
            onChange={({ category, subject, chapter }) => {
              if (category !== undefined) {
                setFilterCategory(category);
                setFilterSubject("");
                setFilterChapter("");
                setBulkRewriteNextIndex(0);
                setReviewLastFetchCount(0);
              }
              if (subject !== undefined) {
                setFilterSubject(subject);
                setFilterChapter("");
                setBulkRewriteNextIndex(0);
                setReviewLastFetchCount(0);
              }
              if (chapter !== undefined) {
                setFilterChapter(chapter);
                setBulkRewriteNextIndex(0);
                setReviewLastFetchCount(0);
              }
            }}
            onLoad={loadReviewQuestions}
            onLoadMore={loadMoreReviewQuestions}
          />
        )}

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {mcqs.length > 0 && (
              <button
                type="button"
                onClick={() => setSidebarOpen((o) => !o)}
                className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium md:hidden"
              >
                List · {mcqs.length}
              </button>
            )}
            <span className="hidden truncate text-xs text-neutral-500 sm:inline">
              {extracting
                ? "Streaming…"
                : mcqs.length
                  ? `${mcqs.length} loaded`
                  : "Ready"}
            </span>
          </div>
          {workspaceMode === "review" && mcqs.length > 0 && (
            <button
              type="button"
              onClick={() => setBulkRewriteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-800 hover:bg-violet-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Bulk AI rewrite
            </button>
          )}
          {workspaceMode === "extract" && (
            <button
              type="button"
              onClick={() => setShowUpload((u) => !u)}
              className="text-xs font-medium text-neutral-700 hover:text-neutral-900"
            >
              {showUpload ? "Close upload" : "New PDF"}
            </button>
          )}
        </div>

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {sidebarOpen && mcqs.length > 0 && (
            <button
              type="button"
              aria-label="Close list"
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {mcqs.length > 0 && (
            <aside
              className={`z-50 shrink-0 w-[min(260px,88vw)] overflow-hidden border-r border-neutral-200 md:relative md:translate-x-0 fixed inset-y-0 left-0 transition-transform duration-200 ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
              }`}
            >
              <Sidebar
                mcqs={mcqs}
                currentIndex={idx}
                onSelect={(i) => {
                  setIdx(i);
                  setSidebarOpen(false);
                }}
                meta={meta}
                extracting={extracting}
                onLoadMore={
                  workspaceMode === "review" ? loadMoreReviewQuestions : undefined
                }
                reviewHasMore={workspaceMode === "review" && reviewHasMore}
                reviewLoading={loadingReview}
              />
            </aside>
          )}

          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            {workspaceMode === "extract" && showUpload && (
              <div className="max-h-[52vh] shrink-0 overflow-y-auto border-b border-neutral-200 bg-neutral-50 pb-4">
                <ExtractPanel
                  onStart={handleExtractStart}
                  onChunk={handleChunk}
                  onDone={handleDone}
                  onFinish={() => setExtracting(false)}
                  platformExams={platformExams}
                  selectedExamSlug={selectedExamSlug}
                  onSelectExam={setSelectedExamSlug}
                />
                <SavedOutputs />
              </div>
            )}

            {extracting && !mcqs.length && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-sm text-neutral-500">
                <Spinner className="h-7 w-7" />
                <p>Preparing first questions…</p>
              </div>
            )}

            {!extracting && !mcqs.length && !showUpload && (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-neutral-500">
                Import a JSON file or upload a PDF to get started
              </div>
            )}

            {mcqs.length > 0 && currentQ && (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-hidden">
                  <QuestionCard
                    question={currentQ}
                    onEdit={() => setEditing(true)}
                    onDelete={handleDelete}
                  />
                </div>
                <QuestionNavBar
                  index={idx}
                  total={mcqs.length}
                  onPrev={() => setIdx((i) => Math.max(0, i - 1))}
                  onNext={() => setIdx((i) => Math.min(mcqs.length - 1, i + 1))}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {editing && currentQ && (
        <McqEditDrawer
          key={currentQ._id}
          question={currentQ}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}

      {bulkRewriteOpen && workspaceMode === "review" && (
        <BulkRewriteModal
          open={bulkRewriteOpen}
          mcqs={mcqs}
          nextStartIndex={bulkRewriteNextIndex}
          lastFetchCount={reviewLastFetchCount}
          savingDb={saving}
          onClose={() => setBulkRewriteOpen(false)}
          onApply={handleBulkRewriteApply}
          onSaveRewritten={saveRewrittenToSupabase}
        />
      )}
    </McqMathProvider>
  );
}
