import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import ArticleListCard from '@/features/articles/components/ArticleListCard';
import ArticleCategoryPagination from '@/features/articles/components/ArticleCategoryFeed';

const PAGE_SIZE = 20;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function safePage(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function titleFromSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default async function ArticlesByCategoryView({
  category,
  searchParams,
  basePath,
}) {
  const resolvedSearch = await searchParams;
  const page = safePage(resolvedSearch?.page);
  const offset = (page - 1) * PAGE_SIZE;
  const listBase = basePath || `/articles/category/${category}`;

  let categoryRow = null;
  let articles = [];
  let totalCount = 0;

  try {
    const { data: c } = await supabase
      .from('article_categories')
      .select('name, slug, color')
      .eq('slug', category)
      .maybeSingle();
    categoryRow = c || null;
  } catch {
    // ignore
  }

  try {
    const { data, count } = await supabase
      .from('published_articles')
      .select(
        'id, slug, title, excerpt, category, created_at, view_count, is_featured, featured_image_url',
        { count: 'exact' }
      )
      .eq('category', category)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    articles = data || [];
    totalCount = count || 0;
  } catch {
    // ignore
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const displayName = categoryRow?.name || titleFromSlug(category);
  const color = categoryRow?.color || '#2563eb';

  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      {/* Category hero */}
      <div
        className="border-b border-neutral-200/80 bg-white"
        style={{
          background: `linear-gradient(135deg, ${color}08 0%, white 45%, white 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            All articles
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3"
                style={{ backgroundColor: `${color}18`, color }}
              >
                Category
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
                {displayName}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-neutral-600">
                {totalCount} {totalCount === 1 ? 'article' : 'articles'}
                {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {articles.map((article) => (
                <ArticleListCard key={article.id} article={article} accentColor={color} />
              ))}
            </div>

            <ArticleCategoryPagination
              basePath={listBase}
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
            />
          </>
        ) : (
          <div className="text-center py-16 sm:py-20 rounded-2xl bg-white ring-1 ring-neutral-200/80">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">No articles yet</h2>
            <p className="text-neutral-600 mb-6 max-w-sm mx-auto text-sm">
              This category doesn&apos;t have published articles. Check back soon.
            </p>
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Browse all articles
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
