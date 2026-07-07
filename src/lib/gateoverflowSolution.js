import * as cheerio from 'cheerio';
import { uploadRemoteImageToStorage } from '@/lib/supabaseStorageServer';
import { normalizeGateOverflowUrl } from '@/lib/gateoverflowUrl';
import { fetchGateOverflowHtml, isCloudflareChallenge } from '@/lib/fetchGateOverflowHtml';

export { normalizeGateOverflowUrl } from '@/lib/gateoverflowUrl';

const SOLUTION_SELECTORS = [
  '.qa-a-item-content',
  '.qa-a-item-content > div',
  '.qa-a-item-content p',
  '.qa-a-item-content .qa-a-item-main',
  '.answer-content',
];

function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/\s{2,}/g, ' ')
    .replace(/<html>.*?<body>/gis, '')
    .replace(/<\/body><\/html>/gis, '')
    .trim();
}

function processHtml(html) {
  if (!html) return html;
  const $ = cheerio.load(html);
  $('script, style').remove();
  return cleanHtml($.html());
}

function parseSolutionFromHtml(html) {
  if (!html?.trim()) {
    throw new Error('No HTML provided to parse.');
  }
  if (isCloudflareChallenge(html)) {
    throw new Error('Pasted HTML looks like a Cloudflare challenge page, not a solution.');
  }

  const $ = cheerio.load(html);
  let solutiontext = null;

  for (const selector of SOLUTION_SELECTORS) {
    const content = $(selector).first().html();
    if (content && content.trim().length > 0) {
      solutiontext = content;
      break;
    }
  }

  if (!solutiontext) {
    const fallback = $('.qa-a-item-content').text().trim();
    if (fallback) solutiontext = `<p>${fallback}</p>`;
  }

  if (!solutiontext && html.trim().startsWith('<')) {
    solutiontext = html.trim();
  }

  if (!solutiontext) {
    throw new Error('No solution content found in the HTML.');
  }

  return processHtml(solutiontext);
}

async function rehostImagesInHtml(html, questionId = 'extract') {
  if (!html) return html;
  const $ = cheerio.load(html);
  const images = $('img').toArray();
  const baseId = String(questionId || 'extract').replace(/[^a-zA-Z0-9-_]/g, '_');

  await Promise.all(
    images.map(async (img, index) => {
      const el = $(img);
      const src = el.attr('data-src') || el.attr('src');
      if (!src) return;

      let imageUrl = src.trim();
      if (!/^https?:\/\//i.test(imageUrl)) {
        imageUrl = `https://gateoverflow.in${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
      }

      try {
        const publicUrl = await uploadRemoteImageToStorage(
          imageUrl,
          `gate-solutions/${baseId}-${Date.now()}-${index}`
        );
        if (publicUrl) el.attr('src', publicUrl);
      } catch (err) {
        console.warn('GateOverflow image rehost failed:', imageUrl, err?.message);
      }
    })
  );

  return $.html();
}

/**
 * @param {string} rawUrl
 * @param {string} [questionId]
 * @param {string} [pastedHtml] — skip fetch when admin pastes page/answer HTML from browser
 */
export async function extractGateOverflowSolution(
  rawUrl,
  questionId = 'extract',
  pastedHtml = null
) {
  const url = normalizeGateOverflowUrl(rawUrl);
  if (!url) {
    throw new Error('Invalid URL. Only gateoverflow.in links are allowed.');
  }

  let solutiontext;
  if (pastedHtml?.trim()) {
    solutiontext = parseSolutionFromHtml(pastedHtml);
  } else {
    const { html } = await fetchGateOverflowHtml(url);
    solutiontext = parseSolutionFromHtml(html);
  }

  solutiontext = await rehostImagesInHtml(solutiontext, questionId);
  return { url, solutiontext };
}
