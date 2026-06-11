"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { AUTOMATION_PROXY_BASE, toAutomationProxyUrl } from "@/lib/automationProxy";
import { buildPublishPayload, formFromRewrite } from "@/lib/gktodayAdmin";
import { parseJsonResponse } from "@/lib/toastAsync";

function Spinner({ className = "h-4 w-4" }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

function StatusBadge({ alreadyPresent }) {
  if (alreadyPresent) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        Posted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-200">
      New
    </span>
  );
}

const EMPTY_FORM = {
  sourceUrl: "",
  title: "",
  slug: "",
  description: "",
  excerpt: "",
  imageUrl: "",
  category: "Current Affairs",
  tags: "current-affairs, news",
  status: "published",
  authorEmail: "gunjan@10tracker.com",
  content: "",
  isFeatured: false,
  force: false,
};

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "posted", label: "Posted" },
];

export default function GkTodayAdmin() {
  const [listingUrl, setListingUrl] = useState("https://www.gktoday.in/current-affairs/");
  const [listing, setListing] = useState(null);
  const [listingLoading, setListingLoading] = useState(false);
  const [listingError, setListingError] = useState(null);
  const [listFilter, setListFilter] = useState("all");

  const [activeArticle, setActiveArticle] = useState(null);
  const [view, setView] = useState("list");
  const [rewritingId, setRewritingId] = useState(null);
  const [rewriteError, setRewriteError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  const summary = listing?.summary;
  const articles = listing?.articles || [];

  const filteredArticles = useMemo(() => {
    if (listFilter === "new") return articles.filter((a) => !a.alreadyPresent);
    if (listFilter === "posted") return articles.filter((a) => a.alreadyPresent);
    return articles;
  }, [articles, listFilter]);

  const fetchListing = useCallback(async (url = listingUrl) => {
    setListingLoading(true);
    setListingError(null);
    try {
      const endpoint = toAutomationProxyUrl("/api/services/fetch/gktoday", { url });
      const res = await fetch(endpoint, { cache: "no-store" });
      const data = await parseJsonResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch GKToday listing");
      }
      setListing(data.data);
      setListingUrl(data.data?.url || url);
    } catch (err) {
      setListingError(err.message || "Failed to load articles");
      toast.error(err.message || "Failed to load articles");
    } finally {
      setListingLoading(false);
    }
  }, [listingUrl]);

  useEffect(() => {
    fetchListing(listingUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setPublishResult(null);
  }, []);

  const closeEditor = () => {
    setView("list");
    setRewriteError(null);
    setPublishResult(null);
  };

  const handleRewrite = async (article) => {
    if (!article?.url) return;

    setActiveArticle(article);
    setRewritingId(article.slug || article.url);
    setRewriteError(null);
    setPublishResult(null);
    setView("editor");

    try {
      const endpoint = toAutomationProxyUrl("/api/gktoday/rewrite", { url: article.url });
      const res = await fetch(endpoint, { cache: "no-store" });
      const data = await parseJsonResponse(res);

      if (!res.ok || data.success === false) {
        throw new Error(data.error || "AI rewrite failed");
      }

      setForm(formFromRewrite(data, article));
      toast.success("Article rewritten — review and publish");
    } catch (err) {
      setRewriteError(err.message || "AI rewrite failed");
      toast.error(err.message || "AI rewrite failed");
    } finally {
      setRewritingId(null);
    }
  };

  const validateForm = () => {
    const missing = [];
    if (!form.title?.trim()) missing.push("title");
    if (!form.slug?.trim()) missing.push("slug");
    if (!form.content?.trim()) missing.push("content");
    if (!form.category?.trim()) missing.push("category");
    if (!form.imageUrl?.trim()) missing.push("image URL");
    return missing;
  };

  const handlePublish = async () => {
    const missing = validateForm();
    if (missing.length) {
      toast.error(`Missing: ${missing.join(", ")}`);
      return;
    }

    setPublishing(true);
    setPublishResult(null);

    try {
      const payload = buildPublishPayload(form);
      const res = await fetch(`${AUTOMATION_PROXY_BASE}/articles/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonResponse(res);

      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Publish failed");
      }

      setPublishResult(data);

      if (data.alreadyPosted) {
        toast.success("Article already exists in database");
      } else {
        toast.success("Article published successfully");
        await fetchListing(listingUrl);
      }
    } catch (err) {
      toast.error(err.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const editorBusy = Boolean(rewritingId);
  const missingFields = validateForm();
  const canPublish = !editorBusy && !publishing && missingFields.length === 0;

  if (view === "editor") {
    return (
      <EditorView
        activeArticle={activeArticle}
        form={form}
        updateForm={updateForm}
        editorBusy={editorBusy}
        rewriteError={rewriteError}
        publishResult={publishResult}
        publishing={publishing}
        canPublish={canPublish}
        missingFields={missingFields}
        onBack={closeEditor}
        onPublish={handlePublish}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Toolbar */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                GKToday
              </span>
              {listing?.scrapedAt && (
                <span className="text-xs text-neutral-500">
                  Fetched {new Date(listing.scrapedAt).toLocaleString()}
                </span>
              )}
            </div>
            {summary && (
              <div className="mt-3 flex flex-wrap gap-2">
                <StatChip label="Total" value={summary.total} />
                <StatChip label="New" value={summary.new} tone="new" />
                <StatChip label="Posted" value={summary.alreadyPresent} tone="posted" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {listing?.nextPageUrl ? (
              <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50 p-1">
                <button
                  type="button"
                  disabled={listingLoading || listing.page <= 1}
                  onClick={() => {
                    const prev =
                      listing.page > 2
                        ? listing.url.replace(/\/page\/\d+\/?$/, `/page/${listing.page - 1}/`)
                        : "https://www.gktoday.in/current-affairs/";
                    fetchListing(prev);
                  }}
                  className="inline-flex items-center rounded-lg px-2 py-1.5 text-neutral-700 hover:bg-white disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-xs font-medium text-neutral-600 tabular-nums">
                  Page {listing.page || 1}
                </span>
                <button
                  type="button"
                  disabled={listingLoading}
                  onClick={() => fetchListing(listing.nextPageUrl)}
                  className="inline-flex items-center rounded-lg px-2 py-1.5 text-neutral-700 hover:bg-white disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => fetchListing(listingUrl)}
              disabled={listingLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {listingLoading ? <Spinner className="h-4 w-4 text-white" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        </div>

        {listingError ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{listingError}</span>
          </div>
        ) : null}
      </section>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setListFilter(tab.id)}
              className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                listFilter === tab.id
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {tab.label}
              {tab.id === "all" && articles.length ? ` (${articles.length})` : ""}
              {tab.id === "new" && summary ? ` (${summary.new})` : ""}
              {tab.id === "posted" && summary ? ` (${summary.alreadyPresent})` : ""}
            </button>
          ))}
        </div>
        <p className="hidden text-xs text-neutral-500 sm:block">
          Tap <strong className="font-medium text-neutral-700">Rewrite</strong> to open the editor
        </p>
      </div>

      {/* Article list — full width */}
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        {listingLoading && !articles.length ? (
          <div className="flex items-center justify-center gap-2 p-16 text-sm text-neutral-500">
            <Spinner />
            Loading articles…
          </div>
        ) : null}

        {!listingLoading && !filteredArticles.length ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-neutral-900">No articles in this filter</p>
            <p className="mt-1 text-xs text-neutral-500">
              {listFilter !== "all" ? "Try another filter or refresh the listing." : "Refresh to load GKToday articles."}
            </p>
          </div>
        ) : null}

        <ul className="divide-y divide-neutral-100">
          {filteredArticles.map((article) => {
            const isRewriting = rewritingId === (article.slug || article.url);

            return (
              <li key={article.url}>
                <ArticleRow
                  article={article}
                  isRewriting={isRewriting}
                  onRewrite={() => handleRewrite(article)}
                />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function StatChip({ label, value, tone = "neutral" }) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-700",
    new: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100",
    posted: "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
  };
  return (
    <span className={`rounded-lg px-3 py-1.5 text-xs font-medium ${tones[tone] || tones.neutral}`}>
      {label}: <span className="font-semibold tabular-nums">{value}</span>
    </span>
  );
}

function ArticleRow({ article, isRewriting, onRewrite }) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5 hover:bg-neutral-50/80 transition-colors">
      {article.thumbnail?.srcProxy || article.thumbnail?.src ? (
        <img
          src={article.thumbnail.srcProxy || article.thumbnail.src}
          alt=""
          className="h-28 w-full rounded-xl object-cover bg-neutral-100 sm:h-20 sm:w-32 sm:shrink-0"
        />
      ) : (
        <div className="flex h-28 w-full items-center justify-center rounded-xl bg-neutral-100 text-xs text-neutral-400 sm:h-20 sm:w-32 sm:shrink-0">
          No image
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge alreadyPresent={article.alreadyPresent} />
          {article.date ? (
            <span className="text-[11px] text-neutral-500">{article.date}</span>
          ) : null}
        </div>
        <h4 className="mt-1.5 text-sm font-semibold leading-snug text-neutral-900 sm:text-base">
          {article.title}
        </h4>
        {article.snippet ? (
          <p className="mt-1.5 text-sm text-neutral-600 line-clamp-2">{article.snippet}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Source
            <ExternalLink className="h-3 w-3" />
          </a>
          {article.existingArticle?.publicUrl ? (
            <a
              href={article.existingArticle.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100"
            >
              View published
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 sm:pt-1">
        <button
          type="button"
          onClick={onRewrite}
          disabled={isRewriting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60 sm:w-auto"
        >
          {isRewriting ? <Spinner className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4" />}
          Rewrite
        </button>
      </div>
    </div>
  );
}

function EditorView({
  activeArticle,
  form,
  updateForm,
  editorBusy,
  rewriteError,
  publishResult,
  publishing,
  canPublish,
  missingFields,
  onBack,
  onPublish,
}) {
  return (
    <div className="pb-24 lg:pb-8">
      {/* Sticky editor header */}
      <div className="sticky top-20 z-30 -mx-4 mb-5 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to list</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                Rewrite &amp; publish
              </p>
              <p className="truncate text-sm font-semibold text-neutral-900">
                {form.title || activeArticle?.title || "New draft"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onPublish}
            disabled={!canPublish}
            className="hidden items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 sm:inline-flex"
          >
            {publishing ? <Spinner className="h-4 w-4 text-white" /> : <Upload className="h-4 w-4" />}
            Publish
          </button>
        </div>
      </div>

      {/* Status banners */}
      <div className="space-y-3 mb-5">
        {editorBusy ? (
          <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
            <Spinner />
            Rewriting with AI — this may take a moment…
          </div>
        ) : null}

        {rewriteError ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{rewriteError}</span>
          </div>
        ) : null}

        {publishResult?.success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-medium">
              {publishResult.alreadyPosted ? "Article already in database" : "Published successfully"}
            </p>
            {publishResult.postUrl ? (
              <a
                href={publishResult.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-emerald-800 underline"
              >
                {publishResult.postUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        ) : null}

        {!editorBusy && missingFields.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            Required before publish: {missingFields.join(", ")}
          </div>
        ) : null}
      </div>

      {/* Source link */}
      {activeArticle?.url ? (
        <a
          href={activeArticle.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
        >
          Original GKToday article
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}

      {/* Form — single column on mobile, metadata grid on desktop */}
      <div className="space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Article details</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block lg:col-span-2">
              <span className="text-xs font-medium text-neutral-700">Title</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                disabled={editorBusy}
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-neutral-700">Slug</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateForm({ slug: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                disabled={editorBusy}
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-neutral-700">Category</span>
              <input
                type="text"
                value={form.category}
                onChange={(e) => updateForm({ category: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                disabled={editorBusy}
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-neutral-700">Tags</span>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => updateForm({ tags: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                disabled={editorBusy}
                placeholder="comma-separated"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-neutral-700">Status</span>
              <select
                value={form.status}
                onChange={(e) => updateForm({ status: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                disabled={editorBusy}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>

            <label className="block lg:col-span-2">
              <span className="text-xs font-medium text-neutral-700">Meta description</span>
              <textarea
                value={form.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                disabled={editorBusy}
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="text-xs font-medium text-neutral-700">Excerpt</span>
              <textarea
                value={form.excerpt}
                onChange={(e) => updateForm({ excerpt: e.target.value })}
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                disabled={editorBusy}
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="text-xs font-medium text-neutral-700">Featured image URL</span>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => updateForm({ imageUrl: e.target.value })}
                placeholder="https://..."
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                disabled={editorBusy}
              />
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="mt-3 max-h-48 w-full rounded-xl border border-neutral-200 object-contain bg-neutral-50 sm:max-w-md"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Article body</h3>
          <div className="rounded-xl border border-neutral-200 overflow-hidden">
            <RichTextEditor
              content={form.content}
              onChange={(html) => updateForm({ content: html })}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <label className="flex items-start gap-2.5 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={form.force}
              onChange={(e) => updateForm({ force: e.target.checked })}
              disabled={editorBusy}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Force publish</span>
              <span className="block text-xs text-neutral-500 mt-0.5">
                Skip slug dedupe — use only with a unique slug
              </span>
            </span>
          </label>

          {form.content && !editorBusy ? (
            <details className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <summary className="cursor-pointer text-xs font-medium text-neutral-700">
                HTML preview
              </summary>
              <div
                className="prose prose-sm mt-3 max-w-none"
                dangerouslySetInnerHTML={{ __html: form.content }}
              />
            </details>
          ) : null}
        </section>
      </div>

      {/* Mobile sticky publish bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur sm:hidden safe-area-bottom">
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {publishing ? <Spinner className="h-4 w-4 text-white" /> : <Upload className="h-4 w-4" />}
          Publish to database
        </button>
      </div>
    </div>
  );
}
