import { createClient } from '@supabase/supabase-js';

const BUCKET = 'article-images';

export function getServiceRoleSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase storage is not configured (URL or service role key missing).');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Upload a buffer to Supabase Storage and return the public URL.
 * @param {Buffer} buffer
 * @param {string} storagePath e.g. gate-solutions/abc-0.jpg
 * @param {string} contentType
 */
export async function uploadBufferToStorage(buffer, storagePath, contentType = 'image/jpeg') {
  const supabase = getServiceRoleSupabase();
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function uploadRemoteImageToStorage(imageUrl, storagePathPrefix) {
  const response = await fetch(imageUrl, {
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
  const ext = contentType.includes('png')
    ? 'png'
    : contentType.includes('webp')
      ? 'webp'
      : contentType.includes('gif')
        ? 'gif'
        : 'jpg';
  const path = `${storagePathPrefix}.${ext}`;
  return uploadBufferToStorage(buffer, path, contentType);
}
