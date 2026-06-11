import { createClient } from '@supabase/supabase-js';
import { resolveFeaturedImageUrl } from '@/lib/resolveFeaturedImageUrl';

export const GUEST_HOME_NEWS_CATEGORIES = [
  'current-affairs',
  'board-exams',
  'sarkari-exams',
  'admissions',
  'general',
  'college-news',
  'entrance-exams',
];

function titleFromSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatShortDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export async function fetchGuestHomeArticles() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    const { data: categories } = await supabase
      .from('article_categories')
      .select('name, slug, color')
      .in('slug', GUEST_HOME_NEWS_CATEGORIES);

    const categoriesBySlug = new Map(
      (categories || [])
        .filter((c) => c?.slug)
        .map((c) => [c.slug, c])
    );
    const slugs = GUEST_HOME_NEWS_CATEGORIES;
    const byCategory = new Map(slugs.map((slug) => [slug, []]));

    const desired = Math.max(1, slugs.length) * 4;
    const fetchLimit = Math.min(2000, Math.max(200, desired * 6));

    const { data: articles } = await supabase
      .from('published_articles')
      .select(
        'id, slug, title, excerpt, category, created_at, view_count, is_featured, featured_image_url'
      )
      .in('category', slugs)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(fetchLimit);

    for (const a of articles || []) {
      const cat = a?.category;
      if (!cat || !byCategory.has(cat)) continue;
      if (byCategory.get(cat).length >= 4) continue;
      byCategory.get(cat).push({
        id: a.id,
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        category: cat,
        createdAt: a.created_at,
        dateLabel: formatShortDate(a.created_at),
        viewCount: a.view_count || 0,
        isFeatured: !!a.is_featured,
        featuredImageUrl: resolveFeaturedImageUrl(a.featured_image_url) || '',
      });
    }

    return GUEST_HOME_NEWS_CATEGORIES.map((slug) => {
      const cat = categoriesBySlug.get(slug);
      return {
        slug,
        name: cat?.name || titleFromSlug(slug),
        color: cat?.color || '#3B82F6',
        items: byCategory.get(slug) || [],
      };
    });
  } catch (err) {
    console.error('fetchGuestHomeArticles', err);
    return GUEST_HOME_NEWS_CATEGORIES.map((slug) => ({
      slug,
      name: titleFromSlug(slug),
      color: '#3B82F6',
      items: [],
    }));
  }
}
