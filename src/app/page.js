// import Cattracker from "@/components/Cattracker";
import HomePageRouter from "@/components/HomePageRouter";
import { createClient } from "@supabase/supabase-js";
// import ReactPlayerComponent from "@/components/ReactPlayer";
// import Image from "next/image";

export const metadata = {
  title: '10tracker - Latest Updates in 10 Points',
  description: 'Get the latest news, insights, and updates summarized into 10 clear and easy-to-read points. Stay informed quickly and efficiently with 10tracker.',
  keywords: [
    'exam preparation',
    'CAT exam',
    'GATE exam', 
    'UPSC preparation',
    'JEE preparation',
    'NEET preparation',
    'competitive exams',
    'mock tests',
    'MCQ practice',
    'study materials'
  ],
  openGraph: {
    title: '10tracker - Latest Updates in 10 Points',
    description: 'Get the latest news, insights, and updates summarized into 10 clear and easy-to-read points. Stay informed quickly and efficiently with 10tracker.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '10tracker - Latest Updates in 10 Points',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '10tracker - Latest Updates in 10 Points',
    description: 'Get the latest news, insights, and updates summarized into 10 clear and easy-to-read points. Stay informed quickly and efficiently with 10tracker.',
    images: ['/og-image.jpg'],
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HOMEPAGE_NEWS_CATEGORIES = [
  "current-affairs",
  "board-exams",
  "sarkari-exams",
  "admissions",
  "general",
  "college-news",
  "entrance-exams",
];

function titleFromSlug(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatShortDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default async function Home() {
  let categorySections = [];

  try {
    const { data: categories } = await supabase
      .from("article_categories")
      .select("name, slug, color")
      .in("slug", HOMEPAGE_NEWS_CATEGORIES);

    const categoriesBySlug = new Map(
      (categories || [])
        .filter((c) => c?.slug)
        .map((c) => [c.slug, c])
    );
    const slugs = HOMEPAGE_NEWS_CATEGORIES;
    const byCategory = new Map(slugs.map((slug) => [slug, []]));

    // Fetch enough rows to fill up to 4 per category without N+1 queries.
    // This keeps it fast while ensuring "quiet" categories still get results.
    const desired = Math.max(1, slugs.length) * 4;
    const fetchLimit = Math.min(2000, Math.max(200, desired * 6));

    const { data: articles } = await supabase
      .from("published_articles")
      .select(
        "id, slug, title, excerpt, category, created_at, view_count, is_featured, featured_image_url"
      )
      .in("category", slugs)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(fetchLimit);

    for (const a of articles || []) {
      const cat = a?.category;
      if (!cat) continue;
      if (!byCategory.has(cat)) continue;
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
        featuredImageUrl: a.featured_image_url || "",
      });
    }

    categorySections = HOMEPAGE_NEWS_CATEGORIES.map((slug) => {
      const cat = categoriesBySlug.get(slug);
      return {
        slug,
        name: cat?.name || titleFromSlug(slug),
        color: cat?.color || "#3B82F6",
        items: byCategory.get(slug) || [],
      };
    });
  } catch {
    // home still renders without news section
  }

  return <HomePageRouter categorySections={categorySections} />;
}
