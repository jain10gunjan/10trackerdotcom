import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

// Mapping of logical categories to source URLs and DB category slugs
const CATEGORY_CONFIG = {
  'regional-news': {
    url: 'https://www.newsonair.gov.in/category/regional-news/',
    dbCategory: 'regional-news',
  },
  news: {
    url: 'https://www.newsonair.gov.in/category/national/',
    dbCategory: 'news',
  },
  sports: {
    url: 'https://www.newsonair.gov.in/category/sports/',
    dbCategory: 'sports',
  },
  'world-news': {
    url: 'https://www.newsonair.gov.in/category/international/',
    dbCategory: 'world-news',
  },
  economy: {
    url: 'https://www.newsonair.gov.in/category/business/',
    dbCategory: 'economy',
  },
};

// Initialize Supabase client (anon key – relies on RLS for safety)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function getHeaders() {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    Referer: 'https://www.newsonair.gov.in/',
    Origin: 'https://www.newsonair.gov.in',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
  };
}

async function fetchNewsonairArticlesForUrl(sourceUrl) {
  const { data } = await axios.get(sourceUrl, {
    headers: getHeaders(),
    timeout: 30000, // 30 seconds timeout
  });

  const $ = cheerio.load(data);
  const articles = [];

  // Try to find articles in post-container first, then fallback to all articles
  let articleContainer = $('#post-container');
  if (articleContainer.length === 0) {
    articleContainer = $('body'); // Fallback to body if post-container not found
  }

  // Find all article elements - match articles with class starting with "post-"
  articleContainer.find('article[class*=\"post-\"]').each((index, element) => {
    try {
      const $article = $(element);

      // Extract title from h3.entry-title > a
      const titleElement = $article.find('h3.entry-title a');
      const title = titleElement.text().trim() || titleElement.attr('title') || '';

      // Extract image URL from figure.featured-media img
      // Try multiple selectors to find the image
      let imageElement = $article.find('figure.featured-media img');
      if (imageElement.length === 0) {
        imageElement = $article.find('.featured-media img');
      }
      if (imageElement.length === 0) {
        imageElement = $article.find('img');
      }

      const imageUrl =
        imageElement.attr('src') ||
        imageElement.attr('data-src') ||
        imageElement.attr('data-lazy-src') ||
        '';

      // Extract article URL
      const articleUrl = titleElement.attr('href') || '';

      // Extract date if available - try multiple selectors
      let dateText = $article
        .find('.totalView p.mb-0.colorPrimary.fs-14')
        .text()
        .trim();
      if (!dateText) {
        dateText = $article.find('.totalView p').first().text().trim();
      }

      // Extract view count if available
      let viewCountText = $article.find('.eyeView span').text().trim();
      if (!viewCountText) {
        viewCountText = $article.find('.eyeView').text().trim();
      }
      const viewCount = parseInt(viewCountText) || 0;

      // Extract excerpt/description if available
      const excerpt = $article.find('p.blogDisc').text().trim() || '';

      // Only add article if it has a title
      if (title) {
        articles.push({
          title,
          imageUrl,
          url: articleUrl,
          date: dateText,
          viewCount,
          excerpt,
        });
      }
    } catch (error) {
      console.error(`Error parsing article ${index}:`, error);
      // Continue with next article
    }
  });

  return articles;
}

