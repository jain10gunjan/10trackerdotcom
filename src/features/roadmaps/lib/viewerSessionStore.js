const PREFIX = 'roadmap-viewer:';

export function getLastViewedDay(slug) {
  if (typeof window === 'undefined' || !slug) return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}${slug}:lastDay`);
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? n : null;
  } catch {
    return null;
  }
}

export function setLastViewedDay(slug, dayNumber) {
  if (typeof window === 'undefined' || !slug || !dayNumber) return;
  try {
    localStorage.setItem(`${PREFIX}${slug}:lastDay`, String(dayNumber));
  } catch {
    /* quota */
  }
}
