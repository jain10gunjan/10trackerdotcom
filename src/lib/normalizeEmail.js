/** Normalize email for DB lookups (case-insensitive matching). */
export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}
