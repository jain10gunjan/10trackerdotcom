import { createClient } from '@supabase/supabase-js';
import { fetchExamCatalog } from '@/features/exams/lib/fetchExamCatalog';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Sitemap will only include static pages.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/** Apex host matches live www→apex redirects measured on production. */
function sitemapBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com';
  try {
    const url = new URL(raw);
    if (url.hostname === 'www.10tracker.com') {
      url.hostname = '10tracker.com';
    }
    return url.origin.replace(/\/$/, '');
  } catch {
    return 'https://10tracker.com';
  }
}

function urlEntry(loc, lastModified) {
  const lastmod = (lastModified instanceof Date ? lastModified : new Date(lastModified)).toISOString();
  return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
}

export async function GET() {
  const baseUrl = sitemapBaseUrl();
  const timestamp = new Date();

  const staticPaths = [
    '/',
    '/exams',
    '/pricing',
    '/articles',
    '/about-us',
    '/contact-us',
    '/privacy-policy',
    '/terms-and-services',
    '/disclaimer',
  ];

  if (SHOW_OG_TRACKERS) {
    staticPaths.push('/og-trackers');
  }

  const staticEntries = staticPaths.map((path) =>
    urlEntry(`${baseUrl}${path === '/' ? '' : path}`, timestamp)
  );

  let examEntries = [];
  try {
    const exams = await fetchExamCatalog({ activeOnly: true });
    examEntries = exams.flatMap((exam) => {
      const slug = String(exam.slug || '').trim();
      if (!slug) return [];
      return [
        urlEntry(`${baseUrl}/${slug}`, timestamp),
        urlEntry(`${baseUrl}/mock-test/${slug}`, timestamp),
      ];
    });
  } catch (error) {
    console.error('Error fetching exams for sitemap:', error);
  }

  let articleEntries = [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('published_articles')
        .select('slug, updated_at, created_at')
        .order('created_at', { ascending: false });

      if (!error && data) {
        articleEntries = data
          .map((article) => {
            const slug = String(article.slug || '').trim();
            if (!slug) return null;
            return urlEntry(
              `${baseUrl}/articles/${slug}`,
              article.updated_at || article.created_at || timestamp
            );
          })
          .filter(Boolean);
      } else if (error) {
        console.error('Error fetching published articles for sitemap:', error);
      }
    } catch (error) {
      console.error('Error fetching articles for sitemap:', error);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated at ${timestamp.toISOString()} -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...examEntries, ...articleEntries].join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'Last-Modified': timestamp.toUTCString(),
    },
  });
}
