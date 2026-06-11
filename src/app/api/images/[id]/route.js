import automationFetch from '@/lib/automationFetch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public proxy for automation-hosted article images.
 * GET /api/images/:id → AUTOMATION_API_URL/api/images/:id
 */
export async function GET(_request, context) {
  const { id } = await context.params;
  const imageId = String(id || '').trim();

  if (!/^[0-9a-f-]{36}$/i.test(imageId)) {
    return new Response('Invalid image id', { status: 400 });
  }

  try {
    const upstream = await automationFetch(`/api/images/${imageId}`, {
      method: 'GET',
    });

    if (!upstream.ok) {
      return new Response('Image not found', { status: upstream.status === 404 ? 404 : 502 });
    }

    const headers = new Headers();
    const contentType = upstream.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    const disposition = upstream.headers.get('content-disposition');
    if (disposition) headers.set('Content-Disposition', disposition);

    return new Response(upstream.body, { status: 200, headers });
  } catch (err) {
    console.error('[api/images proxy]', imageId, err?.message || err);
    return new Response('Failed to load image', { status: 502 });
  }
}
