import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Sitemap will only include static pages.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET() {
  const baseUrl = 'https://www.10tracker.com';
  const timestamp = new Date().toISOString();

  const staticPages = [
    {
      url: '/articles',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  let articles = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('published_articles')
        .select('slug, updated_at, created_at')
        .order('created_at', { ascending: false });

      if (!error && data) {
        articles = data.map((article) => ({
          url: `/articles/${article.slug}`,
          lastModified: new Date(article.updated_at || article.created_at),
          changeFrequency: 'weekly',
          priority: 0.6,
        }));
      } else if (error) {
        console.error('Error fetching published articles for sitemap:', error);
      }
    } catch (error) {
      console.error('Error fetching articles for sitemap:', error);
      articles = [];
    }
  }

  const allPages = [...staticPages, ...articles];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated at ${timestamp} -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastModified.toISOString()}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'Last-Modified': new Date().toUTCString(),
    },
  });
}
