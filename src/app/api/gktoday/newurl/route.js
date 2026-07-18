import * as cheerio from "cheerio";
import axios from "axios";
import { NextResponse } from "next/server";
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

/**
 * Parses the GKToday listing page (/current-affairs/ or any paginated variant)
 * and returns an array of article cards, skipping quiz posts.
 *
 * Output schema:
 * {
 *   url: string,              // listing page URL scraped
 *   scrapedAt: string,        // ISO timestamp
 *   page: number,             // current page number (from URL or default 1)
 *   nextPageUrl: string|null, // URL of the next page if pagination exists
 *   totalArticles: number,    // count of articles returned
 *   articles: [
 *     {
 *       title: string,
 *       url: string,
 *       date: string | null,      // "March 27, 2026"
 *       snippet: string | null,   // truncated preview text
 *       thumbnail: {
 *         src: string,            // clean wp-content URL
 *         srcProxy: string|null,  // original Jetpack CDN URL
 *         srcset: string|null,
 *         alt: string|null,
 *         width: number|null,
 *         height: number|null
 *       } | null
 *     }
 *   ]
 * }
 */
function parseListingPage(html, pageUrl = "") {
  const $ = cheerio.load(html);

  // ── Pagination ────────────────────────────────────────────────────────────
  const nextPageUrl =
    $("a.next.page-numbers").attr("href") ||
    $(".pagination a[rel='next']").attr("href") ||
    $("a:contains('Older Posts')").attr("href") ||
    null;

  // Detect current page number from URL (/page/2/ etc.)
  const pageMatch = pageUrl.match(/\/page\/(\d+)/);
  const page = pageMatch ? parseInt(pageMatch[1], 10) : 1;

  // ── Article cards ─────────────────────────────────────────────────────────
  const articles = [];

  $(".home-post-item").each((_, card) => {
    const $card = $(card);

    // Title and URL
    const $anchor = $card.find("h3 a, h2 a").first();
    const title = $anchor.text().replace(/\s+/g, " ").trim();
    const articleUrl = $anchor.attr("href") || "";

    // Skip quiz posts — they match /daily-current-affairs-quiz-
    if (/daily-current-affairs-quiz/i.test(articleUrl)) return;
    // Skip empty cards
    if (!title || !articleUrl) return;

    // Date
    const dateText =
      $card.find(".home-post-data-meta").text().replace(/\s+/g, " ").trim() ||
      null;

    // Snippet — the raw text node after the h3, before the meta paragraph
    // GKToday renders it as a direct text node / mixed content inside .post-data
    let snippet = null;
    const $postData = $card.find(".post-data");
    if ($postData.length) {
      // Clone and remove h3 + meta so only snippet text remains
      const $clone = $postData.clone();
      $clone.find("h3, h2, .home-post-data-meta, p.home-post-data-meta").remove();
      snippet = $clone.text().replace(/\s+/g, " ").trim() || null;
    }

    // Thumbnail image
    let thumbnail = null;
    const $img = $card.find("img.wp-post-image, .featured-image img").first();
    if ($img.length) {
      const rawSrc = $img.attr("src") || "";
      const cleanSrc = (() => {
        try {
          const u = new URL(rawSrc);
          if (u.hostname.endsWith(".wp.com")) return "https:/" + u.pathname;
          return rawSrc;
        } catch {
          return rawSrc;
        }
      })();
      thumbnail = {
        src: cleanSrc,
        srcProxy: rawSrc !== cleanSrc ? rawSrc : null,
        srcset: $img.attr("srcset") || $img.attr("data-srcset") || null,
        alt: $img.attr("alt") || null,
        width: $img.attr("width") ? Number($img.attr("width")) : null,
        height: $img.attr("height") ? Number($img.attr("height")) : null,
      };
    }

    articles.push({ title, url: articleUrl, slug: articleUrl.replace(/\/+$/, '').split('/').pop(), date: dateText, snippet, thumbnail });
  });

  return {
    url: pageUrl,
    scrapedAt: new Date().toISOString(),
    page,
    nextPageUrl,
    totalArticles: articles.length,
    articles,
  };
}

/**
 * GET /api/gktoday/newurl?url=<listing-url>
 * Scrapes and parses a GKToday listing page into structured JSON.
 */
export async function GET(request) {
  try {
    const authResult = await verifyAdminOrAutomationSecret(request);
    if (!authResult.ok) {
      return forbiddenArticlesWriteResponse(authResult.error);
    }
    const inputUrl = request.nextUrl.searchParams.get("url");
    const url = inputUrl?.trim() || "https://www.gktoday.in/current-affairs/";

    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { success: false, error: "Invalid url. Use a full http/https URL." },
        { status: 400 }
      );
    }

    const response = await axios.get(url, {
      timeout: 20000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const parsed = parseListingPage(response.data, url);

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch/parse listing page",
      },
      { status: 500 }
    );
  }
}