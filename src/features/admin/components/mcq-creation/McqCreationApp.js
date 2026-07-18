"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Download,
  FileJson,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  DEFAULT_CREATION_CONFIG,
  buildPdfFormData,
  buildUrlPayload,
  creationConfigToFields,
  postExport,
  postPipelinePdf,
  postPipelineUrl,
  postRewrite,
  postTextExtract,
  postUrlExtract,
  postUrlPipeline,
  resolveExportDownloadHref,
  validateUrls,
} from "@/lib/mcqCreationApi";
import PdfUploadForm, { validatePdf } from "./PdfUploadForm";
import UrlInputList from "./UrlInputList";
import McqConfigForm from "./McqConfigForm";
import SourceToggle from "./SourceToggle";
import WebSearchToggle from "./WebSearchToggle";
import ExtractionProgress from "./ExtractionProgress";
import McqPreviewTable from "./McqPreviewTable";
import ApiHealthStatus from "./ApiHealthStatus";
import MethodBadge from "./MethodBadge";
import { McqMathProvider } from "./MathHtmlRenderer";

function SummaryCard({ meta, lastExport, sourceType }) {
  if (!meta && !lastExport) return null;

  const total = meta?.total_mcqs ?? lastExport?.meta?.total_mcqs;
  const downloadHref = resolveExportDownloadHref(meta, lastExport);
  const sourceLabel =
    meta?.source_urls?.length > 0
      ? meta.source_urls.join(", ")
      : meta?.filename && meta?.source_type !== "url"
        ? meta.filename
        : null;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-emerald-900">Extraction complete</p>
            <MethodBadge method={meta?.method} sourceType={meta?.source_type || sourceType} />
          </div>
          <ul className="space-y-1 text-sm text-emerald-800">
            {total != null && (
              <li>
                <span className="font-medium">{total}</span> MCQ{total === 1 ? "" : "s"}
              </li>
            )}
            {sourceLabel && (
              <li className="break-all">
                Source: <span className="font-medium">{sourceLabel}</span>
              </li>
            )}
            {typeof meta?.rewritten === "boolean" && (
              <li>Rewritten: {meta.rewritten ? "Yes" : "No"}</li>
            )}
            {meta?.extracted_at && (
              <li>
                At: {new Date(meta.extracted_at).toLocaleString()}
              </li>
            )}
            {meta?.category && <li>Category: {meta.category}</li>}
            {meta?.chapter && <li>Chapter: {meta.chapter}</li>}
            {meta?.subject && <li>Subject: {meta.subject}</li>}
          </ul>
        </div>
        {downloadHref && (
          <a
            href={downloadHref}
            download
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            <Download className="h-4 w-4" />
            Download JSON
          </a>
        )}
      </div>
    </div>
  );
}

