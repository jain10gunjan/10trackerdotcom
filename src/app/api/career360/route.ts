import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import axios from "axios";
import {
  verifyAdminOrAutomationSecret,
  forbiddenArticlesWriteResponse,
} from "@/features/articles/lib/verifyArticlesWriteAuth";
import { assertAllowedFetchUrl } from "@/lib/safeFetchUrl";

// ─── Known categories (slug → display label) ─────────────────────────────────
// These slugs appear inside breadcrumb hrefs on careers360 pages.
const CATEGORY_MAP: Record<string, string> = {
  "college-university":         "Colleges",
  "on-campus":                  "On Campus",
  "awards-and-accreditations":  "Awards & Accreditations",
  "courses-and-fees":           "Courses and Fees",
  "admission":                  "Admission",
  "placement":                  "Placement News",
  "research-and-innovation":    "Research and Innovation",
  "exam-news":                  "Exams",
  "exams":                      "Exams",
  "college-entrance-exams":     "College Entrance Exams",
  "competitive-exams":          "Competitive Exams",
  "school":                     "Schools",
  "boards":                     "School Boards",
  "results":                    "School Results",
  "admissions":                 "School Admissions",
  "scholarship":                "Scholarship",
  "workplace":                  "The Workplace",
  "upskilling":                 "Upskilling",
  "job-trends":                 "Job Trends",
  "internship-and-apprenticeship": "Internship & Apprenticeship",
  "placements":                 "Placements",
  "opinion":                    "Opinion",
  "study-abroad":               "Study Abroad",
  "policies":                   "Policies",
  "latest":                     "Latest News",
  "featured-news":              "Featured News",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isValidCareers360Url(url: string): boolean {
  const check = assertAllowedFetchUrl(url, [
    "news.careers360.com",
    "careers360.com",
  ]);
  return check.ok;
}

/**
 * Extract category slug + display name by reading the breadcrumb links
 * that careers360 renders in the page HTML.
 * The breadcrumb hrefs look like:
 *   https://news.careers360.com/college-university
 *   https://news.careers360.com/college-university/on-campus
 * We walk them in reverse (most-specific first) and return the first
 * slug we recognise.
 */
function detectCategoryFromHtml(
  $: cheerio.CheerioAPI
): { slug: string; display: string; breadcrumbs: string[] } | null {
  // ── 1. Breadcrumb <a> links ───────────────────────────────────────────────
  const breadcrumbTexts: string[] = [];

  // careers360 uses an ordered list for breadcrumbs
  $("ol li a, nav a, .breadcrumb a, [aria-label*='breadcrumb'] a").each(
    (_, el) => {
      const text = $(el).text().trim();
      if (text && text.toLowerCase() !== "home") breadcrumbTexts.push(text);
    }
  );

  // Collect hrefs from breadcrumb anchors
  const breadcrumbHrefs: string[] = [];
  $("ol li a, nav a, .breadcrumb a, [aria-label*='breadcrumb'] a").each(
    (_, el) => {
      const href = $(el).attr("href") || "";
      if (href && !href.endsWith("/") && href.includes("careers360.com")) {
        breadcrumbHrefs.push(href);
      }
    }
  );

  // Walk hrefs in reverse (deepest path first) and match known slugs
  for (const href of [...breadcrumbHrefs].reverse()) {
    try {
      const { pathname } = new URL(href);
      const segments = pathname.split("/").filter(Boolean);
      // Check from deepest segment to shallowest
      for (const seg of [...segments].reverse()) {
        if (CATEGORY_MAP[seg]) {
          return {
            slug: seg,
            display: CATEGORY_MAP[seg],
            breadcrumbs: breadcrumbTexts,
          };
        }
      }
    } catch {
      // ignore malformed hrefs
    }
  }

  // ── 2. Fallback: meta article:section ────────────────────────────────────
  const metaSection =
    $('meta[property="article:section"]').attr("content") ||
    $('meta[name="category"]').attr("content") ||
    "";
  if (metaSection) {
    const slug = metaSection.toLowerCase().replace(/\s+/g, "-");
    if (CATEGORY_MAP[slug]) {
      return { slug, display: CATEGORY_MAP[slug], breadcrumbs: breadcrumbTexts };
    }
    // Try display-name match
    const match = Object.entries(CATEGORY_MAP).find(
      ([, v]) => v.toLowerCase() === metaSection.toLowerCase()
    );
    if (match) {
      return { slug: match[0], display: match[1], breadcrumbs: breadcrumbTexts };
    }
    // Return it even if not in our map – caller will decide
    return { slug, display: metaSection, breadcrumbs: breadcrumbTexts };
  }

  // ── 3. Fallback: JSON-LD articleSection ──────────────────────────────────
  let jsonLdSection = "";
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "{}");
      const arr = Array.isArray(json) ? json : [json];
      for (const item of arr) {
        if (item?.articleSection) {
          jsonLdSection = Array.isArray(item.articleSection)
            ? item.articleSection[0]
            : item.articleSection;
        }
      }
    } catch { /* ignore */ }
  });
  if (jsonLdSection) {
    const slug = jsonLdSection.toLowerCase().replace(/\s+/g, "-");
    const display = CATEGORY_MAP[slug] ?? jsonLdSection;
    return { slug, display, breadcrumbs: breadcrumbTexts };
  }

  return null;
}

// ─── Full scrape ─────────────────────────────────────────────────────────────
async function fetchAndParse(url: string) {
  const { data: html } = await axios.get<string>(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    timeout: 20000,
  });
  return cheerio.load(html);
}

