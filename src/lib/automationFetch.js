/**
 * SERVER-SIDE ONLY — use in Route Handlers / Server Actions only.
 *
 * .env.local:
 *   AUTOMATION_API_URL=http://localhost:3003
 *
 * Production (Vercel): AUTOMATION_API_URL=https://api.10tracker.com
 * Do not use NEXT_PUBLIC_* for this — browser images go through /api/images/:id.
 */

function resolveAutomationBase() {
  const fromEnv = process.env.AUTOMATION_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:3003";
  return "";
}

/**
 * Fetch the automation / article-pipeline API (server-side only).
 *
 * @param {string} path - API path (e.g. "/api/services/fetch/gktoday") or absolute URL
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export default async function automationFetch(path, options = {}) {
  const API_BASE = resolveAutomationBase();

  if (!API_BASE && !path.startsWith("http")) {
    throw new Error("AUTOMATION_API_URL is not set");
  }

  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  return fetch(url, {
    ...options,
    headers: options.headers,
  });
}

export { resolveAutomationBase as getAutomationApiBaseUrl };
