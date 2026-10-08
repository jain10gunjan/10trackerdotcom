/**
 * Accept raw video id or common YouTube URL shapes → 11-char id.
 */
export function extractYouTubeVideoId(input) {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;

  if (/^[\w-]{11}$/.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const v = url.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;

      const parts = url.pathname.split('/').filter(Boolean);
      // /embed/ID, /shorts/ID, /live/ID, /v/ID
      const markers = ['embed', 'shorts', 'live', 'v'];
      for (let i = 0; i < parts.length - 1; i++) {
        if (markers.includes(parts[i]) && /^[\w-]{11}$/.test(parts[i + 1])) {
          return parts[i + 1];
        }
      }
    }
  } catch {
    // not a URL
  }

  const match = raw.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}
