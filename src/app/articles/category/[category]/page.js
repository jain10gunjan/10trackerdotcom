import { createClient } from '@supabase/supabase-js';
import ArticlesByCategoryView from '@/components/articles/ArticlesByCategoryView';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function titleFromSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function generateMetadata({ params, searchParams }) {
  const { category } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com';

  let categoryName = titleFromSlug(category);
  let description = `Browse articles in ${categoryName}.`;

  try {
    const { data } = await supabase
      .from('article_categories')
      .select('name, slug')
      .eq('slug', category)
      .maybeSingle();
    if (data?.name) {
      categoryName = data.name;
      description = `Browse the latest ${data.name} articles on 10tracker.`;
    }
  } catch {
    // ignore
  }

  const resolved = await searchParams;
  const page = Number(resolved?.page) > 1 ? Number(resolved.page) : 1;
  const title =
    page > 1
      ? `${categoryName} — Page ${page} | 10tracker`
      : `${categoryName} Articles | 10tracker`;
  const canonical =
    page > 1
      ? `${siteUrl}/articles/category/${category}?page=${page}`
      : `${siteUrl}/articles/category/${category}`;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
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

export default async function ArticlesByCategoryPage({ params, searchParams }) {
  const { category } = await params;

  return (
    <ArticlesByCategoryView
      category={category}
      searchParams={searchParams}
      basePath={`/articles/category/${category}`}
    />
  );
}
