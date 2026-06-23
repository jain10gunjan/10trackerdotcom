/**
 * SERVER-SIDE ONLY — use in Route Handlers / Server Actions only.
 * Never import from Client Components ("use client").
 *
 * .env.local (no NEXT_PUBLIC_ on the secret):
 *   INTERNAL_API_SECRET=your-strong-random-secret
 *   MCQ_API_URL=http://localhost:3001
 *
 * MCQ_API_URL falls back to localhost:3001 in development only.
 */

function resolveApiBase() {
  const fromEnv = process.env.MCQ_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:3001";
  return "";
}

/**
 * Authenticated fetch for the MCQ Extractor API (server-side only).
 *
 * @param {string} path - API path (e.g. "/api/extract") or absolute URL
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export default async function apiFetch(path, options = {}) {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  const API_BASE = resolveApiBase();

  if (!secret) {
    throw new Error("INTERNAL_API_SECRET is not set");
  }
  if (!API_BASE && !path.startsWith("http")) {
    throw new Error("MCQ_API_URL is not set");
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  headers.set("x-internal-secret", secret);

  return fetch(url, {
    ...options,
    headers,
  });
}

export { resolveApiBase as getMcqApiBaseUrl };
