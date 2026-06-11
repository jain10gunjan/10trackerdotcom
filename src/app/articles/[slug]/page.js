import Link from 'next/link';
import { redirect } from 'next/navigation';
import ArticleDetailContent from '@/components/articles/ArticleDetailContent';
import {
  buildArticleBreadcrumbJsonLd,
  buildArticleJsonLd,
  buildArticleMetadata,
  fetchArticleBySlug,
  fetchRelatedForArticle,
  incrementArticleViews,
  parseSocialEmbeds,
  RELATED_PAGE_SIZE,
  safeRelatedPage,
} from '@/lib/articles/fetchArticle';
import { isArticleCategorySlug } from '@/lib/articles/fetchCategoryArticles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function NotFoundView() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center pt-20">
      <div className="text-center px-4">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Article not found</h1>
        <p className="text-neutral-600 mb-6">The article you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors text-sm font-semibold"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

function ErrorView() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center pt-20">
      <div className="text-center px-4">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Error loading article</h1>
        <p className="text-neutral-600 mb-6">Please try again in a moment.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors text-sm font-semibold"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const article = await fetchArticleBySlug(slug);
    if (!article) {
      return {
        title: 'Article Not Found | 10Tracker',
        description: 'The article you are looking for could not be found.',
        robots: { index: false, follow: false },
      };
    }
    return buildArticleMetadata(article);
  } catch (error) {
    console.error('[article metadata]', slug, error);
    return {
      title: 'Article Not Found | 10Tracker',
      description: 'The article you are looking for could not be found.',
    };
  }
}

export default async function ArticlePage({ params, searchParams }) {
  const { slug } = await params;
  const resolved = await searchParams;
  const relatedPage = safeRelatedPage(resolved?.relatedPage);

  try {
    const article = await fetchArticleBySlug(slug);
    if (!article) {
      if (await isArticleCategorySlug(slug)) {
        redirect(`/articles/category/${slug}`);
      }
      return <NotFoundView />;
    }

    const { articles: relatedArticles, totalCount } = await fetchRelatedForArticle(
      article,
      relatedPage,
      RELATED_PAGE_SIZE
    );

    const totalRelatedPages = Math.max(1, Math.ceil(totalCount / RELATED_PAGE_SIZE));

    if (relatedPage > totalRelatedPages && totalCount > 0) {
      redirect(
        totalRelatedPages <= 1
          ? `/articles/${slug}`
          : `/articles/${slug}?relatedPage=${totalRelatedPages}`
      );
    }

    incrementArticleViews(article.id, article.view_count).catch(() => {});

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com';
    const jsonLd = buildArticleJsonLd(article, siteUrl);
    const breadcrumbJsonLd = buildArticleBreadcrumbJsonLd(article, siteUrl);
    const socialEmbeds = parseSocialEmbeds(article.social_media_embeds);

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <ArticleDetailContent
          article={article}
          relatedArticles={relatedArticles}
          relatedPage={relatedPage}
          totalRelatedPages={totalRelatedPages}
          totalRelatedCount={totalCount}
          socialEmbeds={socialEmbeds}
        />
      </>
    );
  } catch (error) {
    console.error('[article page]', slug, error);
    return <ErrorView />;
  }
}
