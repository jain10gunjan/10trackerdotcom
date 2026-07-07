/** MCQ extract API helpers (normalize payloads, SSE parsing). */

import {
  MCQ_EXTRACTOR_PROXY_BASE,
  toMcqProxyUrl,
} from "@/lib/mcqExtractorProxy";

/** @deprecated Direct host — use MCQ_EXTRACTOR_PROXY_BASE in the browser. */
export const MCQ_EXTRACTOR_API_BASE = (
  process.env.MCQ_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "")
).replace(/\/$/, "");

/** Same-origin proxy for admin UI (secrets stay on server). */
export { MCQ_EXTRACTOR_PROXY_BASE, toMcqProxyUrl };

/** Map platform_exams row → extract API form defaults */
export function extractSettingsFromExam(exam) {
  if (!exam) {
    return {
      subject: "General Studies",
      chapter: "",
      category: "PYQ",
      default_topic: "general",
    };
  }
  const slug = String(exam.slug || "").trim().toLowerCase();
  return {
    subject: String(exam.name || exam.slug || "General Studies").trim(),
    chapter: "",
    category: slug
      ? slug.toUpperCase().replace(/-/g, "-")
      : String(exam.category || "PYQ").trim().toUpperCase(),
    default_topic: slug || "general",
  };
}

export function normalizeMcq(q, i = 0) {
  if (!q || typeof q !== "object") return null;
  const pick = (...keys) => {
    for (const k of keys) {
      if (q[k] != null && String(q[k]).trim() !== "") return String(q[k]);
    }
    return "";
  };
  const opts = q.options && typeof q.options === "object" ? q.options : null;
  const opt = (letter) => {
    const lo = letter.toLowerCase();
    if (opts?.[letter] != null && String(opts[letter]).trim()) return String(opts[letter]);
    if (opts?.[lo] != null && String(opts[lo]).trim()) return String(opts[lo]);
    return "";
  };
  const optionsFromObject = opts
    ? {
        options_A: opt("A"),
        options_B: opt("B"),
        options_C: opt("C"),
        options_D: opt("D"),
      }
    : {};
  return {
    ...q,
    ...optionsFromObject,
    _id: pick("_id", "id") || `MCQ_${String(i + 1).padStart(3, "0")}`,
    question: pick("question", "question_text", "stem"),
    original_question: pick(
      "original_question",
      "originalQuestion",
      "extracted_question",
      "source_question"
    ),
    options_A: pick("options_A", "optionA", "option_a") || opt("A"),
    options_B: pick("options_B", "optionB", "option_b") || opt("B"),
    options_C: pick("options_C", "optionC", "option_c") || opt("C"),
    options_D: pick("options_D", "optionD", "option_d") || opt("D"),
    correct_option: normalizeCorrectOption(q, pick, opt),
  };
}

function normalizeCorrectOption(q, pick, opt) {
  const raw = pick("correct_option", "correctOption", "answer");
  const hasOpts = ["A", "B", "C", "D"].some((letter) => {
    const fromPick = pick(`options_${letter}`, `option${letter}`, `option_${letter.toLowerCase()}`);
    return fromPick || opt(letter);
  });
  if (!hasOpts) {
    return raw || "";
  }
  return (raw || "A").toUpperCase().charAt(0);
}

export function normalizeMcqList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((q, i) => normalizeMcq(q, i)).filter(Boolean);
}

export function mergeMcqLists(existing, incoming) {
  const map = new Map();
  for (const q of existing) map.set(q._id, q);
  for (const raw of incoming) {
    const n = normalizeMcq(raw, map.size);
    if (n) map.set(n._id, n);
  }
  return [...map.values()];
}

export function stripHtml(text) {
  return (text || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function parseExtractPayload(data) {
  if (!data) return { mcqs: [], meta: null };
  if (Array.isArray(data)) return { mcqs: normalizeMcqList(data), meta: null };
  const raw = data.mcqs ?? data.data ?? data.questions ?? data.items ?? [];
  const mcqs = normalizeMcqList(Array.isArray(raw) ? raw : []);
  const meta = data.meta ?? (mcqs.length ? { ...data, mcqs: undefined } : null);
  return { mcqs, meta };
}

export function processSseEvent(raw, onEvent) {
  if (!raw.trim()) return;
  const lines = raw.split("\n");
  const eventLine = lines.find((l) => l.startsWith("event:"));
  if (!eventLine) return;
  const event = eventLine.slice(6).trim();
  const jsonStr = lines
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.replace(/^data:\s?/, ""))
    .join("");
  if (!jsonStr) return;
  try {
    onEvent(event, JSON.parse(jsonStr));
  } catch (err) {
    console.warn("SSE JSON parse failed:", err.message);
  }
}

export function drainSseBuffer(buf, onEvent) {
  const parts = buf.split("\n\n");
  const tail = parts.pop() ?? "";
  for (const raw of parts) processSseEvent(raw, onEvent);
  return tail;
}
