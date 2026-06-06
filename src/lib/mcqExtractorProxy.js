/** Client-safe paths for the Next.js MCQ extractor proxy (no secrets). */

/** Browser calls this — never the raw :3001 host. */
export const MCQ_EXTRACTOR_PROXY_BASE = "/api/mcq-extractor";

/**
 * Map upstream path (e.g. "/api/download/abc") to same-origin proxy URL.
 * @param {string} upstreamPath
 */
export function toMcqProxyUrl(upstreamPath) {
  const raw = String(upstreamPath || "").trim();
  if (!raw) return MCQ_EXTRACTOR_PROXY_BASE;
  const withoutApi = raw.replace(/^\/api\/?/, "");
  return `${MCQ_EXTRACTOR_PROXY_BASE}/${withoutApi}`;
}
