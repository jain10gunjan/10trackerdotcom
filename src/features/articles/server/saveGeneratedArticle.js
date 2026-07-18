import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeArticleHtml } from '@/features/articles/lib/sanitizeArticleHtml';
import { enqueueRedditOutbox } from '@/features/articles/lib/enqueueRedditOutbox';
import { revalidateArticlesCache } from '@/features/articles/lib/revalidateArticlesCache';
import { SUBREDDIT_NAMES, SUBREDDITS } from '@/lib/subreddits';
import { 
  validateHeadline, 
  validateCategory, 
  isValidUrl,
  convertToHtml,
  MAX_EXCERPT_LENGTH
} from "@/features/articles/server/generateArticleUtils";
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

// Initialize Supabase client (tracking / duplicate checks)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Get next subreddit in round-robin fashion
 * Uses database to track the last used index
 * @returns {Promise<string>} Subreddit name
 */
async function getNextSubreddit() {
  try {
    // Get current tracking record
    const { data: trackingData, error: fetchError } = await supabase
      .from('subreddit_tracking')
      .select('last_index')
      .eq('id', 1)
      .single();

    // If record doesn't exist or error, start from 0
    let currentIndex = 0;
    if (!fetchError && trackingData) {
      currentIndex = ((trackingData.last_index + 1) % SUBREDDIT_NAMES.length);
    }

    // Get the next subreddit
    const suggestedSubreddit = SUBREDDIT_NAMES[currentIndex];

    // Update the tracking record (upsert will create if doesn't exist)
    const { error: updateError } = await supabase
      .from('subreddit_tracking')
      .upsert({ id: 1, last_index: currentIndex }, { onConflict: 'id' });

    if (updateError) {
      console.error('Error updating subreddit tracking:', updateError);
      // Fallback to first subreddit if update fails
      return SUBREDDIT_NAMES[0];
    }

    return suggestedSubreddit;
  } catch (error) {
    console.error('Error in subreddit round-robin:', error);
    // Fallback to first subreddit on error
    return SUBREDDIT_NAMES[0];
  }
}

/**
 * Check if category exists in database
 * @param {string} categorySlug - Category slug to check
 * @returns {Promise<boolean>} True if category exists
 */
async function categoryExists(categorySlug) {
  try {
    const { data, error } = await supabase
      .from('article_categories')
      .select('slug')
      .eq('slug', categorySlug)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking category:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in categoryExists:', error);
    return false;
  }
}

/**
 * Check if article with same title already exists
 * @param {string} title - Article title to check
 * @returns {Promise<object|null>} Existing article or null
 */
async function checkDuplicateArticle(title) {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, created_at')
      .eq('title', title.trim())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking duplicate article:', error);
      return null; // Return null on error to allow save attempt
    }

    return data;
  } catch (error) {
    console.error('Error in checkDuplicateArticle:', error);
    return null;
  }
}

/**
 * API Route 3: Save Article to Database
 * 
 * This endpoint saves a generated article to Supabase database with validation,
 * duplicate checking, and posts to SteinHQ.
 * 
 * POST /api/generate-and-save-article/save-article
 * Body: { 
 *   title: string,
 *   description: string,
 *   article: string (markdown),
 *   category: string,
 *   image_url?: string,
 *   author_email?: string,
 *   status?: string (default: 'published'),
 *   checkDuplicate?: boolean (default: true)
 * }
 * 
 * Returns: { 
 *   success: boolean, 
 *   data: { 
 *     id: number,
 *     title: string,
 *     slug: string,
 *     url: string,
 *     suggested_subreddit: string
 *   }, 
 *   error?: string 
 * }
 */
