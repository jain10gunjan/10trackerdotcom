'use client';

import { useYouTubeProgress } from '@/features/og-trackers/hooks/useYouTubeProgress';

export default function OgYouTubePlayer({
  videoId,
  resourceId,
  initialPercent = 0,
  beaconToken = null,
  trackProgress = true,
  onMilestone,
}) {
  const { mountId, ready, percent, error, videoId: resolvedId } = useYouTubeProgress({
    videoId,
    resourceId,
    initialPercent,
    beaconToken,
    trackProgress: Boolean(trackProgress && resourceId),
    onMilestone,
  });

  if (!videoId) {
    return (
      <div className="aspect-video rounded-2xl bg-neutral-100 flex items-center justify-center text-sm text-neutral-500 border border-neutral-200">
        No video configured — paste a YouTube URL or ID in admin.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-950 border border-neutral-800 shadow-sm [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full">
        <div id={mountId} className="absolute inset-0 h-full w-full" />
        {!ready && !error ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-400 bg-neutral-950/80">
            Loading player…
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-red-300 bg-neutral-950">
            {error}
            {resolvedId ? (
              <span className="block mt-1 text-neutral-500 text-xs">ID: {resolvedId}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {trackProgress && resourceId ? (
        <div>
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
            <span>Watch progress</span>
            <span className="tabular-nums font-semibold text-neutral-800">{percent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-neutral-900 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          {percent >= 90 ? (
            <p className="mt-1.5 text-[11px] text-emerald-700 font-medium">Marked complete</p>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-neutral-500">Sign in to save watch progress on this tracker.</p>
      )}
    </div>
  );
}
