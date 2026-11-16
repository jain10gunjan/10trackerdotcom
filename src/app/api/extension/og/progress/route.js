import { NextResponse } from 'next/server';
import { requireExtensionToken } from '@/features/extension-auth/lib/tokenService';
import {
  getResourceByYoutubeVideoId,
  upsertProgress,
} from '@/features/og-trackers/lib/ogTrackerService';
import { PROGRESS_STATUSES } from '@/features/og-trackers/lib/constants';
import { extractYouTubeVideoId } from '@/features/og-trackers/lib/youtubeId';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

export async function POST(request) {
  try {
    const authResult = await requireExtensionToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { email, tokenId, label } = authResult;
    const limit = checkApiRateLimit(email, 'extension-og-progress', {
      windowMs: 60_000,
      max: 120,
    });
    if (!limit.ok) {
      const r = rateLimitResponse(limit);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    const body = await request.json().catch(() => ({}));
    const videoId = extractYouTubeVideoId(
      body.youtubeVideoId || body.videoId || body.v || ''
    );
    const percentWatched = body.percentWatched;
    let progressStatus = body.status || null;
    if (
      progressStatus &&
      !PROGRESS_STATUSES.includes(String(progressStatus).toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }
    if (progressStatus) {
      progressStatus = String(progressStatus).toUpperCase();
    }

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'youtubeVideoId required' },
        { status: 400 }
      );
    }

    const resolved = await getResourceByYoutubeVideoId(videoId, email);
    if (!resolved) {
      return NextResponse.json(
        {
          success: false,
          found: false,
          error: 'Video is not in any active 10Tracker path',
        },
        { status: 404 }
      );
    }

    if (resolved.locked) {
      return NextResponse.json(
        {
          success: false,
          found: true,
          locked: true,
          error: 'Premium video — unlock OG Trackers Premium to track progress',
        },
        { status: 403 }
      );
    }

    const row = await upsertProgress(email, {
      resourceId: resolved.resource.id,
      percentWatched:
        progressStatus === 'COMPLETED'
          ? Math.max(Number(percentWatched) || 0, 100)
          : percentWatched,
      status: progressStatus,
      deviceLabel: label || 'Extension',
      tokenId: tokenId || null,
    });

    if (process.env.EXTENSION_PROGRESS_DEBUG === '1') {
      console.info('extension/og/progress', {
        email,
        videoId,
        received: percentWatched,
        status: progressStatus,
        saved: row?.percent_watched,
        resourceId: resolved.resource.id,
      });
    }

    return NextResponse.json({
      success: true,
      found: true,
      locked: false,
      path: resolved.path,
      resourceId: resolved.resource.id,
      siblings: resolved.siblings || null,
      pathProgress: resolved.pathProgress || null,
      progress: {
        resource_id: row.resource_id,
        status: row.status,
        percent_watched: row.percent_watched,
        percentWatched: row.percent_watched,
        updated_at: row.updated_at,
        lastDeviceLabel: row.last_device_label || label || null,
      },
    });
  } catch (err) {
    console.error('extension/og/progress', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save progress' },
      { status: 500 }
    );
  }
}
