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
  'PRACTICE_CHAPTER',
  'MOCK_TEST',
];

export const PLATFORM_RESOURCE_TYPES = ['PRACTICE_CHAPTER', 'MOCK_TEST'];
export const JUDGE_RESOURCE_TYPES = [
  'LEETCODE_PROBLEM',
  'CODESTUDIO_PROBLEM',
  'HACKERRANK_PROBLEM',
];

export const PROGRESS_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'SKIPPED',
  'COMPLETED',
];

export const VIDEO_MILESTONES = [10, 25, 50, 75, 90, 100];

export const OG_TRACKERS_SETUP_HINT =
  'Run setup_og_trackers.sql, then add_og_trackers_platform_resources.sql and add_og_trackers_path_study_settings.sql in Supabase SQL Editor; reload the API schema.';