export async function POST(req) {
  const startTime = Date.now();
  
  try {
    const authResult = await verifyAdminOrAutomationSecret(req);
    if (!authResult.ok) {
      return forbiddenArticlesWriteResponse(authResult.error);
    }
    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        },
        { status: 400 }
      );
    }

    const { 
      title, 
      description, 
      article, 
      category, 
      image_url,
      author_email = 'jain10gunjan@gmail.com',
      status = 'published',
      checkDuplicate = true
    } = body;

    // Validate required fields
    const headlineValidation = validateHeadline(title);
    if (!headlineValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid title: ${headlineValidation.error}` 
        },
        { status: 400 }
      );
    }

    const categoryValidation = validateCategory(category);
    if (!categoryValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid category: ${categoryValidation.error}` 
        },
        { status: 400 }
      );
    }

    if (!article || typeof article !== 'string' || article.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Article content is required and must be a non-empty string' 
        },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (image_url && !isValidUrl(image_url)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid image URL format. Must be a valid HTTP/HTTPS URL' 
        },
        { status: 400 }
      );
    }

    if (author_email && typeof author_email !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Author email must be a string' 
        },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['draft', 'published', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Check Supabase configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase configuration is missing');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database configuration is missing' 
        },
        { status: 500 }
      );
    }

    // Check for duplicate article (if enabled)
    if (checkDuplicate) {
      const existingArticle = await checkDuplicateArticle(title);
      if (existingArticle) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Article with this title already exists',
            details: {
              existingId: existingArticle.id,
              existingSlug: existingArticle.slug,
              createdAt: existingArticle.created_at
            },
            duplicate: true
          },
          { status: 409 } // Conflict status
        );
      }
    }

    // Validate category exists in database
    const categoryExistsResult = await categoryExists(category.trim());
    if (!categoryExistsResult) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Category '${category}' does not exist in database`,
          details: 'Please use a valid category slug from article_categories table'
        },
        { status: 400 }
      );
    }

    // Convert article to HTML
    const articleHtml = convertToHtml(article.trim());
    
    if (!articleHtml || articleHtml.length < 50) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to convert article to HTML or article is too short' 
        },
        { status: 500 }
      );
    }

    // Prepare excerpt
    const excerpt = (description || article.substring(0, 200) + '...').trim();
    const truncatedExcerpt = excerpt.length > MAX_EXCERPT_LENGTH 
      ? excerpt.substring(0, MAX_EXCERPT_LENGTH).trim() + '...'
      : excerpt;

    // Get suggested subreddit (non-blocking, fallback on error)
    let suggestedSubreddit = null;
    try {
      suggestedSubreddit = await getNextSubreddit();
    } catch (subredditError) {
      console.error('Failed to get subreddit suggestion:', subredditError);
      // Continue without subreddit suggestion
    }

    // Save to database
    let savedArticle;
    try {
      const { data, error: dbError } = await getSupabaseAdmin()
        .from('articles')
        .insert({
          title: title.trim(),
          content: sanitizeArticleHtml(articleHtml),
          excerpt: truncatedExcerpt,
          category: category.trim(),
          tags: [],
          featured_image_url: image_url || null,
          is_featured: false,
          social_media_embeds: [],
          author_email: author_email.trim(),
          status: status
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        
        // Handle specific database errors
        if (dbError.code === '23505') { // Unique constraint violation
          return NextResponse.json(
            { 
              success: false, 
              error: 'Article with this title or slug already exists',
              details: dbError.message
            },
            { status: 409 }
          );
        }

        if (dbError.code === '23503') { // Foreign key violation
          return NextResponse.json(
            { 
              success: false, 
              error: 'Invalid category reference',
              details: 'The category does not exist in the database'
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to save article to database',
            details: dbError.message 
          },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Article was not saved - no data returned' 
          },
          { status: 500 }
        );
      }

      savedArticle = data;
    } catch (dbError) {
      console.error('Unexpected error saving article:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unexpected error saving article',
          details: dbError.message 
        },
        { status: 500 }
      );
    }

    // Enqueue Reddit/SteinHQ delivery (durable outbox)
    const matched = SUBREDDITS.find((s) => s.name === suggestedSubreddit);
    await enqueueRedditOutbox({
      articleId: savedArticle.id,
      title: savedArticle.title,
      slug: savedArticle.slug,
      featuredImageUrl: savedArticle.featured_image_url || null,
      selectedSubreddits: suggestedSubreddit
        ? [{ name: suggestedSubreddit, flairID: matched?.flairID || null }]
        : null,
    });
    revalidateArticlesCache({ slug: savedArticle.slug });

    const processingTime = Date.now() - startTime;

    // Return successful response
    return NextResponse.json({
      success: true,
      message: 'Article saved successfully',
      data: {
        id: savedArticle.id,
        title: savedArticle.title,
        slug: savedArticle.slug,
        category: savedArticle.category,
        excerpt: savedArticle.excerpt,
        featured_image_url: savedArticle.featured_image_url,
        status: savedArticle.status,
        created_at: savedArticle.created_at,
        url: `/articles/${savedArticle.slug}`,
        suggested_subreddit: suggestedSubreddit
      },
      meta: {
        processingTimeMs: processingTime,
        duplicateCheck: checkDuplicate,
        steinhqPosted: true
      }
    });

  } catch (err) {
    console.error('Unexpected error in save-article:', err);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: err.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for API documentation
 */
export async function GET(request) {
  const authResult = await verifyAdminOrAutomationSecret(request);
  if (!authResult.ok) {
    return forbiddenArticlesWriteResponse(authResult.error);
  }
  return NextResponse.json({
    message: "Save Article API",
    description: "Saves a generated article to Supabase database with validation and duplicate checking",
    method: "POST",
    endpoint: "/api/generate-and-save-article/save-article",
    requestBody: {
      title: "string (required) - Article title",
      description: "string (optional) - Article description/excerpt",
      article: "string (required) - Article content in markdown format",
      category: "string (required) - Category slug (must exist in article_categories)",
      image_url: "string (optional) - Featured image URL (must be valid HTTP/HTTPS URL)",
      author_email: "string (optional, default: 'jain10gunjan@gmail.com') - Author email",
      status: "string (optional, default: 'published') - Article status: 'draft', 'published', or 'archived'",
      checkDuplicate: "boolean (optional, default: true) - Whether to check for duplicate titles"
    },
    response: {
      success: "boolean",
      message: "string",
      data: {
        id: "number - Article ID",
        title: "string - Article title",
        slug: "string - Article slug",
        category: "string - Category slug",
        excerpt: "string - Article excerpt",
        featured_image_url: "string|null - Featured image URL",
        status: "string - Article status",
        created_at: "string - Creation timestamp",
        url: "string - Article URL path",
        suggested_subreddit: "string|null - Suggested subreddit for posting"
      },
      meta: {
        processingTimeMs: "number",
        duplicateCheck: "boolean",
        steinhqPosted: "boolean"
      }
    },
    validation: {
      title: "Must be 1-500 characters",
      category: "Must exist in article_categories table",
      article: "Must be non-empty string",
      image_url: "Must be valid HTTP/HTTPS URL if provided",
      status: "Must be one of: draft, published, archived"
    },
    errorCodes: {
      400: "Bad request - validation error",
      409: "Conflict - duplicate article exists",
      500: "Internal server error"
    },
    example: {
      request: {
        title: "Netflix and Warner Bros Acquisition News",
        description: "Latest updates on the acquisition",
        article: "# Introduction\n\nArticle content here...",
        category: "news",
        image_url: "https://example.com/image.jpg",
        status: "published"
      }
    }
  });
}
