import * as cheerio from "cheerio";
import axios from "axios";
import { NextResponse } from "next/server";
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

/**
 * Parses the .content-wrap div into structured sections.
 *
 * Output schema:
 * {
 *   url: string,
 *   scrapedAt: string (ISO),
 *   title: string | null,
 *   intro: string | null,         // leading <p> text before any heading
 *   sections: [
 *     {
 *       level: "h2" | "h3" | "h4",
 *       heading: string,
 *       content: string[],        // array of paragraph / list-item strings
 *       links: { text, href }[],  // all <a> tags inside this section
 *       type: "section" | "callout"  // callout when inside <blockquote>
 *     }
 *   ],
 *   importantFacts: string[] | null  // special extraction for blockquote list
 * }
 */
function parseArticle(html, url = "") {
  const $ = cheerio.load(html);

  // Remove social share box — we don't want it
  $(".gktoday-share-box").remove();

  const wrap = $(".content-wrap");
  if (!wrap.length) {
    return { error: "No .content-wrap found", url };
  }

  const result = {
    url,
    scrapedAt: new Date().toISOString(),
    title: null,
    intro: null,
    coverImage: null,
    sections: [],
    importantFacts: null,
  };

  // Try to grab page <title> or first <h1>
  result.title =
    $("h1.entry-title").first().text().trim() ||
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    null;

// ── Cover / featured image ────────────────────────────────────────────────
  // GKToday uses a standard WordPress featured image rendered as:
  //   <img class="wp-post-image" ...>  (outside .content-wrap, near the h1)
  // Fall back to the first meaningful <img> inside .content-wrap if not found.
  const coverEl =
    $("img.wp-post-image").first() ||
    $(".entry-content img, .post-thumbnail img").first() ||
    wrap.find("img").first();
 
  if (coverEl && coverEl.length) {
    // WordPress Jetpack/imgcdn URLs contain the original src in the URL itself.
    // We prefer the raw wp-content URL over the resized proxy URL.
    const rawSrc = coverEl.attr("src") || "";
    // Strip Jetpack image CDN resize params (?fit=...&ssl=1) → get original
    const cleanSrc = (() => {
      try {
        const u = new URL(rawSrc);
        // i0.wp.com/www.gktoday.in/wp-content/... → extract the real path
        if (u.hostname.endsWith(".wp.com")) {
          // pathname = /www.gktoday.in/wp-content/...
          return "https:/" + u.pathname; // reconstruct direct URL
        }
        return rawSrc;
      } catch {
        return rawSrc;
      }
    })();
 
    result.coverImage = {
      src: cleanSrc,
      srcProxy: rawSrc !== cleanSrc ? rawSrc : null, // keep proxy URL too
      srcset: coverEl.attr("srcset") || coverEl.attr("data-srcset") || null,
      alt: coverEl.attr("alt") || null,
      width: coverEl.attr("width") ? Number(coverEl.attr("width")) : null,
      height: coverEl.attr("height") ? Number(coverEl.attr("height")) : null,
    };
  }

  const HEADING_TAGS = new Set(["h2", "h3", "h4"]);

  let currentSection = null;
  let introParagraphs = [];
  let headingSeen = false;

  /**
   * Flush the current open section into result.sections.
   */
  function flushSection() {
    if (currentSection) {
      result.sections.push(currentSection);
      currentSection = null;
    }
  }

  /**
   * Collect all text content from an element,
   * removing excessive whitespace.
   */
  function getText(el) {
    return $(el).text().replace(/\s+/g, " ").trim();
  }

  /**
   * Collect all <a> links from an element.
   */
  function getLinks(el) {
    const links = [];
    $(el)
      .find("a[href]")
      .each((_, a) => {
        links.push({
          text: $(a).text().trim(),
          href: $(a).attr("href"),
        });
      });
    return links;
  }

  // Walk top-level children of .content-wrap
  wrap.children().each((_, node) => {
    const tag = node.tagName?.toLowerCase();

    if (!tag) return; // text node

    // ── Heading ──────────────────────────────────────────────────────
    if (HEADING_TAGS.has(tag)) {
      flushSection();
      headingSeen = true;
      currentSection = {
        level: tag,
        heading: getText(node),
        content: [],
        links: getLinks(node),
        type: "section",
      };
      return;
    }

    // ── Blockquote  ───────────────────────────────────────────────────
    if (tag === "blockquote") {
      flushSection();

      // Look for a heading inside the blockquote
      const bqHeading = $(node).find("h2, h3, h4").first();
      const bqHeadingText = bqHeading.length ? getText(bqHeading) : null;

      // Collect list items
      const items = [];
      $(node)
        .find("li")
        .each((_, li) => {
          items.push(getText(li));
        });

      // Collect stray paragraphs
      const paragraphs = [];
      $(node)
        .find("p")
        .each((_, p) => {
          paragraphs.push(getText(p));
        });

      const bqSection = {
        level: bqHeading.length ? bqHeading[0].tagName.toLowerCase() : null,
        heading: bqHeadingText,
        content: [...paragraphs, ...items],
        links: getLinks(node),
        type: "callout",
      };

      result.sections.push(bqSection);

      // Also surface as importantFacts if it looks like a facts list
      if (
        bqHeadingText &&
        /important|facts|exam/i.test(bqHeadingText) &&
        items.length
      ) {
        result.importantFacts = items;
      }
      return;
    }

    // ── Paragraph / other block ───────────────────────────────────────
    if (tag === "p" || tag === "ul" || tag === "ol") {
      const text =
        tag === "p"
          ? getText(node)
          : (() => {
              const lines = [];
              $(node)
                .find("li")
                .each((_, li) => lines.push(getText(li)));
              return lines.join(" | ");
            })();

      if (!text) return;

      if (!headingSeen) {
        // Before any heading → intro
        introParagraphs.push(text);
      } else if (currentSection) {
        currentSection.content.push(text);
        // Merge any additional links from this paragraph into section
        currentSection.links.push(...getLinks(node));
      }
    }
  });

  // Flush last open section
  flushSection();

  result.intro = introParagraphs.length ? introParagraphs.join("\n\n") : null;

  // De-duplicate links within each section
  for (const s of result.sections) {
    const seen = new Set();
    s.links = s.links.filter((l) => {
      const key = l.href;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return result;
}

/**
 * GET /api/gktoday?url=<article-url>
 * Scrapes and parses a GKToday article into structured JSON.
 */
export async function GET(request) {
  try {
    const authResult = await verifyAdminOrAutomationSecret(request);
    if (!authResult.ok) {
      return forbiddenArticlesWriteResponse(authResult.error);
    }
    const inputUrl = request.nextUrl.searchParams.get("url");
    const url = inputUrl?.trim() || "https://www.gktoday.in/";

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

    const parsed = parseArticle(response.data, url);
    if (parsed?.error) {
      return NextResponse.json(
        { success: false, error: parsed.error, url },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch/parse article",
      },
      { status: 500 }
    );
  }
}