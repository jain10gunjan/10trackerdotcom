import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { getCategoryMeta } from '@/features/articles/lib/categoryMeta';
import { resolveFeaturedImageUrl } from '@/lib/resolveFeaturedImageUrl';
import {
  ARTICLES_CACHE_TAG,
  ARTICLES_REVALIDATE_SECONDS,
} from '@/features/articles/lib/revalidateArticlesCache';

export const RELATED_PAGE_SIZE = 6;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function safeRelatedPage(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function estimateReadMinutes(content = '') {
  const words = String(content).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function parseSocialEmbeds(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function fetchArticleBySlugUncached(slug) {
  const supabase = getSupabase();
  let { data: article, error } = await supabase
    .from('published_articles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (!article) return null;

  const needsEmbeds = !Object.prototype.hasOwnProperty.call(article, 'social_media_embeds');
  const needsCaption = !Object.prototype.hasOwnProperty.call(article, 'featured_image_caption');

  if (needsEmbeds || needsCaption) {
    const selectCols = [
      needsEmbeds ? 'social_media_embeds' : null,
      needsCaption ? 'featured_image_caption' : null,
    ]
      .filter(Boolean)
      .join(', ');

    const { data: direct } = await supabase
      .from('articles')
      .select(selectCols)
      .eq('id', article.id)
      .maybeSingle();

    if (needsEmbeds && direct?.social_media_embeds != null) {
      article.social_media_embeds = direct.social_media_embeds;
    }
    if (needsCaption && direct?.featured_image_caption != null) {
      article.featured_image_caption = direct.featured_image_caption;
    }
  }

  return article;
}

/** Request-level dedupe for generateMetadata + page. */
export const fetchArticleBySlug = cache(async (slug) => {
  const cached = unstable_cache(
    () => fetchArticleBySlugUncached(slug),
    ['article-by-slug', String(slug)],
    { revalidate: ARTICLES_REVALIDATE_SECONDS, tags: [ARTICLES_CACHE_TAG] }
  );
  return cached();
});

export async function fetchRelatedForArticle(article, page = 1, pageSize = RELATED_PAGE_SIZE) {
  let result = await fetchRelatedArticles({
    category: article.category,
    excludeId: article.id,
    page,
    pageSize,
  });

  if (result.totalCount === 0 && article.category) {
    result = await fetchRelatedArticles({
      category: null,
      excludeId: article.id,
      page,
      pageSize,
    });
  }

  return result;
}

export async function fetchRelatedArticles({
  category,
  excludeId,
  page = 1,
  pageSize = RELATED_PAGE_SIZE,
}) {
  const supabase = getSupabase();
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('published_articles')
    .select(
      'id, slug, title, excerpt, category, created_at, view_count, is_featured, featured_image_url',
      { count: 'estimated' }
    )
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    articles: data || [],
    totalCount: count ?? 0,
  };
}

/** @deprecated View counts are analytics-only (GA). Kept as no-op for callers. */
export async function incrementArticleViews() {
  return;
}

export function buildArticleJsonLd(article, siteUrl) {
  const fullUrl = `${siteUrl}/articles/${article.slug}`;
  const ogImage =
    resolveFeaturedImageUrl(article.featured_image_url, { absoluteBase: siteUrl }) ||
    `${siteUrl}/10tracker.png`;
  const meta = getCategoryMeta(article.category);

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description:
      article.excerpt || (article.content ? article.content.replace(/<[^>]+>/g, '').slice(0, 160) : ''),
    image: ogImage,
    url: fullUrl,
    datePublished: article.created_at,
    dateModified: article.updated_at || article.created_at,
    author: { '@type': 'Organization', name: '10Tracker' },
    publisher: {
      '@type': 'Organization',
      name: '10Tracker',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/10tracker.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': fullUrl },
    articleSection: meta.name,
    keywords: Array.isArray(article.tags) ? article.tags.join(', ') : undefined,
  };
}

export function buildArticleBreadcrumbJsonLd(article, siteUrl) {
  const meta = getCategoryMeta(article.category);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: meta.name,
        item: `${siteUrl}/articles/category/${article.category}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `${siteUrl}/articles/${article.slug}`,
      },
    ],
  };
}

export async function buildArticleMetadata(article) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com';
  const fullUrl = `${siteUrl}/articles/${article.slug}`;
  const fallbackOg = `${siteUrl}/10tracker.png`;
  const fullImage =
    resolveFeaturedImageUrl(article.featured_image_url, { absoluteBase: siteUrl }) || fallbackOg;
  const description =
    article.excerpt ||
    (article.content ? article.content.replace(/<[^>]+>/g, '').trim().slice(0, 160) : '');
  const meta = getCategoryMeta(article.category);

  return {
    title: `${article.title} | 10Tracker`,
    description,
    keywords: [
      meta.name.toLowerCase(),
      ...(Array.isArray(article.tags) ? article.tags : []),
      'exam preparation',
      '10Tracker',
    ],
    metadataBase: new URL(siteUrl),
    alternates: { canonical: fullUrl },
    openGraph: {
      type: 'article',
      locale: 'en_IN',
      url: fullUrl,
      title: article.title,
      description,
      siteName: '10Tracker',
      publishedTime: article.created_at,
      modifiedTime: article.updated_at || article.created_at,
      section: meta.name,
      tags: article.tags || [],
      images: [{ url: fullImage, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [fullImage],
    },
    robots: { index: true, follow: true },
  };
}
