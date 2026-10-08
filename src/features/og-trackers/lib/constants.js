export const OG_TRACKERS_PRODUCT_NAME = 'OG Trackers';

/** Server-side price for global premium unlock (paise). Override via OG_TRACKERS_PREMIUM_PAISE. */
export function getOgPremiumAmountPaise() {
  const raw = Number(
    process.env.OG_TRACKERS_PREMIUM_PAISE ||
      process.env.NEXT_PUBLIC_OG_TRACKERS_PREMIUM_PAISE
  );
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return 49900; // ₹499 default
}

export const RESOURCE_TYPES = [
  'VIDEO',
  'LEETCODE_PROBLEM',
  'CODESTUDIO_PROBLEM',
  'HACKERRANK_PROBLEM',
];

export const PROGRESS_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];

export const VIDEO_MILESTONES = [10, 25, 50, 75, 90, 100];

export const OG_TRACKERS_SETUP_HINT =
  'Run supabase/migrations/setup_og_trackers.sql in Supabase SQL Editor, then reload the API schema.';
