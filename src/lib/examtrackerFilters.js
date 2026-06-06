/** Admin examtracker filter + query helpers (distinct values, case variants). */

const ALLOWED_FIELDS = new Set(["category", "subject", "chapter", "topic"]);

export const EXAMTRACKER_LIST_COLUMNS = [
  "_id",
  "topic",
  "category",
  "subject",
  "chapter",
  "difficulty",
  "year",
  "question",
  "options_A",
  "options_B",
  "options_C",
  "options_D",
  "correct_option",
  "solution",
  "solutiontext",
  "directionHTML",
  "order_index",
].join(",");

export function dedupeSorted(values) {
  const seen = new Map();
  for (const raw of values) {
    const v = String(raw ?? "").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (!seen.has(key)) seen.set(key, v);
  }
  return [...seen.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

/** Common category spellings in DB (GATE-CSE vs gate-cse). */
export function categoryVariants(category) {
  const c = String(category ?? "").trim();
  if (!c) return [];
  const upper = c.toUpperCase();
  const lower = c.toLowerCase();
  const title = lower
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
  return dedupeSorted([c, upper, lower, title, upper.replace(/_/g, "-")]);
}

export function applyCategoryFilter(query, category) {
  const variants = categoryVariants(category);
  if (!variants.length) return query;
  if (variants.length === 1) return query.eq("category", variants[0]);
  return query.in("category", variants);
}

export function applySubjectFilter(query, subject) {
  const s = String(subject ?? "").trim();
  if (!s) return query;
  return query.eq("subject", s);
}

export function applyChapterFilter(query, chapter) {
  const c = String(chapter ?? "").trim();
  if (!c) return query;
  return query.eq("chapter", c);
}

/**
 * DISTINCT via Postgres RPC (fast). Returns null if RPC missing.
 */
export async function fetchDistinctRpc(supabase, field, filters = {}) {
  if (!ALLOWED_FIELDS.has(field)) return null;
  const { data, error } = await supabase.rpc("examtracker_distinct_values", {
    p_field: field,
    p_category: filters.category ?? null,
    p_subject: filters.subject ?? null,
    p_chapter: filters.chapter ?? null,
  });
  if (error) {
    if (error.code === "42883" || error.message?.includes("examtracker_distinct_values")) {
      return null;
    }
    throw error;
  }
  const vals = (data ?? []).map((row) => (typeof row === "string" ? row : row?.val));
  return dedupeSorted(vals);
}

/**
 * Fallback: paginate ordered column values (no 15k row cap).
 */
export async function fetchDistinctFallback(supabase, field, filters = {}) {
  if (!ALLOWED_FIELDS.has(field)) return [];

  const seen = new Map();
  let from = 0;
  const page = 2000;
  const maxPages = 80;

  for (let pageNum = 0; pageNum < maxPages; pageNum++) {
    let q = supabase
      .from("examtracker")
      .select(field)
      .not(field, "is", null)
      .order(field, { ascending: true });

    if (filters.category) q = applyCategoryFilter(q, filters.category);
    if (filters.subject) q = applySubjectFilter(q, filters.subject);
    if (filters.chapter) q = applyChapterFilter(q, filters.chapter);

    const { data, error } = await q.range(from, from + page - 1);
    if (error) throw error;
    const batch = data ?? [];
    if (!batch.length) break;

    for (const row of batch) {
      const v = row[field];
      if (v == null || String(v).trim() === "") continue;
      const key = String(v).trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, String(v).trim());
    }

    if (batch.length < page) break;
    from += page;
  }

  return dedupeSorted([...seen.values()]);
}

export async function fetchDistinctValues(supabase, field, filters = {}) {
  const rpc = await fetchDistinctRpc(supabase, field, filters);
  if (rpc) return rpc;
  return fetchDistinctFallback(supabase, field, filters);
}

/** One scope per request — avoids 4 heavy scans. */
export async function fetchFilterScope(supabase, scope, { category, subject, chapter } = {}) {
  switch (scope) {
    case "categories":
      return {
        categories: await fetchDistinctValues(supabase, "category"),
      };
    case "subjects":
      if (!category) return { subjects: [] };
      return {
        subjects: await fetchDistinctValues(supabase, "subject", { category }),
      };
    case "chapters":
      if (!category || !subject) return { chapters: [] };
      return {
        chapters: await fetchDistinctValues(supabase, "chapter", { category, subject }),
      };
    case "topics":
      if (!category || !subject || !chapter) return { topics: [] };
      return {
        topics: await fetchDistinctValues(supabase, "topic", {
          category,
          subject,
          chapter,
        }),
      };
    case "all":
    default: {
      const categories = await fetchDistinctValues(supabase, "category");
      const subjects = category
        ? await fetchDistinctValues(supabase, "subject", { category })
        : [];
      const chapters =
        category && subject
          ? await fetchDistinctValues(supabase, "chapter", { category, subject })
          : [];
      const topics =
        category && subject && chapter
          ? await fetchDistinctValues(supabase, "topic", { category, subject, chapter })
          : [];
      return { categories, subjects, chapters, topics };
    }
  }
}
