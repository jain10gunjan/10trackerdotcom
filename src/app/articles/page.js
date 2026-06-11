import { redirect } from 'next/navigation';
import ArticlesPageClient from './ArticlesPageClient';
import { articlesListHref } from '@/lib/articles/articlesListHref';
import { safeArticlePage, sanitizeSearchQuery } from '@/lib/articles/categoryMeta';
import {
  ARTICLES_LIST_PAGE_SIZE,
  fetchAllCategories,
  fetchArticlesList,
} from '@/lib/articles/fetchCategoryArticles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ searchParams }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com';
  const resolved = await searchParams;
  const page = safeArticlePage(resolved?.page);
  const title = page > 1 ? `Updates — Page ${page} | 10tracker` : 'Updates | 10tracker';
  const description =
    'Latest updates, current affairs, exam news, and preparation strategies on 10tracker.';
  const canonical = articlesListHref({
    page,
    category: resolved?.category,
    query: sanitizeSearchQuery(resolved?.q),
  });

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: `${siteUrl}${canonical}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}${canonical}`,
      siteName: '10tracker',
      images: [
        {
          url: `${siteUrl}/10tracker.png`,
          width: 1200,
          height: 630,
          alt: '10tracker',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/10tracker.png`],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ArticlesPage({ searchParams }) {
  const resolved = await searchParams;
  const page = safeArticlePage(resolved?.page);
  const category = String(resolved?.category || '').trim().toLowerCase();
  const query = sanitizeSearchQuery(resolved?.q);

  let articles = [];
  let totalCount = 0;
  let categories = [];
  let fetchError = null;

  try {
    const [listResult, categoryRows] = await Promise.all([
      fetchArticlesList({ page, category, query, pageSize: ARTICLES_LIST_PAGE_SIZE }),
      fetchAllCategories().catch(() => []),
    ]);

    articles = listResult.articles;
    totalCount = listResult.totalCount;
    categories = categoryRows;

    const totalPages = Math.max(1, Math.ceil(totalCount / ARTICLES_LIST_PAGE_SIZE));
    if (page > totalPages && totalCount > 0) {
      redirect(
        articlesListHref({
          page: totalPages,
          category,
          query,
        })
      );
    }
  } catch (err) {
    console.error('[articles]', err);
    fetchError = 'Could not load articles right now. Please try again.';
  }

  return (
    <ArticlesPageClient
      articles={articles}
      totalCount={totalCount}
      page={page}
      pageSize={ARTICLES_LIST_PAGE_SIZE}
      category={category}
      query={query}
      categories={categories}
      fetchError={fetchError}
    />
  );
}
