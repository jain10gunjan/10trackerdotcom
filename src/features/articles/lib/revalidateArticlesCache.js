import { revalidatePath, revalidateTag } from 'next/cache';

export const ARTICLES_CACHE_TAG = 'articles';
export const ARTICLES_REVALIDATE_SECONDS = 300;

/** Invalidate cached public article pages after mutate/publish. */
export function revalidateArticlesCache({ slug } = {}) {
  try {
    revalidateTag(ARTICLES_CACHE_TAG);
    revalidatePath('/articles');
    revalidatePath('/article');
    if (slug) {
      revalidatePath(`/articles/${slug}`);
    }
  } catch (error) {
    console.error('[articles] revalidateArticlesCache failed', error);
  }
}
