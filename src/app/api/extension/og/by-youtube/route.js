import { NextResponse } from 'next/server';
import { requireExtensionToken } from '@/features/extension-auth/lib/tokenService';
import { getResourceByYoutubeVideoId } from '@/features/og-trackers/lib/ogTrackerService';
import { extractYouTubeVideoId } from '@/features/og-trackers/lib/youtubeId';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

export async function GET(request) {
  try {
    const authResult = await requireExtensionToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { email } = authResult;
    const limit = checkApiRateLimit(email, 'extension-by-youtube', {
      windowMs: 60_000,
      max: 120,
    });
    if (!limit.ok) {
      const r = rateLimitResponse(limit);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    const { searchParams } = new URL(request.url);
    const videoId = extractYouTubeVideoId(searchParams.get('v') || '');
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'v (youtube video id) required' },
        { status: 400 }
      );
    }

    const result = await getResourceByYoutubeVideoId(videoId, email);
    if (!result) {
      return NextResponse.json({
        success: true,
        found: false,
        youtubeVideoId: videoId,
        message: 'Not in your 10Tracker paths',
      });
    }

    return NextResponse.json({
      success: true,
      found: true,
      locked: result.locked,
      youtubeVideoId: result.youtubeVideoId,
      path: result.path,
      resource: result.resource,
      progress: result.progress,
      siblings: result.siblings || { prev: null, next: null },
      pathProgress: result.pathProgress || null,
      weekGoal: result.weekGoal || null,
    });
  } catch (err) {
    console.error('extension/og/by-youtube', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lookup failed' },
      { status: 500 }
    );
  }
}
