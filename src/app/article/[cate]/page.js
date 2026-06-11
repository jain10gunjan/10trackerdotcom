import { Suspense } from 'react';
import ArticleCategoryPageContent, {
  generateArticleCategoryMetadata,
} from '@/components/articles/ArticleCategoryPageContent';
import { safeArticlePage, sanitizeSearchQuery } from '@/lib/articles/categoryMeta';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params, searchParams }) {
  const { cate } = await params;
  const resolved = await searchParams;
  const page = safeArticlePage(resolved?.page);
  const query = sanitizeSearchQuery(resolved?.q);
  return generateArticleCategoryMetadata(cate, page, query);
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-20 flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-neutral-800 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default async function CategoryPage({ params, searchParams }) {
  const { cate } = await params;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ArticleCategoryPageContent cate={cate} searchParams={searchParams} />
    </Suspense>
  );
}
