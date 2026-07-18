import { NextResponse } from "next/server";
import OpenAI from "openai";
import { 
  validateHeadline, 
  safeJsonParse, 
  countWords, 
  convertToHtml,
  WORD_COUNT_MIN, 
  WORD_COUNT_MAX,
  MAX_EXPANSION_ATTEMPTS
} from "@/features/articles/server/generateArticleUtils";
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Constants
const MAX_OUTPUT_TOKENS_GENERATION = 1200;
const MAX_OUTPUT_TOKENS_EXPANSION = 1400;
const REQUEST_TIMEOUT = 45000; // 45 seconds for generation + expansion

/**
 * API Route 2: Create and Expand Article
 * 
 * This endpoint generates a news article from factual notes and expands it
 * to meet word count requirements (500-700 words).
 * 
 * POST /api/generate-and-save-article/create-article
 * Body: { 
 *   headline: string,
 *   factualNotes: string,
 *   expandToWordCount?: boolean (default: true)
 * }
 * 
 * Returns: { 
 *   success: boolean, 
 *   data: { 
 *     title: string,
 *     description: string,
 *     article: string,
 *     articleHtml: string,
 *     wordCount: number
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

    const { headline, factualNotes, expandToWordCount = true } = body;

    // Validate headline
    const headlineValidation = validateHeadline(headline);
    if (!headlineValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: headlineValidation.error 
        },
        { status: 400 }
      );
    }

    // Validate factual notes
    if (!factualNotes || typeof factualNotes !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Factual notes are required and must be a string' 
        },
        { status: 400 }
      );
    }

    const trimmedNotes = factualNotes.trim();
    if (trimmedNotes.length < 50) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Factual notes are too short',
          details: 'Factual notes must be at least 50 characters'
        },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API key is not configured' 
        },
        { status: 500 }
      );
    }

    /* =====================================================
       STEP 1: GENERATE INITIAL ARTICLE (JSON, NO WEB)
       ===================================================== */
    let articleResponse;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT);
      });

      articleResponse = await Promise.race([
        client.responses.create({
          model: "gpt-4.1-nano",
          input: `
You are a responsible news editor write news in very easy to understand language.

Using ONLY the verified notes below, write a
clean, cautious, UI-friendly news article.

IMPORTANT:
- DO NOT present unconfirmed events as facts
- Do NOT add new facts
- Use ONLY the information provided in the verified notes

UI RULES:
- Short paragraphs (2–3 sentences)
- Blank line between paragraphs
- Bullet points for facts
- Clear headings using # or ##
- Professional, neutral tone
- Write in very easy to understand language

RETURN STRICT JSON ONLY:
{
  "title": "",
  "description": "",
  "article": ""
}

ARTICLE STRUCTURE:
- Introduction
- Key Highlights (bullets)
- Current Status
- Why It Matters
- Important Dates / Numbers
- Official Position

VERIFIED NOTES:
"""
${trimmedNotes}
"""
`,
          max_output_tokens: MAX_OUTPUT_TOKENS_GENERATION
        }),
        timeoutPromise
      ]);
    } catch (apiError) {
      console.error('OpenAI API error in article generation:', apiError);
      
      if (apiError.message === 'Request timeout') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Article generation timed out',
            details: 'The request took too long to complete'
          },
          { status: 504 }
        );
      }
      
      if (apiError.status === 429) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Rate limit exceeded',
            details: 'Too many requests. Please try again later.'
          },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to generate article',
          details: apiError.message || 'Unknown error occurred'
        },
        { status: 500 }
      );
    }

    // Parse article JSON
    let articleJson;
    try {
      articleJson = safeJsonParse(articleResponse.output_text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to parse article response',
          details: parseError.message
        },
        { status: 500 }
      );
    }

    // Validate article JSON structure
    if (!articleJson.title || !articleJson.article) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid article structure',
          details: 'Article must contain title and article fields'
        },
        { status: 500 }
      );
    }

    /* =====================================================
       STEP 2: EXPAND ARTICLE TO 500-700 WORDS (IF NEEDED)
       ===================================================== */
    let articleText = articleJson.article.trim();
    let words = countWords(articleText);
    let expansionAttempts = 0;
    let expansionPerformed = false;

    if (expandToWordCount && words < WORD_COUNT_MIN) {
      // Attempt expansion up to MAX_EXPANSION_ATTEMPTS times
      while (words < WORD_COUNT_MIN && expansionAttempts < MAX_EXPANSION_ATTEMPTS) {
        expansionAttempts++;
        expansionPerformed = true;

        try {
          const expandResponse = await client.responses.create({
            model: "gpt-4.1-nano",
            input: `
Expand the article below to BETWEEN ${WORD_COUNT_MIN} AND ${WORD_COUNT_MAX} WORDS. 
Write in very easy to understand language.

STRICT RULES:
- Do NOT add new facts
- Do NOT invent numbers or events
- Expand explanation, background, and implications ONLY
- Keep short paragraphs and bullets
- Maintain neutral tone
- Use the same structure and style

RETURN ONLY THE UPDATED ARTICLE TEXT (no JSON, just the article text).

ARTICLE:
"""
${articleText}
"""
`,
            max_output_tokens: MAX_OUTPUT_TOKENS_EXPANSION
          });

          const expandedText = expandResponse.output_text.trim();
          
          if (!expandedText || expandedText.length < articleText.length) {
            console.warn(`Expansion attempt ${expansionAttempts} did not increase article length`);
            break; // Stop if expansion didn't help
          }

          articleText = expandedText;
          words = countWords(articleText);

          // Check if we exceeded max words
          if (words > WORD_COUNT_MAX) {
            console.warn(`Article exceeded max word count: ${words} words`);
            // Could truncate here, but for now we'll accept it
            break;
          }

          // If we're in the target range, stop
          if (words >= WORD_COUNT_MIN && words <= WORD_COUNT_MAX) {
            break;
          }

        } catch (expandError) {
          console.error(`Expansion attempt ${expansionAttempts} failed:`, expandError);
          // If it's not the last attempt, continue
          if (expansionAttempts < MAX_EXPANSION_ATTEMPTS) {
            continue;
          }
          // On last attempt, return what we have
          break;
        }
      }
    }

    // Final word count check
    words = countWords(articleText);
    
    if (expandToWordCount && words < WORD_COUNT_MIN) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Word count out of range',
          details: `Article has ${words} words, but minimum is ${WORD_COUNT_MIN}. Expansion attempts: ${expansionAttempts}`,
          wordCount: words,
          minRequired: WORD_COUNT_MIN
        },
        { status: 500 }
      );
    }

    // Convert to HTML
    const articleHtml = convertToHtml(articleText);

    // Extract or generate description
    const description = articleJson.description || articleText.substring(0, 200).trim() + '...';

    const processingTime = Date.now() - startTime;

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        title: articleJson.title.trim(),
        description: description.trim(),
        article: articleText,
        articleHtml,
        wordCount: words
      },
      meta: {
        processingTimeMs: processingTime,
        expansionPerformed,
        expansionAttempts,
        tokensUsed: MAX_OUTPUT_TOKENS_GENERATION + (expansionPerformed ? MAX_OUTPUT_TOKENS_EXPANSION : 0),
        model: "gpt-4.1-nano"
      }
    });

  } catch (err) {
    console.error('Unexpected error in create-article:', err);
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
    message: "Create Article API",
    description: "Generates a news article from factual notes and expands it to 500-700 words",
    method: "POST",
    endpoint: "/api/generate-and-save-article/create-article",
    requestBody: {
      headline: "string (required) - The article headline",
      factualNotes: "string (required) - Verified factual information from web search",
      expandToWordCount: "boolean (optional, default: true) - Whether to expand to 500-700 words"
    },
    response: {
      success: "boolean",
      data: {
        title: "string - Article title",
        description: "string - Article description/excerpt",
        article: "string - Article text (markdown)",
        articleHtml: "string - Article HTML",
        wordCount: "number - Word count"
      },
      meta: {
        processingTimeMs: "number",
        expansionPerformed: "boolean",
        expansionAttempts: "number",
        tokensUsed: "number",
        model: "string"
      }
    },
    wordCountRequirements: {
      min: WORD_COUNT_MIN,
      max: WORD_COUNT_MAX
    },
    example: {
      request: {
        headline: "Netflix and Warner Bros acquisition news",
        factualNotes: "Verified facts about the acquisition...",
        expandToWordCount: true
      }
    }
  });
}
