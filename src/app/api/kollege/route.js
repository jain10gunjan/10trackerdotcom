// app/api/kollege/route.js
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import {
  verifyAdminOrAutomationSecret,
  forbiddenArticlesWriteResponse,
} from '@/features/articles/lib/verifyArticlesWriteAuth';
import { assertAllowedFetchUrl } from '@/lib/safeFetchUrl';

const KOLLEGE_ALLOWED_HOSTS = ['news.kollegeapply.com', 'kollegeapply.com'];

export async function GET(request) {
  const auth = await verifyAdminOrAutomationSecret(request);
  if (!auth.ok) {
    return forbiddenArticlesWriteResponse(auth.error);
  }

  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing "url" query parameter. Example: /api/kollege?url=https://news.kollegeapply.com/...' },
      { status: 400 }
    );
  }

  const allowed = assertAllowedFetchUrl(url, KOLLEGE_ALLOWED_HOSTS);
  if (!allowed.ok) {
    return NextResponse.json({ error: allowed.error }, { status: 400 });
  }

  try {
    const response = await fetch(allowed.url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KollegeApplyNewsScraper/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Title (from main image alt or fallback)
    let title =
      $('img[alt*="UP Board"]').first().attr('alt')?.trim() ||
      $('h1').first().text().trim() ||
      'No title found';
    title = title.replace(/\s+/g, ' ');

    // Updated date & author
    const updateP = $('.pt-2.mb-2.text-sm').first();
    const updatedDate = updateP.find('strong').text().trim().replace(/,\s*$/, '') || '';
    const author = updateP.find('a').text().trim() || '';

    // Summary (the bold italic paragraph at the top)
    const summary = $('.mt-4.font-bold.italic.article-content-body')
      .first()
      .text()
      .trim()
      .replace(/\s+/g, ' ');

    // Main image
    let mainImage =
      $('div.bg-white.my-4.overflow-hidden.rounded-t-xl img').first().attr('src') ||
      $('img[data-nimg="1"]').first().attr('src') ||
      '';
    if (mainImage && !mainImage.startsWith('http')) {
      mainImage = `https://news.kollegeapply.com${mainImage}`;
    }

    // Main article content
    const contentSection = $('section.article-content-body').first();

    const sections = [];

    let currentHeading = '';
    let currentParagraphs = [];
    let currentList = null;
    let introductionParagraphs = [];
    let hasStartedHeadings = false;

    if (contentSection.length) {
      contentSection.children().each((_, el) => {
        const $el = $(el);
        const tagName = $el.prop('tagName');
        if (!tagName) return;
        const tag = tagName.toLowerCase();

        if (tag === 'h2') {
          hasStartedHeadings = true;

          // Save previous section
          if (currentHeading) {
            sections.push({
              heading: currentHeading,
              paragraphs: [...currentParagraphs],
              ...(currentList && { list: [...currentList] }),
            });
          }

          currentHeading = $el.text().trim().replace(/\s+/g, ' ');
          currentParagraphs = [];
          currentList = null;
        } else if (tag === 'p') {
          let pText = $el.text().trim();
          if (
            pText &&
            pText !== '&nbsp;' &&
            pText.length > 10 &&
            !pText.toLowerCase().includes('join kollegeapply') &&
            !pText.toLowerCase().includes('telegram')
          ) {
            pText = pText.replace(/\s+/g, ' ');
            if (!hasStartedHeadings) {
              introductionParagraphs.push(pText);
            } else {
              currentParagraphs.push(pText);
            }
          }
        } else if (tag === 'ul') {
          const items = [];
          $el.find('li').each((_, li) => {
            const itemText = $(li).text().trim();
            if (itemText) items.push(itemText.replace(/\s+/g, ' '));
          });
          if (items.length) currentList = items;
        }
        // Ignore tables, ads, divs, etc.
      });

      // Save the final section
      if (currentHeading) {
        sections.push({
          heading: currentHeading,
          paragraphs: [...currentParagraphs],
          ...(currentList && { list: [...currentList] }),
        });
      }
    }

    const introduction = introductionParagraphs.join('\n\n');

    const newsData = {
      title,
      updatedDate,
      author,
      summary,
      mainImage,
      introduction,
      sections,
    };

    return NextResponse.json(newsData);
  } catch (error) {
    console.error('Scraping error:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to extract news data' },
      { status: 500 }
    );
  }
}