"use client";

const STYLES = {
  web_search: "bg-violet-50 text-violet-800 border-violet-200",
  fetch: "bg-sky-50 text-sky-800 border-sky-200",
  pdf: "bg-indigo-50 text-indigo-800 border-indigo-200",
  url: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

const LABELS = {
  web_search: "Web search",
  fetch: "Direct fetch",
  pdf: "PDF extract",
  url: "URL",
};

export default function MethodBadge({ method, sourceType }) {
  const key = method || sourceType;
  if (!key) return null;

  const style = STYLES[key] || STYLES.url;
  const label = LABELS[key] || String(key).replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style}`}
    >
      {label}
    </span>
  );
}