// Handle one logical category: fetch latest article and save to postable_entries if new
async function processCategory(categoryKey) {
  const config = CATEGORY_CONFIG[categoryKey];
  if (!config) {
    return {
      category: categoryKey,
      success: false,
      message: 'Unknown category',
    };
  }

  try {
    const articles = await fetchNewsonairArticlesForUrl(config.url);

    if (!articles || articles.length === 0) {
      return {
        category: categoryKey,
        success: false,
        message: 'No articles found on News On Air',
      };
    }

    const latestArticle = articles[0];
    const title = latestArticle.title;
    const imageUrl = latestArticle.imageUrl || '';
    const articleUrl = latestArticle.url || '';

    // Check if an article with same title & category already exists in articles table
    // We check articles table, NOT is_posted value, to avoid duplicates
    let existingArticle = null;
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, category, created_at')
        .eq('category', config.dbCategory)
        .eq('title', title)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing article:', error);
      } else {
        existingArticle = data || null;
      }
    } catch (checkError) {
      console.error('Unexpected error during existing-article check:', checkError);
    }

    // Also check postable_entries to avoid duplicate entries
    let existingEntry = null;
    try {
      const { data, error } = await supabase
        .from('postable_entries')
        .select('id, title, image_url, category, created_at')
        .eq('category', config.dbCategory)
        .eq('image_url', imageUrl)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing postable entry:', error);
      } else {
        existingEntry = data || null;
      }
    } catch (checkError) {
      console.error('Unexpected error during existing-entry check:', checkError);
    }

    // If article exists in articles table OR postable_entries, do not insert
    // We check by title and category, NOT by is_posted value
    if (existingArticle || existingEntry) {
      return {
        category: categoryKey,
        success: true,
        message: 'No new article found',
      };
    }

    // Not existing: insert into postable_entries
    try {
      const { data: inserted, error: insertError } = await supabase
        .from('postable_entries')
        .insert({
          title,
          image_url: imageUrl,
          category: config.dbCategory,
          url: articleUrl,
          is_posted: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting postable entry:', insertError);

        // Unique-constraint style safety: if duplicate happens between check & insert
        if (
          insertError.code === '23505' ||
          insertError.message?.includes('duplicate') ||
          insertError.message?.includes('unique')
        ) {
          return {
            category: categoryKey,
            success: true,
            message: 'No new article found',
          };
        }

        return {
          category: categoryKey,
          success: false,
          message: 'Failed to save article to postable_entries',
          error: insertError.message,
        };
      }

      // Successfully saved
      return {
        category: categoryKey,
        success: true,
        message: 'New article saved to postable_entries',
        data: {
          ...latestArticle,
          entryId: inserted.id,
          category: config.dbCategory,
          createdAt: inserted.created_at,
        },
      };
    } catch (saveError) {
      console.error('Unexpected error saving postable entry:', saveError);
      return {
        category: categoryKey,
        success: false,
        message: 'Unexpected error while saving article',
        error: saveError.message,
      };
    }
  } catch (error) {
    console.error(`Error processing category ${categoryKey}:`, error);
    return {
      category: categoryKey,
      success: false,
      message: 'Failed to fetch News On Air articles',
      error: error.message,
    };
  }
}

export async function GET(request) {
  try {
    const authResult = await verifyAdminOrAutomationSecret(request);
    if (!authResult.ok) {
      return forbiddenArticlesWriteResponse(authResult.error);
    }
    // Ensure Supabase is configured
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase configuration is missing',
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category'); // e.g., 'news', 'sports', 'world-news', 'economy', 'regional-news', or 'all'

    // If a single category is requested
    if (categoryParam && categoryParam !== 'all') {
      const key = categoryParam in CATEGORY_CONFIG ? categoryParam : null;
      if (!key) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid category',
            allowedCategories: Object.keys(CATEGORY_CONFIG),
          },
          { status: 400 }
        );
      }

      const result = await processCategory(key);
      // Keep the top-level success consistent with the per-category result
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }

    // Otherwise, process all categories in parallel
    const categoryKeys = Object.keys(CATEGORY_CONFIG);
    const results = await Promise.all(categoryKeys.map((key) => processCategory(key)));

    const anySuccess = results.some((r) => r.success);

    return NextResponse.json(
      {
        success: anySuccess,
        results,
      },
      { status: anySuccess ? 200 : 500 }
    );
  } catch (error) {
    console.error('Error in News on Air API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch News on Air articles',
      },
      { status: 500 }
    );
  }
}
