/** Shared OpenAI rewrite calls (drawer + bulk). */

export function plainQuestionText(html) {
  return String(html || "")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractStem(content) {
  if (!content) return null;
  let t = String(content)
    .trim()
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""));
  t = t.replace(/^["'\s]*Question\s*:\s*/i, "").trim();
  const stop =
    /(\n\s*(?:A[\).\]:-]|\(A\)|Option\s*A\b|Options?\b)|\n\s*(?:Answer|Correct\s*Answer|Explanation|Solution)\b|(?:^|\n)\s*(?:A\)|A\.|A:)\s+)/i.exec(
      t
    );
  if (stop?.index > 0) t = t.slice(0, stop.index).trim();
  t = (t.split(/\n\s*\n/)[0] ?? t).trim();
  return t.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() || null;
}

/**
 * Bulk rewrite in one HTTP request. Server batches into 1–2 OpenAI calls per type
 * (chunked at 12 items) so the system prompt is reused and tokens are efficient.
 */
export async function rewriteBulkWithApi({
  questions = [],
  solutions = [],
  rewriteQuestions = true,
  rewriteSolutions = false,
}) {
  const resp = await fetch("/api/generate-similar", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "rewrite-bulk",
      questions,
      solutions,
      rewriteQuestions,
      rewriteSolutions,
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Bulk rewrite failed (${resp.status})`);

  return {
    questionResults: data.questionResults ?? {},
    solutionResults: data.solutionResults ?? {},
    usage: data.usage ?? null,
    model: data.model ?? null,
    note: data.promptCachingNote ?? null,
    openAiCalls: data.openAiCalls ?? null,
    usedFallback: data.usedFallback ?? false,
  };
}

export async function rewriteWithApi(mode, text, maxTokens) {
  const resp = await fetch("/api/generate-similar", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, question: text, maxTokens }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Rewrite failed (${resp.status})`);

  const out =
    mode === "rewrite-question"
      ? extractStem(data.content) || data.content
      : data.content?.trim();
  if (!out) throw new Error("Empty rewrite result");

  return {
    out,
    usage: data.usage ?? null,
    model: data.model ?? null,
    note: data.promptCachingNote ?? null,
  };
}

/** Process items with limited concurrency. */
export async function runWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let i = 0;

  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}
