import { revalidatePath, revalidateTag } from 'next/cache';

export const EXAM_CATALOG_CACHE_TAG = 'exam-catalog';
export const EXAM_QUESTION_COUNTS_CACHE_TAG = 'exam-question-counts';
export const EXAM_CATALOG_REVALIDATE_SECONDS = 120;
export const EXAM_QUESTION_COUNTS_REVALIDATE_SECONDS = 300;

/** Bust cached public exam catalog after admin toggle/edit. */
export function revalidateExamCatalogCache() {
  try {
    revalidateTag(EXAM_CATALOG_CACHE_TAG);
    revalidatePath('/');
    revalidatePath('/exams');
  } catch (error) {
    console.error('[exams] revalidateExamCatalogCache failed', error);
  }
}
