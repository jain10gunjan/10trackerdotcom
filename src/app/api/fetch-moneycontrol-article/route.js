import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import {
  verifyAdminOrAutomationSecret,
  forbiddenArticlesWriteResponse,
} from '@/features/articles/lib/verifyArticlesWriteAuth';
import { assertAllowedFetchUrl } from '@/lib/safeFetchUrl';

const MONEYCONTROL_ALLOWED_HOSTS = ['moneycontrol.com', 'www.moneycontrol.com'];

const sitemapUrl = 'https://www.moneycontrol.com/news/news-sitemap.xml';

function getHeaders({ type = 'xml' } = {}) {
  if (type === 'html') {
    return {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://www.moneycontrol.com/',
      Origin: 'https://www.moneycontrol.com',
    };
  }

  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/xml, text/xml, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://www.moneycontrol.com/',
    Origin: 'https://www.moneycontrol.com',
  };
}

function mapMoneycontrolCategory(articleUrl) {
  if (/\/news\/world-news\//i.test(articleUrl) || /\/news\/world\//i.test(articleUrl)) {
    return 'world-news';
  }
  if (/\/news\/india\//i.test(articleUrl)) {
    return 'news';
  }
  if (/\/news\/business\/economy\//i.test(articleUrl)) {
    return 'news';
  }
  if (/\/news\/technology\//i.test(articleUrl)) {
    return 'technology';
  }
  return null;
}

function isAllowedUrl(articleUrl) {
  const hostCheck = assertAllowedFetchUrl(articleUrl, MONEYCONTROL_ALLOWED_HOSTS);
  if (!hostCheck.ok) return false;
  return Boolean(mapMoneycontrolCategory(articleUrl));
}

async function fetchSitemap() {
  const { data } = await axios.get(sitemapUrl, {
    headers: getHeaders({ type: 'xml' }),
    timeout: 20000,
  });

  const $ = cheerio.load(data, { xmlMode: true });
  const urls = [];

  $('url').each((i, elem) => {
    const loc = $(elem).find('loc').text();
    if (loc) urls.push(loc);
  });

  return urls;
}

function isDisallowedTitle(title) {
  if (!title) return false;
  const t = title.toLowerCase();
  return t.includes('moneycontrol pro') || t.includes('moneycontrol');
}

async function fetchArticleContent(articleUrl) {
  if (!isAllowedUrl(articleUrl)) {
    throw new Error('URL host or category is not allowed');
  }

  const { data } = await axios.get(articleUrl, {
    headers: getHeaders({ type: 'html' }),
    timeout: 20000,
  });
  const $ = cheerio.load(data);

  const title = $('.article_title, .artTitle').text().trim();
  const imageUrl =
    $('.article_image_wrapper .article_image img').attr('data-src') ||
    $('.article_image_wrapper .article_image img').attr('src') ||
    null;
  const category = mapMoneycontrolCategory(articleUrl);

  return {
    title,
    link: articleUrl,
    imageUrl,
    category: category || null,
  };
}

export async function GET(request) {
  const auth = await verifyAdminOrAutomationSecret(request);
  if (!auth.ok) {
    return forbiddenArticlesWriteResponse(auth.error);
  }

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const categoryParam = searchParams.get('category');

    if (url) {
      if (!isAllowedUrl(url)) {
        return NextResponse.json(
          { success: false, error: 'URL host or category is not allowed' },
          { status: 400 }
        );
      }
      const articleData = await fetchArticleContent(url);
      return NextResponse.json({ success: true, data: articleData });
    }

    const urls = await fetchSitemap();
    const cat = categoryParam ? String(categoryParam).toLowerCase() : null;

    if (urls?.length) {
      for (const u of urls) {
        if (!isAllowedUrl(u)) continue;
        if (cat && mapMoneycontrolCategory(u) !== cat) continue;

        const articleData = await fetchArticleContent(u);
        if (isDisallowedTitle(articleData.title)) continue;

        return NextResponse.json({
          success: true,
          data: {
            ...articleData,
            category: mapMoneycontrolCategory(u) || articleData.category || null,
          },
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'No latest data found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in moneycontrol API route:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await verifyAdminOrAutomationSecret(request);
  if (!auth.ok) {
    return forbiddenArticlesWriteResponse(auth.error);
  }

  try {
    const { url } = await request.json().catch(() => ({}));

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!isAllowedUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'URL host or category is not allowed' },
        { status: 400 }
      );
    }

    const articleData = await fetchArticleContent(url);
    return NextResponse.json({ success: true, data: articleData });
  } catch (error) {
    console.error('Error in moneycontrol API route:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