function ActionButton({ onClick, disabled, loading, icon: Icon, children, variant = "primary" }) {
  const styles =
    variant === "primary"
      ? "bg-neutral-900 text-white hover:bg-neutral-800"
      : variant === "secondary"
        ? "bg-indigo-600 text-white hover:bg-indigo-700"
        : variant === "outline"
          ? "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
          : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

export default function McqCreationApp() {
  const [sourceType, setSourceType] = useState("pdf");
  const [config, setConfig] = useState({ ...DEFAULT_CREATION_CONFIG });
  const [pdf, setPdf] = useState(null);
  const [urls, setUrls] = useState([""]);
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [rewrite, setRewrite] = useState(false);
  const [includeRaw, setIncludeRaw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState(null);
  const [mcqs, setMcqs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [lastExport, setLastExport] = useState(null);

  const resetResults = () => {
    setMcqs([]);
    setMeta(null);
    setLastExport(null);
    setError(null);
  };

  const applyResult = (result, ranPipeline) => {
    setMcqs(result.data || []);
    setMeta(result.meta || null);
    if (ranPipeline && (result.meta?.downloadUrl || result.filename)) {
      setLastExport({
        filename: result.filename || result.meta?.filename,
        downloadUrl: result.downloadUrl || result.meta?.downloadUrl,
        meta: result.meta,
      });
    }
  };

  const runPdfExtract = async () => {
    const fileErr = validatePdf(pdf);
    if (fileErr) {
      toast.error(fileErr);
      return;
    }

    resetResults();
    setLoading(true);
    setLoadingMessage("Extracting MCQs from PDF…");

    try {
      const fields = creationConfigToFields(config, {
        ...(includeRaw ? { raw: "true" } : {}),
      });
      const result = await postTextExtract(buildPdfFormData(pdf, fields));
      applyResult(result, false);
      toast.success(`Extracted ${result.meta?.total_mcqs ?? result.data?.length ?? 0} MCQs`);
    } catch (err) {
      const msg = err?.message || "Extract failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const runPdfPipeline = async () => {
    const fileErr = validatePdf(pdf);
    if (fileErr) {
      toast.error(fileErr);
      return;
    }

    resetResults();
    setLoading(true);
    setLoadingMessage("Running PDF pipeline…");

    try {
      const fields = creationConfigToFields(config, {
        ...(rewrite ? { rewrite: "true" } : {}),
        ...(includeRaw ? { raw: "true" } : {}),
      });
      const result = await postPipelinePdf(buildPdfFormData(pdf, fields));
      applyResult(result, true);
      toast.success(`Pipeline complete — ${result.meta?.total_mcqs ?? result.data?.length ?? 0} MCQs`);
    } catch (err) {
      const msg = err?.message || "Pipeline failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const runUrlExtract = async () => {
    const validated = validateUrls(urls);
    if (validated.error) {
      toast.error(validated.error);
      setError(validated.error);
      return;
    }

    resetResults();
    setLoading(true);
    setLoadingMessage(
      useWebSearch
        ? "Searching web and generating MCQs…"
        : "Fetching page and generating MCQs…"
    );

    try {
      const payload = buildUrlPayload(config, validated.urls, {
        useWebSearch,
        raw: includeRaw,
      });
      const result = await postUrlExtract(payload);
      applyResult(result, false);
      toast.success(`Extracted ${result.meta?.total_mcqs ?? result.data?.length ?? 0} MCQs`);
    } catch (err) {
      const msg = err?.message || "URL extract failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const runUrlPipeline = async () => {
    const validated = validateUrls(urls);
    if (validated.error) {
      toast.error(validated.error);
      setError(validated.error);
      return;
    }

    resetResults();
    setLoading(true);
    setLoadingMessage(
      useWebSearch
        ? "Running URL pipeline with web search…"
        : "Running URL pipeline…"
    );

    try {
      const payload = buildUrlPayload(config, validated.urls, {
        useWebSearch,
        rewrite,
        raw: includeRaw,
      });
      const result = await postUrlPipeline(payload);
      applyResult(result, true);
      toast.success(`Pipeline complete — ${result.meta?.total_mcqs ?? result.data?.length ?? 0} MCQs`);
    } catch (err) {
      const msg = err?.message || "URL pipeline failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const runRewrite = async () => {
    if (!mcqs.length) {
      toast.error("No MCQs to rewrite");
      return;
    }

    setLoading(true);
    setLoadingMessage("Rewriting stems and solutions…");
    setError(null);

    try {
      const result = await postRewrite(mcqs);
      setMcqs(result.data || []);
      setMeta((m) => ({ ...m, ...result.meta, rewritten: true }));
      toast.success("Rewrite complete");
    } catch (err) {
      const msg = err?.message || "Rewrite failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const runExport = async () => {
    if (!mcqs.length) {
      toast.error("No MCQs to export");
      return;
    }

    setLoading(true);
    setLoadingMessage("Saving export…");
    setError(null);

    try {
      const exportMeta = {
        filename:
          sourceType === "pdf"
            ? pdf?.name?.replace(/\.pdf$/i, "") || "export"
            : validateUrls(urls).urls?.[0]?.replace(/[^a-z0-9]+/gi, "_").slice(0, 40) || "url-export",
        category: config.category,
        chapter: config.chapter,
        subject: config.subject,
        ...(meta?.source_urls ? { source_urls: meta.source_urls } : {}),
        ...(meta?.source_type ? { source_type: meta.source_type } : {}),
        ...(meta?.method ? { method: meta.method } : {}),
      };
      const result = await postExport(mcqs, exportMeta);
      setLastExport(result);
      toast.success(`Saved ${result.filename}`);
    } catch (err) {
      const msg = err?.message || "Export failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const hasInput =
    sourceType === "pdf" ? Boolean(pdf) : urls.some((u) => u.trim().length > 0);

  return (
    <McqMathProvider>
      <div className="space-y-6">
        <ApiHealthStatus />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SourceToggle
            value={sourceType}
            onChange={setSourceType}
            disabled={loading}
          />
          <Link
            href="/admin/mcq-exports"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            <FileJson className="h-4 w-4" />
            Export history
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {error && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}

        <ExtractionProgress
          active={loading}
          message={loadingMessage}
          sourceType={sourceType}
          useWebSearch={useWebSearch}
        />

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Configuration
          </h2>
          <McqConfigForm config={config} onChange={setConfig} disabled={loading} />
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {sourceType === "pdf" ? "PDF upload" : "URL input"}
          </h2>

          {sourceType === "pdf" ? (
            <PdfUploadForm
              pdf={pdf}
              onPdfChange={setPdf}
              rewrite={rewrite}
              onRewriteChange={setRewrite}
              includeRaw={includeRaw}
              onIncludeRawChange={setIncludeRaw}
              showRewrite
              showRaw
              disabled={loading}
            >
              <div className="flex flex-wrap gap-2 pt-2">
                <ActionButton
                  onClick={runPdfExtract}
                  disabled={!pdf}
                  loading={loading}
                  icon={Sparkles}
                >
                  Extract only
                </ActionButton>
                <ActionButton
                  onClick={runPdfPipeline}
                  disabled={!pdf}
                  loading={loading}
                  icon={Sparkles}
                  variant="secondary"
                >
                  Run pipeline
                </ActionButton>
              </div>
            </PdfUploadForm>
          ) : (
            <div className="space-y-4">
              <UrlInputList urls={urls} onChange={setUrls} disabled={loading} />
              <WebSearchToggle
                checked={useWebSearch}
                onChange={setUseWebSearch}
                disabled={loading}
              />
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={rewrite}
                  disabled={loading}
                  onChange={(e) => setRewrite(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                Extra rewrite pass (usually off — URL extract is already copyright-free)
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={includeRaw}
                  disabled={loading}
                  onChange={(e) => setIncludeRaw(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                Include source text (debug)
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                <ActionButton
                  onClick={runUrlExtract}
                  disabled={!hasInput}
                  loading={loading}
                  icon={Sparkles}
                >
                  Extract only
                </ActionButton>
                <ActionButton
                  onClick={runUrlPipeline}
                  disabled={!hasInput}
                  loading={loading}
                  icon={Sparkles}
                  variant="secondary"
                >
                  Run pipeline
                </ActionButton>
              </div>
            </div>
          )}
        </div>

        {(meta || lastExport || mcqs.length > 0) && (
          <div className="space-y-4">
            <SummaryCard meta={meta} lastExport={lastExport} sourceType={sourceType} />

            {mcqs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  onClick={runRewrite}
                  disabled={!mcqs.length}
                  loading={loading}
                  icon={Wand2}
                  variant="outline"
                >
                  Rewrite MCQs
                </ActionButton>
                <ActionButton
                  onClick={runExport}
                  disabled={!mcqs.length}
                  loading={loading}
                  icon={Download}
                >
                  Export JSON
                </ActionButton>
              </div>
            )}

            {mcqs.length > 0 ? (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-neutral-900">Preview</h2>
                <McqPreviewTable mcqs={mcqs} editable onMcqsChange={setMcqs} />
              </section>
            ) : null}
          </div>
        )}

        {!loading && !mcqs.length && !meta && (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-neutral-500">
              {sourceType === "pdf"
                ? pdf
                  ? "PDF ready — extract or run the pipeline."
                  : "Upload a PDF to get started."
                : hasInput
                  ? "URLs ready — extract or run the pipeline."
                  : "Enter a URL above to get started."}
            </p>
          </div>
        )}
      </div>
    </McqMathProvider>
  );
}
