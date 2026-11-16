export const VIDEO_MILESTONES = [10, 25, 50, 75, 90, 100];

export function crossedMilestone(prevPercent, nextPercent) {
  return VIDEO_MILESTONES.filter((m) => prevPercent < m && nextPercent >= m);
}

export function clampPercent(value) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(100, n));
}
