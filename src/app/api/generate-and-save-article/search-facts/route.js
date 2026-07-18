import { NextResponse } from "next/server";
import OpenAI from "openai";
import { validateHeadline } from "../utils";
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Constants
const MAX_OUTPUT_TOKENS = 900;
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * API Route 1: Search Facts from Web
 * 
 * This endpoint performs web search and extracts verified factual information
 * about a given headline/topic.
 * 
 * POST /api/generate-and-save-article/search-facts
 * Body: { headline: string }
 * 
 * Returns: { success: boolean, data: { factualNotes: string }, error?: string }
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

    const { headline } = body;

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

    // Perform web search with timeout
    let factualResponse;
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT);
      });

      // Race between API call and timeout
      factualResponse = await Promise.race([
        client.responses.create({
          model: "gpt-4.1-mini",
          tools: [{ type: "web_search" }],
          input: `
Search the web and extract ONLY VERIFIED information.

Topic:
"${headline.trim()}"

CRITICAL RULES:
- Use ONLY officially confirmed information
- If something is unconfirmed, clearly say:
  "As of ${new Date().getFullYear()}, no official confirmation exists."
- DO NOT infer deals, prices, approvals, or decisions
- DO NOT merge rumours or analyst speculation
- Keep facts short and clear
- Mention the year explicitly
- Cite sources when possible

OUTPUT:
Plain factual notes only (no storytelling)
`,
          max_output_tokens: MAX_OUTPUT_TOKENS
        }),
        timeoutPromise
      ]);
    } catch (apiError) {
      console.error('OpenAI API error:', apiError);
      
      // Handle specific error types
      if (apiError.message === 'Request timeout') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Request timed out. Please try again.',
            details: 'The web search took too long to complete'
          },
          { status: 504 }
        );
      }
      
      if (apiError.status === 401 || apiError.status === 403) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'OpenAI API authentication failed',
            details: 'Please check your API key configuration'
          },
          { status: 500 }
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
          error: 'Failed to search for facts',
          details: apiError.message || 'Unknown error occurred'
        },
        { status: 500 }
      );
    }

    // Extract factual notes
    const factualNotes = factualResponse?.output_text;
    
    if (!factualNotes || typeof factualNotes !== 'string') {
      console.error('Invalid response from OpenAI:', factualResponse);
      return NextResponse.json(
        { 
          success: false, 
          error: 'No factual data found',
          details: 'The API returned an invalid or empty response'
        },
        { status: 500 }
      );
    }

    // Validate that we got meaningful content
    const trimmedNotes = factualNotes.trim();
    if (trimmedNotes.length < 50) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient factual data',
          details: 'The search returned very little information. The topic may be too new or obscure.'
        },
        { status: 500 }
      );
    }

    const processingTime = Date.now() - startTime;

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        factualNotes: trimmedNotes,
        headline: headline.trim(),
        processingTimeMs: processingTime
      },
      meta: {
        tokensUsed: MAX_OUTPUT_TOKENS,
        model: "gpt-4.1-mini",
        webSearchUsed: true
      }
    });

  } catch (err) {
    console.error('Unexpected error in search-facts:', err);
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
    message: "Search Facts API",
    description: "Performs web search and extracts verified factual information",
    method: "POST",
    endpoint: "/api/generate-and-save-article/search-facts",
    requestBody: {
      headline: "string (required) - The topic or headline to search for"
    },
    response: {
      success: "boolean",
      data: {
        factualNotes: "string - Extracted factual information",
        headline: "string - The original headline",
        processingTimeMs: "number - Processing time in milliseconds"
      },
      meta: {
        tokensUsed: "number",
        model: "string",
        webSearchUsed: "boolean"
      }
    },
    example: {
      request: {
        headline: "Netflix and Warner Bros acquisition news"
      },
      response: {
        success: true,
        data: {
          factualNotes: "Verified facts about the topic...",
          headline: "Netflix and Warner Bros acquisition news",
          processingTimeMs: 5234
        }
      }
    }
  });
}
