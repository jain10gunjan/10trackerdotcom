/**
 * SERVER-SIDE ONLY — use in Route Handlers / Server Actions only.
 * Never import from Client Components ("use client").
 *
 * .env.local (no NEXT_PUBLIC_ on the secret):
 *   INTERNAL_API_SECRET=your-strong-random-secret
 *   MCQ_API_URL=http://localhost:3001
 *
 * MCQ_API_URL falls back to NEXT_PUBLIC_MCQ_EXTRACTOR_API then localhost:3001.
 */

function resolveApiBase() {
  return (
    process.env.MCQ_API_URL ||
    process.env.NEXT_PUBLIC_MCQ_EXTRACTOR_API ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
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
