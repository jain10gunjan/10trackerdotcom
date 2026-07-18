import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeArticleHtml } from '@/features/articles/lib/sanitizeArticleHtml';
import { enqueueRedditOutbox } from '@/features/articles/lib/enqueueRedditOutbox';
import { revalidateArticlesCache } from '@/features/articles/lib/revalidateArticlesCache';
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

export async function POST(request) {
  try {
    const authResult = await verifyAdminOrAutomationSecret(request);
    if (!authResult.ok) {
      return forbiddenArticlesWriteResponse(authResult.error);
    }
    const { url, category, image_url } = await request.json();
    
    // Validate required parameters
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }

    // image_url is optional, but if provided, validate it's a valid URL.
    // This is used ONLY as the featured image, not from scraped content.
    if (image_url && !image_url.match(/^https?:\/\/.+/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    // Fetch the HTML content
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(html);

    // Remove ALL images from scraped HTML so they don't appear in article content.
    // Featured image (image_url) is handled separately and still allowed.
    $("img").remove();

    // FIRST: Remove ALL paragraphs with ", " pattern from the entire document
    $("p").each((i, el) => {
      const $p = $(el);
      const text = $p.text().trim();
      const htmlContent = $p.html()?.trim() || "";
      // Remove if it contains only ", " or similar patterns
      if (text === '", "' || text === "', " || /^[,\s"']+$/.test(text) || 
          htmlContent === '", "' || htmlContent === "', " || /^[,\s"']+$/.test(htmlContent)) {
        $p.remove();
      }
    });

    // (Images already removed above; keep this section intentionally empty.)

    // Remove elements with class "size-large wp-image-28778 aligncenter"
    $('.size-large.wp-image-28778.aligncenter, .size-large.wp-image-28778, .wp-image-28778.aligncenter, [class*="size-large"][class*="wp-image-28778"][class*="aligncenter"]').remove();
    
    // Also remove by individual class parts if they appear together
    $('[class*="size-large"][class*="wp-image-28778"]').filter((i, el) => {
      const classes = $(el).attr('class') || '';
      return classes.includes('aligncenter');
    }).remove();

    /* =========================
       DESCRIPTION
       ========================= */

    let description = null;
    const shortDetails1 = $(".short_Details");

    if (shortDetails1.length) {
      description =
        shortDetails1.next("p").html()?.trim() ||
        shortDetails1.parent().find("p").eq(1).html()?.trim() ||
        null;
      
      // Remove hyperlinks from description but keep the text
      if (description) {
        // Wrap in a container div to avoid getting html/head/body tags
        const $desc = cheerio.load(`<div>${description}</div>`, null, false);
        // Replace all <a> tags with just their text content
        $desc("a").each((i, el) => {
          const $a = $desc(el);
          $a.replaceWith($a.text());
        });
        // Get only the inner HTML of the container div
        description = $desc("div").html()?.trim() || null;
      }
    }

    const shortDetails = $(".gb-headline-text").first().text().trim();

    const getContainerHTML = (cls) =>
      $(`div.gb-container.${cls}`).first().html() || null;

    const importantDatesHTML = getContainerHTML("gb-container-16a90584");
    const applicationFeeHTML = getContainerHTML("gb-container-fcbb81ff");
    const ageEligibilityHTML = getContainerHTML("gb-container-0f18d865");
    const totalPostHTML = getContainerHTML("gb-container-860b2712");

    /* =========================
       VACANCY DETAILS
       ========================= */

    const vacancyContainer = $("div.gb-container.gb-container-ec1f6e4c").first();

    const tables = {};
    vacancyContainer.find("table").each((i, tableEl) => {
      tables[`table${i + 1}`] = $.html(tableEl);
    });

    /* =========================
       CLEAN VACANCY
       ========================= */

    const vacancyClone = vacancyContainer.clone();

    // Remove ads, scripts, styles
    vacancyClone.find("script, style, iframe, ins").remove();

    // Remove any images that were inside the container
    vacancyClone.find("img").remove();

    // Remove junk tables
    vacancyClone.find("table").filter((i, el) => {
      const text = $(el).text().toLowerCase();
      return (
        text.includes("you may also check") ||
        text.includes("latest posts") ||
        text.includes("related posts") ||
        text.includes("whatsapp") ||
        text.includes("telegram") ||
        text.includes("follow now")
      );
    }).remove();

    // Remove unwanted text content
    vacancyClone.find("*").contents().each((i, el) => {
      if (el.type === "text") {
        const cleaned = el.data
          .replace(/Sarkari\s*Result\.Com\.Cm/gi, '')
          .replace(/SarkariResult\.Com\.Cm/gi, '')
          .replace(/Sarkari\s*Result/gi, '')
          // Remove social media references
          .replace(/WhatsApp\s*WhatsApp/gi, '')
          .replace(/Telegram\s*Telegram/gi, '')
          .replace(/WhatsApp/gi, '')
          .replace(/Telegram/gi, '')
          // Remove ", " and ', ' patterns - be VERY aggressive
          .replace(/",\s*\n\s*"/g, '""')
          .replace(/",\s*"/g, '""')
          .replace(/",\s+"/g, '""')
          .replace(/['"],\s*\n\s*['"]/g, "''")
          .replace(/['"],\s*['"]/g, "")
          .replace(/\n+/g, " ");
        if (!cleaned || /^[",\s\n]+$/.test(cleaned)) {
          $(el).remove();
        } else {
          el.data = cleaned;
        }
      }
    });

    // Remove empty paragraphs
    vacancyClone.find("p").each((i, el) => {
      if (!$(el).text().replace(/\s+/g, "").length) {
        $(el).remove();
      }
    });

    // Remove specific paragraph with ", " pattern - be VERY aggressive
    vacancyClone.find("p").each((i, el) => {
      const $p = $(el);
      const text = $p.text().trim();
      const htmlContent = $p.html()?.trim() || "";
      // Remove if it contains ONLY ", " or similar patterns (regardless of style)
      if (text === '", "' || text === "', " || /^[,\s"']+$/.test(text) ||
          htmlContent === '", "' || htmlContent === "', " || /^[,\s"']+$/.test(htmlContent) ||
          text.match(/^["']\s*,\s*["']\s*$/) || htmlContent.match(/^["']\s*,\s*["']\s*$/)) {
        $p.remove();
      }
    });
    
    // Also remove from all other containers
    $("div.gb-container").find("p").each((i, el) => {
      const $p = $(el);
      const text = $p.text().trim();
      const htmlContent = $p.html()?.trim() || "";
      if (text === '", "' || text === "', " || /^[,\s"']+$/.test(text) ||
          htmlContent === '", "' || htmlContent === "', " || /^[,\s"']+$/.test(htmlContent)) {
        $p.remove();
      }
    });

    // Remove text nodes between tables that contain only ", " or similar patterns
    vacancyClone.contents().each((i, el) => {
      if (el.type === "text") {
        const text = $(el).text().trim();
        // If it's just ", " or similar comma-space patterns, remove it
        if (/^[,\s"']+$/.test(text) || text === '", "' || text === "', " || /^,\s*$/.test(text)) {
          $(el).remove();
        }
      }
    });

    // Clean up text nodes between table elements more aggressively
    const allTables = vacancyClone.find("table").toArray();
    allTables.forEach((tableEl, i) => {
      if (i < allTables.length - 1) {
        // Get all siblings between this table and the next table
        let current = tableEl.nextSibling;
        const nextTable = allTables[i + 1];
        while (current && current !== nextTable) {
          if (current.type === "text") {
            const text = $(current).text().trim();
            if (/^[,\s"']+$/.test(text) || text.includes('", "') || text.includes("', ")) {
              $(current).remove();
            }
          }
          current = current.nextSibling;
        }
      }
    });

    /* =========================
       FIX TABLE HEADING WIDTH
       ========================= */

    vacancyClone.find("table").each((i, table) => {
      const firstRow = $(table).find("tr").first();
      const cells = firstRow.find("td, th");

      if (cells.length === 1) {
        const colCount =
          $(table).find("tr").eq(1).find("td, th").length;

        if (colCount > 1) {
          cells.attr("colspan", colCount);
        }
      }
    });

    const cleanedVacancyHTML = vacancyClone.html()?.trim() || null;

    /* =========================
       CLEAN STYLES AND MAKE UI-FRIENDLY
       ========================= */

    const cleanStyles = (html) => {
      if (!html) return html;
      
      // Load HTML into cheerio for better manipulation
      const $clean = cheerio.load(`<div>${html}</div>`, null, false);

      // Remove ALL images from cleaned content
      $clean("img").remove();
      
      // Remove all inline style attributes (this includes positioning that causes overlap)
      $clean('[style]').each((i, el) => {
        const $el = $clean(el);
        $el.removeAttr('style');
      });
      
      // Remove positioning classes that might cause overlap
      $clean('[class*="relative"], [class*="absolute"], [class*="fixed"], [class*="sticky"]').each((i, el) => {
        const $el = $clean(el);
        const classes = ($el.attr('class') || '').split(/\s+/).filter(c => 
          !c.includes('relative') && !c.includes('absolute') && !c.includes('fixed') && !c.includes('sticky')
        ).join(' ');
        if (classes) {
          $el.attr('class', classes);
        } else {
          $el.removeAttr('class');
        }
      });
      
      // Fix "Important Question" section - remove problematic nested structures
      $clean('*').each((i, el) => {
        const $el = $clean(el);
        const text = $el.text().toLowerCase();
        
        // If this is an "Important Question" section, clean it up
        if (text.includes('important question') || $el.find('*').text().toLowerCase().includes('important question')) {
          // Remove ALL nested divs with positioning or flex classes - unwrap them completely
          $el.find('div[class*="flex"], div[class*="relative"], div[class*="absolute"], div[class*="items-end"], div[class*="flex-col"]').each((j, nestedEl) => {
            const $nested = $clean(nestedEl);
            const content = $nested.html() || $nested.text();
            // Unwrap - keep content but remove wrapper
            if (content) {
              $nested.replaceWith(content);
            } else {
              $nested.remove();
            }
          });
          
          // Remove problematic classes and styles from list items
          $el.find('li').each((j, liEl) => {
            const $li = $clean(liEl);
            // Remove all classes that might cause positioning issues
            const classes = ($li.attr('class') || '').split(/\s+/).filter(c => 
              !c.includes('relative') && 
              !c.includes('absolute') && 
              !c.includes('flex') &&
              !c.includes('items') &&
              !c.includes('p-') &&
              !c.includes('rounded')
            ).join(' ');
            if (classes) {
              $li.attr('class', classes);
            } else {
              $li.removeAttr('class');
            }
            $li.removeAttr('style');
          });
          
          // Remove nested spans with positioning in list items
          $el.find('li span[class*="relative"], li span[class*="absolute"], li span[class*="flex"]').each((j, spanEl) => {
            const $span = $clean(spanEl);
            $span.replaceWith($span.html() || $span.text());
          });
          
          // Clean up table cells in question sections
          $el.find('td, th').each((j, cellEl) => {
            const $cell = $clean(cellEl);
            // Remove nested divs with positioning
            $cell.find('div[class*="flex"], div[class*="relative"], div[class*="absolute"]').each((k, divEl) => {
              const $div = $clean(divEl);
              $div.replaceWith($div.html() || $div.text());
            });
            // Remove problematic classes
            const cellClasses = ($cell.attr('class') || '').split(/\s+/).filter(c => 
              !c.includes('relative') && !c.includes('absolute') && !c.includes('flex')
            ).join(' ');
            if (cellClasses) {
              $cell.attr('class', cellClasses);
            } else {
              $cell.removeAttr('class');
            }
            $cell.removeAttr('style');
          });
        }
      });
      
      // Remove social button links
      $clean('.social-buttons, .social-button').remove();
      
      // Remove elements with class "size-large wp-image-28778 aligncenter"
      $clean('.size-large.wp-image-28778.aligncenter, .size-large.wp-image-28778, .wp-image-28778.aligncenter, [class*="size-large"][class*="wp-image-28778"][class*="aligncenter"]').remove();
      
      // Also remove by individual class parts if they appear together
      $clean('[class*="size-large"][class*="wp-image-28778"]').filter((i, el) => {
        const classes = $clean(el).attr('class') || '';
        return classes.includes('aligncenter');
      }).remove();
      
      // Remove gizmo-bot-avatar divs but keep their content
      $clean('.gizmo-bot-avatar').each((i, el) => {
        const $el = $clean(el);
        $el.replaceWith($el.html() || '');
      });
      
      // Remove disclaimer paragraphs
      $clean('p').each((i, el) => {
        const $el = $clean(el);
        if ($el.text().trim().startsWith('Disclaimer')) {
          $el.remove();
        }
      });
      
      // Remove unwanted wrapper divs with flex/gizmo/token classes but keep content
      $clean('div[class*="flex-shrink"], div[class*="gizmo-bot"], div[class*="token-main"]').each((i, el) => {
        const $el = $clean(el);
        $el.replaceWith($el.html() || '');
      });
      
      // Fix nested divs in lists that cause fragmentation
      $clean('li div, li span').each((i, el) => {
        const $el = $clean(el);
        const $parent = $el.parent();
        // If parent is li and this div/span has no meaningful attributes, unwrap it
        if ($parent.is('li') && !$el.attr('class') && !$el.attr('style') && !$el.attr('id')) {
          $el.replaceWith($el.html() || '');
        }
      });
      
      // Remove all positioning-related classes from all elements
      $clean('*').each((i, el) => {
        const $el = $clean(el);
        const classes = ($el.attr('class') || '').split(/\s+/).filter(c => 
          !c.includes('relative') && 
          !c.includes('absolute') && 
          !c.includes('fixed') &&
          !c.includes('sticky') &&
          !c.includes('flex-col') &&
          !c.includes('items-end') &&
          !c.includes('flex-shrink')
        ).join(' ');
        if (classes) {
          $el.attr('class', classes);
        } else {
          $el.removeAttr('class');
        }
      });
      
      // Clean up empty divs and spans
      $clean('div:empty, span:empty').remove();
      
      // Fix text nodes that might be fragmented - merge adjacent text nodes
      $clean('*').contents().each((i, node) => {
        if (node.type === 'text' && node.nextSibling && node.nextSibling.type === 'text') {
          const $parent = $clean(node.parent);
          if ($parent.length) {
            const text1 = $clean(node).text();
            const text2 = $clean(node.nextSibling).text();
            const merged = (text1 + ' ' + text2).replace(/\s+/g, ' ').trim();
            $clean(node).replaceWith(merged);
            $clean(node.nextSibling).remove();
          }
        }
      });
      
      // Get cleaned HTML
      let cleaned = $clean('div').first().html() || html;
      
      // Additional regex cleanup for any remaining style attributes
      cleaned = cleaned.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '');
      
      // Remove positioning-related attributes
      cleaned = cleaned.replace(/\s*(?:position|top|left|right|bottom|z-index)\s*:\s*[^;]+;?/gi, '');
      
      // Clean up empty attributes
      cleaned = cleaned.replace(/\s+>/g, '>');
      
      // Clean up excessive whitespace between tags but preserve structure
      cleaned = cleaned.replace(/>\s{2,}</g, '><');
      
      return cleaned.trim();
    };

    /* =========================
       CLEAN IRREGULARITIES
       ========================= */

    const cleanIrregularities = (html) => {
      if (!html) return html;
      let cleaned = html;
      
      // FIRST AND FOREMOST: Remove ", " pattern - the main issue
      // Remove ", " that appears anywhere (no newline needed) - COMPLETELY REMOVE IT
      cleaned = cleaned.replace(/",\s*"/g, '');
      cleaned = cleaned.replace(/",\s+"/g, '');
      cleaned = cleaned.replace(/['"],\s*['"]/g, '');
      // Remove ", " at end of closing tags like </span>", " or </span>",
      cleaned = cleaned.replace(/(<\/[^>]+>)\s*",\s*"/g, '$1');
      cleaned = cleaned.replace(/(<\/[^>]+>)\s*",/g, '$1');
      cleaned = cleaned.replace(/(<\/[^>]+>)\s*",\s*"([^<])/g, '$1$2');
      // Remove ", " before opening tags like ", "<h4 or ", "<div
      cleaned = cleaned.replace(/",\s*"(<[^\/])/g, '$1');
      cleaned = cleaned.replace(/",\s*(<[^\/])/g, '$1');
      // Remove ", " that appears between any content
      cleaned = cleaned.replace(/([^"])\s*",\s*"\s*([^"])/g, '$1$2');
      
      // MULTIPLE PASSES: Remove specific paragraph pattern <p style="text-align: left;">", "</p>
      // Do this multiple times to catch all variations
      for (let i = 0; i < 3; i++) {
        // Handle various quote styles and spacing variations - be VERY aggressive
        cleaned = cleaned.replace(/<p[^>]*style\s*=\s*["'][^"']*text-align[^"']*left[^"']*["'][^>]*>\s*",\s*"\s*<\/p>/gi, '');
        cleaned = cleaned.replace(/<p[^>]*style\s*=\s*["'][^"']*text-align[^"']*left[^"']*["'][^>]*>\s*',\s*'\s*<\/p>/gi, '');
        // Handle with any style attribute (even without text-align)
        cleaned = cleaned.replace(/<p[^>]*>\s*",\s*"\s*<\/p>/gi, '');
        cleaned = cleaned.replace(/<p[^>]*>\s*',\s*'\s*<\/p>/gi, '');
        // Handle with whitespace variations
        cleaned = cleaned.replace(/<p[^>]*>\s*["']\s*,\s*\s*["']\s*<\/p>/gi, '');
        // Handle paragraphs with only comma and quotes
        cleaned = cleaned.replace(/<p[^>]*>\s*[,\s"']+\s*<\/p>/gi, '');
      }
      
      // FIRST: Remove comma and space between tables - this is the main issue
      cleaned = cleaned.replace(/<\/table>,\s*<table/g, '</table><table');
      cleaned = cleaned.replace(/<\/table>,\s*<\/div>/g, '</table></div>');
      cleaned = cleaned.replace(/<\/table>,\s*<div/g, '</table><div');
      cleaned = cleaned.replace(/<\/table>,\s*<h/g, '</table><h');
      
      // Remove any text content between tables that contains ", "
      cleaned = cleaned.replace(/<\/table>([^<]*",\s*"[^<]*)<table/g, '</table><table');
      cleaned = cleaned.replace(/<\/table>([^<]*',\s*'[^<]*)<table/g, "</table><table");
      cleaned = cleaned.replace(/<\/table>\s*,\s*<table/g, '</table><table');
      
      // Remove standalone ", " patterns (quotes with comma and space)
      cleaned = cleaned.replace(/",\s*"/g, '""');
      cleaned = cleaned.replace(/',\s*'/g, "''");
      
      // Remove ", " that appears as standalone content (between any characters)
      cleaned = cleaned.replace(/([^"])\",\s*\"([^"])/g, '$1"$2');
      cleaned = cleaned.replace(/([^'])\',\s*\'([^'])/g, "$1'$2");
      
      // Remove comma and space between closing tags: </a>, </strong> -> </a></strong>
      cleaned = cleaned.replace(/<\/[^>]+>,\s*<\/[^>]+>/g, (match) => match.replace(/,\s*/, ''));
      
      // Remove comma and space after closing tag before opening tag: </a>, <strong> -> </a><strong>
      cleaned = cleaned.replace(/<\/[^>]+>,\s*<[^\/]/g, (match) => match.replace(/,\s*/, ''));
      
      // Remove comma and space before closing tag: , </strong> -> </strong>
      cleaned = cleaned.replace(/,\s*(<\/[^>]+>)/g, '$1');
      
      // Remove comma and space after closing tag followed by whitespace or end
      cleaned = cleaned.replace(/<\/[^>]+>,\s+(?=\s|$|<\/)/g, (match) => match.replace(/,\s+/, ''));
      
      // Remove comma and space before opening tag: , <strong> -> <strong>
      cleaned = cleaned.replace(/,\s*(<[^\/][^>]*>)/g, '$1');
      
      // Remove comma and space after opening tag: <strong>,  -> <strong>
      cleaned = cleaned.replace(/(<[^\/][^>]*>),\s+/g, '$1');
      
      // Remove trailing comma and space before closing tags in text
      cleaned = cleaned.replace(/,\s*<\/[^>]+>/g, '</');
      
      // Final pass: Remove any remaining ", " patterns (NO newlines - just the pattern)
      cleaned = cleaned.replace(/",\s*"/g, '');
      cleaned = cleaned.replace(/",\s+"/g, '');
      cleaned = cleaned.replace(/',\s*'/g, '');
      // Remove ", " at the very end of content
      cleaned = cleaned.replace(/",\s*"$/g, '');
      cleaned = cleaned.replace(/",\s*$/g, '');
      // Remove ", " at the very beginning
      cleaned = cleaned.replace(/^",\s*"/g, '');
      cleaned = cleaned.replace(/^",\s*$/g, '');
      
      // Remove double commas
      cleaned = cleaned.replace(/,\s*,\s*/g, ',');
      
      // FINAL AGGRESSIVE PASS: Remove ANY paragraph that might contain ", "
      // This catches everything we might have missed
      cleaned = cleaned.replace(/<p[^>]*>[\s]*["']\s*,\s*["'][\s]*<\/p>/gi, '');
      cleaned = cleaned.replace(/<p[^>]*>[\s]*[,\s"']{1,10}[\s]*<\/p>/gi, '');
      
      // Remove ", " patterns - one more aggressive pass
      cleaned = cleaned.replace(/",\s*"\s*/g, '');
      cleaned = cleaned.replace(/",\s*/g, '');
      // Remove from end of closing tags
      cleaned = cleaned.replace(/(<\/[^>]+>)\s*",\s*"$/g, '$1');
      cleaned = cleaned.replace(/(<\/[^>]+>)\s*",$/g, '$1');
      // Remove from start before opening tags  
      cleaned = cleaned.replace(/^",\s*"(<[^\/])/g, '$1');
      cleaned = cleaned.replace(/^",\s*(<[^\/])/g, '$1');
      
      // ULTIMATE FINAL PASS: Remove ", " anywhere it appears - run multiple times
      for (let i = 0; i < 5; i++) {
        cleaned = cleaned.replace(/",\s*"/g, '');
        cleaned = cleaned.replace(/",\s+"/g, '');
      }
      
      return cleaned.trim();
    };

    /* =========================
       FINAL VERSION
       ========================= */

    // First combine all HTML parts
    const combinedHTML = cleanIrregularities(
      (description || '') +
      (importantDatesHTML || '') +
      (applicationFeeHTML || '') +
      (ageEligibilityHTML || '') +
      (totalPostHTML || '') +
      (cleanedVacancyHTML || '')
    );

    // Then clean styles to make it UI-friendly (only remove inline styles, keep structure)
    let finalVersion = cleanStyles(combinedHTML);
    
    // Fallback: if cleaning removed everything, use the original combined HTML
    if (!finalVersion || finalVersion.trim().length < 50) {
      finalVersion = combinedHTML;
    }

    // Extract title from the page
    const title = $("h1").first().text().trim() || 
                  $(".gb-headline-text").first().text().trim() ||
                  shortDetails ||
                  "Scraped Article";

    // Extract excerpt/description (plain text version)
    const excerpt = description ? 
      cheerio.load(`<div>${description}</div>`)("div").text().trim().substring(0, 200) + '...' :
      (shortDetails ? shortDetails.substring(0, 200) + '...' : (title.substring(0, 200) + '...'));

    // Validate that we have content before saving
    if (!title || !finalVersion || finalVersion.trim().length < 50) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to extract sufficient content from the URL. Title or content is missing or too short.' 
        },
        { status: 400 }
      );
    }

    /* =========================
       SAVE TO DATABASE
       ========================= */

    try {
        const { data: savedArticle, error: dbError } = await getSupabaseAdmin()
        .from('articles')
        .insert({
          title,
          content: sanitizeArticleHtml(finalVersion),
          excerpt: excerpt || title.substring(0, 200) + '...',
          category,
          tags: [],
          // Only store the explicitly provided featured image, not scraped images
          featured_image_url: image_url || null,
          is_featured: false,
          social_media_embeds: [],
          author_email: 'jain10gunjan@gmail.com',
          status: 'published'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to save article to database',
            details: dbError.message 
          },
          { status: 500 }
        );
      }

      await enqueueRedditOutbox({
        articleId: savedArticle.id,
        title: savedArticle.title,
        slug: savedArticle.slug,
        featuredImageUrl: savedArticle.featured_image_url || null,
        selectedSubreddits: null,
      });
      revalidateArticlesCache({ slug: savedArticle.slug });

      return NextResponse.json({
        success: true,
        message: 'Article scraped and saved successfully',
        data: {
          id: savedArticle.id,
          title: savedArticle.title,
          slug: savedArticle.slug,
          category: savedArticle.category,
          excerpt: savedArticle.excerpt,
          featured_image_url: savedArticle.featured_image_url,
          created_at: savedArticle.created_at,
          url: `/articles/${savedArticle.slug}`
        }
      });

    } catch (dbError) {
      console.error('Error saving article:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to save article to database',
          details: dbError.message 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to scrape and save article'
      },
      { status: 500 }
    );
  }
}
