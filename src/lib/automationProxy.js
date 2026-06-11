/** Client-safe paths for the Next.js automation API proxy (no secrets). */

/** Browser calls this — never the raw :3003 host. */
export const AUTOMATION_PROXY_BASE = "/api/automation";

/**
 * Map upstream path (e.g. "/api/gktoday/rewrite") to same-origin proxy URL.
 * @param {string} upstreamPath
 * @param {Record<string, string | number | boolean | undefined | null>} [query]
 */
export function toAutomationProxyUrl(upstreamPath, query) {
  const raw = String(upstreamPath || "").trim();
  const withoutApi = raw.replace(/^\/api\/?/, "");
  const base = `${AUTOMATION_PROXY_BASE}/${withoutApi}`;

  if (!query || typeof query !== "object") return base;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "") continue;
    params.set(key, String(value));
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
