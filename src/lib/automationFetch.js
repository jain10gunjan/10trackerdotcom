/**
 * SERVER-SIDE ONLY — use in Route Handlers / Server Actions only.
 *
 * .env.local:
 *   AUTOMATION_API_URL=http://localhost:3003
 */

function resolveAutomationBase() {
  return (
    process.env.AUTOMATION_API_URL ||
    process.env.NEXT_PUBLIC_AUTOMATION_API_URL ||
    "http://localhost:3003"
  ).replace(/\/$/, "");
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
