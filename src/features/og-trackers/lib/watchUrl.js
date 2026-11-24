/** In-app OG tracker watch page. Opens from the path in a new tab. */
export function ogWatchPath(pathSlug, resourceId) {
  return `/og-trackers/${encodeURIComponent(pathSlug)}/watch/${encodeURIComponent(resourceId)}`;
}

/**
 * Seconds to resume a video from stored percent + duration.
 * Caps at 99% so a finished video does not open on the ended frame.
 * Returns 0 when duration or percent is missing.
 */
export function resumeSeconds(resource) {
  const percent = Number(resource?.progress?.percentWatched) || 0;
  const duration = Number(resource?.durationSeconds) || 0;
  if (!duration || percent <= 0) return 0;
  return Math.max(0, Math.floor((duration * Math.min(percent, 99)) / 100));
}