function scrapeArticle(
  $: cheerio.CheerioAPI,
  url: string,
  categoryInfo: { slug: string; display: string; breadcrumbs: string[] }
) {
  // Remove noise
  $(
    "script, style, nav, header, footer, aside, .ad, .advertisement, " +
    ".related-news, .also-read, .subscribe, .newsletter"
  ).remove();

  // Title
  const title =
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    "";

  // Authors
  const authors: string[] = [];
  $(".author-name, .byline, [rel='author'], .post-author").each((_, el) => {
    const name = $(el).text().replace(/^by\s*/i, "").trim();
    if (name && !authors.includes(name)) authors.push(name);
  });
  if (!authors.length) {
    const am =
      $('meta[name="author"]').attr("content") ||
      $('meta[property="article:author"]').attr("content") ||
      "";
    if (am) authors.push(am);
  }

  // Dates
  const publishedAt =
    $('meta[property="article:published_time"]').attr("content") ||
    $("time[datetime]").first().attr("datetime") ||
    $('meta[name="publish-date"]').attr("content") ||
    null;

  const updatedAt =
    $('meta[property="article:modified_time"]').attr("content") ||
    $('time[itemprop="dateModified"]').attr("datetime") ||
    null;

  // Description
  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";

  // Featured image
  const featuredImage =
    $('meta[property="og:image"]').attr("content") ||
    $("article img").first().attr("src") ||
    null;

  // Tags / keywords
  const tags: string[] = [];
  const kw = $('meta[name="keywords"]').attr("content") || "";
  if (kw) tags.push(...kw.split(",").map((t) => t.trim()).filter(Boolean));
  $(".tags a, .article-tags a, .tag-list a").each((_, el) => {
    const t = $(el).text().trim();
    if (t && !tags.includes(t)) tags.push(t);
  });

  // Body text
  let bodyText = "";
  const bodySelectors = [
    ".article-content",
    ".story-content",
    ".post-content",
    ".entry-content",
    '[itemprop="articleBody"]',
    ".article-body",
    "article",
    "main",
  ];
  for (const sel of bodySelectors) {
    const el = $(sel).first();
    if (el.length) {
      const text = el
        .find("p")
        .map((_, p) => $(p).text().trim())
        .get()
        .filter((t) => t.length > 30)
        .join("\n\n");
      if (text.length > 200) { bodyText = text; break; }
    }
  }
  if (!bodyText) {
    bodyText = $("p")
      .map((_, p) => $(p).text().trim())
      .get()
      .filter((t) => t.length > 40)
      .join("\n\n");
  }

  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  return {
    status: "success" as const,
    url,
    category: categoryInfo,
    article: {
      title,
      description,
      authors: authors.length ? authors : null,
      publishedAt,
      updatedAt,
      featuredImage,
      tags,
      readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
      wordCount,
      body: bodyText,
    },
    scrapedAt: new Date().toISOString(),
  };
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await verifyAdminOrAutomationSecret(request);
  if (!auth.ok) {
    return forbiddenArticlesWriteResponse(auth.error);
  }

  const { searchParams } = new URL(request.url);
  const rawUrl   = searchParams.get("url") || searchParams.get("link") || "";
  // Optional: restrict to specific categories via ?category=on-campus,colleges
  const allowedParam = searchParams.get("category") || "";

  // ── 1. URL present? ───────────────────────────────────────────────────────
  if (!rawUrl) {
    return NextResponse.json(
      {
        status: "error",
        code: "MISSING_URL",
        message: "Provide a URL via ?url= query parameter.",
        example: "/api/career360?url=https://news.careers360.com/some-article",
      },
      { status: 400 }
    );
  }

  // ── 2. Domain check ───────────────────────────────────────────────────────
  if (!isValidCareers360Url(rawUrl)) {
    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_DOMAIN",
        message: "Only news.careers360.com URLs are supported.",
        providedUrl: rawUrl,
      },
      { status: 422 }
    );
  }

  // ── 3. Fetch the page ─────────────────────────────────────────────────────
  let $: cheerio.CheerioAPI;
  try {
    $ = await fetchAndParse(rawUrl);
  } catch (err: unknown) {
    console.error("career360 fetch failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        status: "error",
        code: "FETCH_FAILED",
        message: "Could not fetch the URL",
        providedUrl: rawUrl,
      },
      { status: 502 }
    );
  }

  // ── 4. Detect category FROM the page HTML ─────────────────────────────────
  const categoryInfo = detectCategoryFromHtml($);

  if (!categoryInfo) {
    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_CATEGORY",
        message:
          "Could not determine a recognised category from this page. " +
          "It may not be a standard article page.",
        providedUrl: rawUrl,
        supportedCategories: CATEGORY_MAP,
      },
      { status: 422 }
    );
  }

  // ── 5. Optional caller-specified category filter ──────────────────────────
  if (allowedParam) {
    const allowed = allowedParam
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const slugMatch    = allowed.includes(categoryInfo.slug);
    const displayMatch = allowed.includes(categoryInfo.display.toLowerCase());

    if (!slugMatch && !displayMatch) {
      return NextResponse.json(
        {
          status: "error",
          code: "CATEGORY_NOT_ALLOWED",
          message: `Article belongs to "${categoryInfo.display}" (slug: ${categoryInfo.slug}), which is not in your requested filter.`,
          detectedCategory: categoryInfo,
          requestedCategories: allowed,
        },
        { status: 422 }
      );
    }
  }

  // ── 6. Scrape and return ──────────────────────────────────────────────────
  try {
    const result = scrapeArticle($, rawUrl, categoryInfo);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: "error",
        code: "PARSE_FAILED",
        message: `Failed to parse article content: ${err instanceof Error ? err.message : err}`,
        providedUrl: rawUrl,
      },
      { status: 500 }
    );
  }
}