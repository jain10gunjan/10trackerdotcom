import { createHash } from 'crypto';
import {
  getServiceRoleSupabase,
  uploadBufferToStorage,
} from '@/lib/supabaseStorageServer';

const BUCKET = 'article-images';
const PREFIX = 'gate-pyq';

function hashUrl(url) {
  return createHash('sha256').update(String(url)).digest('hex').slice(0, 32);
}

function extFromContentType(contentType) {
  if (!contentType) return 'jpg';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return 'jpg';
}

export function buildGateImagePublicUrl(sourceUrl, ext = 'jpg') {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !sourceUrl) return null;
  const hash = hashUrl(sourceUrl);
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${PREFIX}/${hash}.${ext}`;
}

/**
 * Ensure a GATE/practicepaper image is mirrored to Supabase Storage.
 * Deterministic path so rewrites are stable across requests.
 */
export async function ensureMirroredGateImage(sourceUrl) {
  if (!sourceUrl || typeof sourceUrl !== 'string') return null;
  let absolute = sourceUrl.trim();
  if (absolute.startsWith('/wp-content/uploads/GATE')) {
    absolute = `https://practicepaper.in${absolute}`;
  }
  if (!/^https?:\/\//i.test(absolute)) return null;
  if (!/practicepaper\.in|gateoverflow/i.test(absolute) && !absolute.includes('/wp-content/uploads/GATE')) {
    return absolute; // leave unrelated CDNs alone
  }

  try {
    const supabase = getServiceRoleSupabase();
    const hash = hashUrl(absolute);

    // Prefer existing jpg/png/webp
    for (const ext of ['jpg', 'png', 'webp', 'gif']) {
      const path = `${PREFIX}/${hash}.${ext}`;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const head = await fetch(data.publicUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) }).catch(() => null);
      if (head?.ok) return data.publicUrl;
    }

    const response = await fetch(absolute, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = extFromContentType(contentType);
    const path = `${PREFIX}/${hash}.${ext}`;
    return await uploadBufferToStorage(buffer, path, contentType);
  } catch {
    return null;
  }
}

const IMG_SRC_RE = /(<img[^>]*src=["'])([^"']+)(["'])/gi;

/**
 * Rewrite img src in HTML to mirrored Supabase URLs (best-effort).
 */
export async function rewriteGateImagesInHtml(html, { maxImages = 6 } = {}) {
  if (!html || typeof html !== 'string') return html;
  if (!html.includes('wp-content/uploads/GATE') && !html.includes('practicepaper.in')) {
    return html;
  }

  const urls = [];
  let match;
  const re = /<img[^>]*src=["']([^"']+)["']/gi;
  while ((match = re.exec(html)) !== null) {
    const src = match[1];
    if (/wp-content\/uploads\/GATE|practicepaper\.in/i.test(src) && !urls.includes(src)) {
      urls.push(src);
    }
    if (urls.length >= maxImages) break;
  }

  if (!urls.length) return html;

  const map = new Map();
  await Promise.all(
    urls.map(async (src) => {
      const mirrored = await ensureMirroredGateImage(src);
      if (mirrored) map.set(src, mirrored);
    })
  );

  if (!map.size) return html;

  return html.replace(IMG_SRC_RE, (full, pre, src, post) => {
    const next = map.get(src);
    return next ? `${pre}${next}${post}` : full;
  });
}

export async function rewriteGateImagesInQuestion(row) {
  if (!row) return row;
  const fields = ['question', 'options_A', 'options_B', 'options_C', 'options_D', 'solution', 'solutiontext', 'directionHTML', 'questionextratext'];
  const next = { ...row };
  await Promise.all(
    fields.map(async (key) => {
      if (typeof next[key] === 'string' && next[key]) {
        next[key] = await rewriteGateImagesInHtml(next[key]);
      }
    })
  );
  return next;
}
