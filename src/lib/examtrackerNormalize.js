import { randomUUID } from "crypto";

const ALLOWED_KEYS = new Set([
  "_id",
  "topic",
  "category",
  "difficulty",
  "year",
  "subject",
  "question",
  "options_A",
  "options_B",
  "options_C",
  "options_D",
  "correct_option",
  "solution",
  "questionCode",
  "questionImage",
  "solutiontext",
  "topicList",
  "topic_list",
  "chapter",
  "order_index",
  "directionHTML",
]);

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

export function normalizeRow(raw, defaults = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Each item must be a JSON object" };
  }

  const out = {};
  for (const key of ALLOWED_KEYS) {
    if (raw[key] !== undefined && raw[key] !== null) {
      out[key] = raw[key];
    }
  }

  const id = raw._id ?? raw.id;
  out._id =
    id !== undefined && id !== null && String(id).trim() !== ""
      ? String(id).trim()
      : randomUUID();

  if (defaults.category && !out.category) {
    out.category = String(defaults.category).trim();
  }
  if (defaults.topic && !out.topic) {
    out.topic = String(defaults.topic).trim();
  }
  if (defaults.subject && !out.subject) {
    out.subject = String(defaults.subject).trim();
  }
  if (defaults.difficulty && !out.difficulty) {
    out.difficulty = String(defaults.difficulty).trim().toLowerCase();
  }
  if (defaults.chapter && !out.chapter) {
    out.chapter = String(defaults.chapter).trim();
  }

  if (!out.topic || String(out.topic).trim() === "") {
    return { ok: false, error: `Missing topic for _id=${out._id}` };
  }
  if (!out.category || String(out.category).trim() === "") {
    return { ok: false, error: `Missing category for _id=${out._id}` };
  }

  if (out.category) {
    out.category = String(out.category).trim().toUpperCase();
  }
  if (out.difficulty) {
    const d = String(out.difficulty).trim().toLowerCase();
    if (!DIFFICULTIES.has(d)) {
      return {
        ok: false,
        error: `Invalid difficulty "${out.difficulty}" for _id=${out._id} (use easy|medium|hard)`,
      };
    }
    out.difficulty = d;
  } else {
    out.difficulty = "easy";
  }

  if (out.correct_option !== undefined && out.correct_option !== null) {
    out.correct_option = String(out.correct_option).trim().toUpperCase();
  }

  if (out.year !== undefined && out.year !== null) {
    const y = Number(out.year);
    out.year = Number.isFinite(y) ? y : out.year;
  }
  if (out.order_index !== undefined && out.order_index !== null) {
    const o = Number(out.order_index);
    out.order_index = Number.isFinite(o) ? o : out.order_index;
  }

  if (!out.question || String(out.question).trim() === "") {
    return { ok: false, error: `Missing question text for _id=${out._id}` };
  }

  return { ok: true, row: out };
}
