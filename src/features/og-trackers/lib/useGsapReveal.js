'use client';

/**
 * Back-compat re-exports — prefer `@/features/og-trackers/lib/ogGsap`.
 */
export {
  useGsapReady,
  useOgHeroTimeline as useGsapEnter,
  useOgStagger as useGsapStagger,
} from '@/features/og-trackers/lib/ogGsap';
