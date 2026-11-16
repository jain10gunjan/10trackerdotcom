/**
 * Legacy alias — prefer POST /api/practice/progress.
 * Kept so old clients/bookmarks still work; forwards to the same handler.
 */
export { POST } from '@/app/api/practice/progress/route';
