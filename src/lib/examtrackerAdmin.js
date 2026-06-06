/** Map examtracker DB row ↔ MCQ extractor UI shape */

export function examtrackerRowToMcq(row) {
  if (!row) return null;
  const opts = row.options && typeof row.options === "object" ? row.options : null;
  return {
    ...row,
    _id: row._id ?? row.id,
    question: row.question ?? "",
    original_question: row.original_question ?? row.question ?? "",
    options_A: row.options_A ?? opts?.A ?? opts?.a ?? "",
    options_B: row.options_B ?? opts?.B ?? opts?.b ?? "",
    options_C: row.options_C ?? opts?.C ?? opts?.c ?? "",
    options_D: row.options_D ?? opts?.D ?? opts?.d ?? "",
    correct_option: row.correct_option ?? "A",
    solution: row.solution ?? row.solutiontext ?? "",
    _fromDb: true,
  };
}

export function mcqToExamtrackerPayload(mcq, defaults = {}) {
  const row = {
    _id: mcq._id,
    topic: mcq.topic ?? defaults.topic,
    category: mcq.category ?? defaults.category,
    subject: mcq.subject ?? defaults.subject,
    chapter: mcq.chapter ?? defaults.chapter,
    difficulty: mcq.difficulty ?? defaults.difficulty ?? "medium",
    year: mcq.year,
    question: mcq.question,
    options_A: mcq.options_A,
    options_B: mcq.options_B,
    options_C: mcq.options_C,
    options_D: mcq.options_D,
    correct_option: mcq.correct_option,
    solution: mcq.solution,
    directionHTML: mcq.directionHTML,
    order_index: mcq.order_index,
  };
  if (mcq.original_question) {
    row.original_question = mcq.original_question;
  }
  return row;
}

export function categoryForDb(value, examSlug) {
  const v = String(value || "").trim();
  if (v) return v.toUpperCase().replace(/\s+/g, "-");
  if (examSlug) return String(examSlug).trim().toUpperCase().replace(/-/g, "-");
  return "";
}
