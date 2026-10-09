const STATUSES = new Set(['draft', 'published', 'archived']);
const RELEASE = new Set(['instant', 'after_window', 'manual']);

export function normalizeVendorTestPayload(body, { partial = false } = {}) {
  const out = {};

  if (!partial || body.title !== undefined) {
    const title = String(body.title || '').trim();
    if (!title) return { ok: false, error: 'title is required' };
    out.title = title;
  }

  for (const key of ['description', 'instructions']) {
    if (body[key] !== undefined) {
      out[key] = body[key] == null || body[key] === '' ? null : String(body[key]);
    }
  }

  if (body.duration_minutes !== undefined || !partial) {
    const d = Number(body.duration_minutes ?? 60);
    if (!Number.isFinite(d) || d < 1 || d > 600) {
      return { ok: false, error: 'duration_minutes must be 1–600' };
    }
    out.duration_minutes = Math.round(d);
  }

  if (body.status !== undefined) {
    if (!STATUSES.has(body.status)) return { ok: false, error: 'Invalid status' };
    out.status = body.status;
  } else if (!partial) {
    out.status = 'draft';
  }

  if (body.starts_at !== undefined) {
    out.starts_at = body.starts_at ? new Date(body.starts_at).toISOString() : null;
  }
  if (body.ends_at !== undefined) {
    out.ends_at = body.ends_at ? new Date(body.ends_at).toISOString() : null;
  }

  if (body.total_marks !== undefined) {
    out.total_marks =
      body.total_marks === null || body.total_marks === ''
        ? null
        : Number(body.total_marks);
  }
  if (body.passing_marks !== undefined) {
    out.passing_marks =
      body.passing_marks === null || body.passing_marks === ''
        ? null
        : Number(body.passing_marks);
  }
  if (body.negative_marking !== undefined) {
    const n = Number(body.negative_marking);
    out.negative_marking = Number.isFinite(n) && n >= 0 ? n : 0;
  } else if (!partial) {
    out.negative_marking = 0;
  }

  if (body.shuffle_questions !== undefined) out.shuffle_questions = !!body.shuffle_questions;
  if (body.shuffle_options !== undefined) out.shuffle_options = !!body.shuffle_options;
  if (body.anti_cheat_enabled !== undefined) out.anti_cheat_enabled = !!body.anti_cheat_enabled;
  else if (!partial) out.anti_cheat_enabled = true;

  if (body.max_focus_violations !== undefined || !partial) {
    const raw = body.max_focus_violations ?? 4;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1 || n > 50) {
      return { ok: false, error: 'Allowed switches must be a number from 1 to 50' };
    }
    out.max_focus_violations = Math.round(n);
  }

  if (body.max_attempts !== undefined || !partial) {
    const m = Number(body.max_attempts ?? 1);
    out.max_attempts = Number.isFinite(m) && m >= 1 ? Math.min(20, Math.round(m)) : 1;
  }

  if (body.result_release !== undefined) {
    if (!RELEASE.has(body.result_release)) {
      return { ok: false, error: 'Invalid result_release' };
    }
    out.result_release = body.result_release;
  } else if (!partial) {
    out.result_release = 'instant';
  }

  if (body.results_released !== undefined) {
    out.results_released = !!body.results_released;
  }

  return { ok: true, data: out };
}
