import { parseJsonResponse } from "@/lib/toastAsync";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function apiJson(path, options = {}) {
  const res = await fetch(path, { credentials: "include", ...options });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }
  if (data?.success === false) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export const DEFAULT_CREATION_CONFIG = {
  category: "UPSC-PRELIMS",
  chapter: "general",
  subject: "history",
  id_prefix: "CLP_UPSC",
  start_number: 1,
  default_topic: "",
};

const URL_PATTERN = /^https?:\/\/.+/i;

/** @param {string[]} urls */
export function validateUrls(urls) {
  const cleaned = urls.map((u) => u.trim()).filter(Boolean);
  if (!cleaned.length) {
    return { error: "At least one URL is required (must start with http:// or https://)" };
  }
  for (const u of cleaned) {
    if (!URL_PATTERN.test(u)) {
      return { error: `Invalid URL — must start with http:// or https://: ${u}` };
    }
  }
  return { urls: cleaned };
}

/** @param {Record<string, string | number | boolean>} fields */
export function buildPdfFormData(pdf, fields = {}) {
  const fd = new FormData();
  fd.append("pdf", pdf);
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") continue;
    fd.append(key, String(value));
  }
  return fd;
}

export function creationConfigToFields(config, extras = {}) {
  const topic = config.default_topic?.trim() || config.chapter;
  return {
    category: config.category,
    chapter: config.chapter,
    subject: config.subject,
    id_prefix: config.id_prefix,
    start_number: config.start_number,
    default_topic: topic,
    ...extras,
  };
}

/**
 * @param {typeof DEFAULT_CREATION_CONFIG} config
 * @param {string[]} urls
 * @param {{ useWebSearch?: boolean; rewrite?: boolean; raw?: boolean }} [options]
 */
export function buildUrlPayload(config, urls, options = {}) {
  const topic = config.default_topic?.trim() || config.chapter;
  const payload = {
    category: config.category,
    chapter: config.chapter,
    subject: config.subject,
    id_prefix: config.id_prefix,
    start_number: config.start_number,
    default_topic: topic,
    use_web_search: options.useWebSearch !== false,
    rewrite: Boolean(options.rewrite),
  };

  if (options.raw) payload.raw = true;

  if (urls.length === 1) {
    payload.url = urls[0];
  } else {
    payload.urls = urls;
  }

  return payload;
}

export async function getCreationHealth() {
  return apiJson("/api/creation");
}

export async function postTextExtract(formData) {
  const res = await fetch("/api/text-extract", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await parseJsonResponse(res);
  if (!res.ok || data?.success === false) {
    throw new Error(data?.error || `Extract failed (${res.status})`);
  }
  return data;
}

export async function postUrlExtract(payload) {
  return apiJson("/api/url-extract", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export async function postPipelinePdf(formData) {
  const res = await fetch("/api/pipeline", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await parseJsonResponse(res);
  if (!res.ok || data?.success === false) {
    throw new Error(data?.error || `Pipeline failed (${res.status})`);
  }
  return data;
}

export async function postPipelineUrl(payload) {
  return apiJson("/api/pipeline", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export async function postUrlPipeline(payload) {
  return apiJson("/api/url-pipeline", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

/** @deprecated Use postPipelinePdf */
export const postPipeline = postPipelinePdf;

export async function postRewrite(mcqs) {
  return apiJson("/api/rewrite", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ mcqs }),
  });
}

export async function postExport(mcqs, meta = {}) {
  return apiJson("/api/export", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ mcqs, meta }),
  });
}

export async function getExportFiles() {
  return apiJson("/api/export/files");
}

export function proxiedDownloadUrl(filename) {
  const safe = encodeURIComponent(filename);
  return `/api/export/download/${safe}`;
}

export function resolveExportDownloadHref(meta, lastExport) {
  const fromExport = lastExport?.downloadUrl || meta?.downloadUrl;
  if (fromExport) {
    const fn = String(fromExport).split("/").pop();
    if (fn) return proxiedDownloadUrl(fn);
  }
  const filename = lastExport?.filename || meta?.filename;
  if (filename && String(filename).endsWith(".json")) {
    return proxiedDownloadUrl(filename);
  }
  return null;
}

export async function fetchExportJson(filename) {
  const res = await fetch(proxiedDownloadUrl(filename), {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await parseJsonResponse(res).catch(() => ({}));
    throw new Error(data?.error || `Download failed (${res.status})`);
  }
  return parseJsonResponse(res);
}

export const PDF_PROGRESS_MESSAGES = [
  "Uploading PDF…",
  "Extracting text from PDF…",
  "Identifying questions and options…",
  "Parsing solutions…",
  "Almost done — this can take 30s–3min…",
];

export const URL_WEB_SEARCH_MESSAGES = [
  "Sending URL to OpenAI…",
  "Searching web and reading page content…",
  "Generating copyright-free MCQs…",
  "Formatting questions and solutions…",
  "Almost done — this can take 30s–2min…",
];

export const URL_FETCH_MESSAGES = [
  "Fetching page content…",
  "Parsing questions from HTML…",
  "Generating MCQs…",
  "Almost done…",
];
