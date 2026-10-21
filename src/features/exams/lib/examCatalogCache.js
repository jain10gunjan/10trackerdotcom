import { revalidatePath, revalidateTag } from 'next/cache';

export const EXAM_CATALOG_CACHE_TAG = 'exam-catalog';
export const EXAM_QUESTION_COUNTS_CACHE_TAG = 'exam-question-counts';
export const EXAM_CATALOG_REVALIDATE_SECONDS = 120;
/** Question totals change slowly. One shared refresh serves every page. */
export const EXAM_QUESTION_COUNTS_REVALIDATE_SECONDS = 900;

/**
 * Bust the public exam list after an admin toggle or edit.
 * Question totals stay on their own timer so a rename or visibility change
 * does not recount the question bank.
 */
export function revalidateExamCatalogCache() {
  try {
    revalidateTag(EXAM_CATALOG_CACHE_TAG);
    revalidatePath('/');
    revalidatePath('/exams');
  } catch (error) {
    console.error('[exams] revalidateExamCatalogCache failed', error);
  }
}
