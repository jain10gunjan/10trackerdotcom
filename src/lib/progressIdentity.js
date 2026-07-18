/**
 * Progress in Supabase is keyed by `user_id`. Historically that was a Clerk ID
 * (`user_…`), a Firebase UID, or an email depending on the page.
 * Email is the only stable identifier across auth providers.
 */

export function getProgressUserId(user) {
  const email = user?.email?.trim().toLowerCase();
  if (email) return email;
  return user?.id ?? null;
}

/** Supabase filter: match rows saved under any legacy id or the email column. */
export function applyProgressUserFilter(query, user) {
  const email = user?.email?.trim().toLowerCase();
  const authId = user?.authId?.trim() || user?.id?.trim();

  const parts = [];
  if (email) {
    parts.push(`user_id.eq.${email}`, `email.eq.${email}`);
  }
  if (authId && authId !== email) {
    parts.push(`user_id.eq.${authId}`);
  }

  if (!parts.length) {
    const fallback = getProgressUserId(user);
    return fallback ? query.or(`user_id.eq.${fallback},email.eq.${fallback}`) : query;
  }

  return query.or(parts.join(','));
}

/** Progress arrays may be jsonb, a JSON string, or missing on legacy rows. */
export function parseProgressIdArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Merge multiple user_progress rows (same topic) from different legacy user_ids. */
export function mergeProgressRows(rows) {
  if (!rows?.length) {
    return { completed: [], correct: [], points: 0 };
  }

  const completed = new Set();
  const correct = new Set();
  let points = 0;

  for (const row of rows) {
    (Array.isArray(row.completedquestions) ? row.completedquestions : []).forEach((id) => {
      if (id != null) completed.add(String(id));
    });
    (Array.isArray(row.correctanswers) ? row.correctanswers : []).forEach((id) => {
      if (id != null) correct.add(String(id));
    });
    points += typeof row.points === "number" ? row.points : 0;
  }

  return {
    completed: [...completed],
    correct: [...correct],
    points,
  };
}
