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
  'Run setup_og_trackers.sql, platform/study settings SQL, then setup_og_exams_chapters.sql in Supabase SQL Editor; reload the API schema.';

/** Always shown in Exam track (DB rows preferred; used when og_exams is missing). */
export const DEFAULT_OG_EXAMS = [
  {
    slug: 'gate-cse',
    title: 'GATE CSE',
    description: 'Chapter-wise trackers for GATE Computer Science — watch, practice, mock.',
    icon: 'Cpu',
    sortOrder: 10,
    isFeatured: true,
    aliases: ['gate cse', 'gate-cse', 'gatecse'],
  },
  {
    slug: 'dsa',
    title: 'DSA',
    description: 'Data Structures & Algorithms paths for interviews and fundamentals.',
    icon: 'Code2',
    sortOrder: 20,
    isFeatured: false,
    aliases: ['dsa', 'data structures', 'data structures & algorithms'],
  },
  {
    slug: 'placement',
    title: 'Placement',
    description: 'Interview-ready study loops — aptitude, coding, and company patterns.',
    icon: 'Briefcase',
    sortOrder: 30,
    isFeatured: false,
    aliases: ['placement'],
  },
];
