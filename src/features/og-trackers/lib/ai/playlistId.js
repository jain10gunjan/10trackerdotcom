const PLAYLIST_ID = /^[A-Za-z0-9_-]{12,80}$/;

export function parsePlaylistId(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  if (PLAYLIST_ID.test(raw) && !raw.includes('/') && !raw.includes('.')) return raw;

  const fromQuery = raw.match(/[?&]list=([A-Za-z0-9_-]{12,80})/);
  if (fromQuery) return fromQuery[1];

  try {
    const url = new URL(raw);
    const list = url.searchParams.get('list');
    if (list && PLAYLIST_ID.test(list)) return list;
  } catch {
    /* not a url */
  }
  return null;
}

export function quotaMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).format(date);
  return parts.slice(0, 7);
}

/** Start and end of the Asia/Kolkata calendar day, as ISO timestamps. */
export function kolkataDayRange(date = new Date()) {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const start = new Date(`${day}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { day, start: start.toISOString(), end: end.toISOString() };
}
