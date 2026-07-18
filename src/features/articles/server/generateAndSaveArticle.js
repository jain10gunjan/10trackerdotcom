import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeArticleHtml } from '@/features/articles/lib/sanitizeArticleHtml';
import { enqueueRedditOutbox } from '@/features/articles/lib/enqueueRedditOutbox';
import { revalidateArticlesCache } from '@/features/articles/lib/revalidateArticlesCache';
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ---------------- helpers ----------------
const countWords = (text = "") =>
  text.trim().split(/\s+/).length;

const safeJsonParse = (text) => {
  // Helper to clean and fix common JSON issues
  const cleanJson = (jsonStr) => {
    // Remove markdown code blocks
    let cleaned = jsonStr.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    // Try to extract JSON object if there's extra text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      cleaned = match[0];
    }
    
    // Fix common JSON issues
    // Remove trailing commas before } or ]
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    return cleaned;
  };

  try {
    // First attempt: direct parse after basic cleaning
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (firstError) {
    try {
      // Second attempt: extract JSON object and clean
      const cleaned = cleanJson(text);
      return JSON.parse(cleaned);
    } catch (secondError) {
      // Third attempt: try to find and parse just the JSON object with more aggressive cleaning
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error("JSON parse error - no JSON object found in:", text.substring(0, 200));
        throw new Error("Invalid JSON from model: No JSON object found");
      }
      
      try {
        let cleaned = cleanJson(match[0]);
        
        // More aggressive cleaning: try to fix unescaped newlines and quotes
        // Replace unescaped newlines in string values
        cleaned = cleaned.replace(/("(?:[^"\\]|\\.)*")\s*\n\s*/g, '$1 ');
        
        // Remove trailing commas more aggressively
        cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
        
        return JSON.parse(cleaned);
      } catch (thirdError) {
        // Log the problematic JSON for debugging
        const jsonPreview = match[0].substring(0, 500);
        console.error("JSON parse error - problematic JSON:", jsonPreview);
        console.error("Parse error details:", thirdError.message);
        console.error("Full text preview:", text.substring(0, 300));
        
        // Last resort: try to manually construct a minimal valid JSON
        // Extract title, description, and article fields if possible
        const titleMatch = text.match(/"title"\s*:\s*"([^"]*)"/) || text.match(/"title"\s*:\s*'([^']*)'/);
        const descMatch = text.match(/"description"\s*:\s*"([^"]*)"/) || text.match(/"description"\s*:\s*'([^']*)'/);
        const articleMatch = text.match(/"article"\s*:\s*"([^"]*)"/) || text.match(/"article"\s*:\s*'([^']*)'/);
        
        if (titleMatch || descMatch || articleMatch) {
          return {
            title: titleMatch ? titleMatch[1] : "",
            description: descMatch ? descMatch[1] : "",
            article: articleMatch ? articleMatch[1] : ""
          };
        }
        
        throw new Error(`Invalid JSON from model: ${thirdError.message}`);
      }
    }
  }
};

const escapeHtml = (str) =>
  str.replace(/[&<>"']/g, m =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[m])
  );

// Process inline formatting (bold text)
const processInlineFormatting = (text) => {
  // Convert **text** to <strong>text</strong>
  let processed = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Escape HTML to prevent XSS
  processed = escapeHtml(processed);
  // Re-apply strong tags (since escapeHtml would have escaped them)
  processed = processed.replace(/&lt;strong&gt;(.+?)&lt;\/strong&gt;/g, '<strong>$1</strong>');
  return processed;
};

const convertToHtml = (article) => {
  if (!article) return "";
  
  // Split into paragraphs (double newlines)
  const blocks = article.split(/\n\n+/).filter(Boolean);
  let html = `<div class="article-body">`;
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;
    
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) continue;

    // Check for markdown headings like "# Heading", "## Heading", "### Heading"
    // We convert them into clean <h2>/<h3> elements without the leading ### text.
    if (lines.length === 1) {
      const headingMatch = lines[0].match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2].trim();
        // Map all heading levels to h2/h3 to keep UI consistent and avoid very large/small headings
        const tag = level <= 2 ? 'h2' : 'h3';
        html += `<${tag}>${processInlineFormatting(headingText)}</${tag}>`;
        continue;
      }
    }
    
    // Check if it's a bullet list
    const hasBullets = lines.some(line => line.match(/^-\s/));
    
    if (hasBullets) {
      // Convert bullet list to HTML
      html += `<ul>`;
      lines.forEach(line => {
        const bulletMatch = line.match(/^-\s*(.+)$/);
        if (bulletMatch) {
          let itemText = bulletMatch[1].trim();
          // Strip any markdown heading syntax inside bullet items (e.g. "- ### Point")
          itemText = itemText.replace(/^(#{1,6})\s+/, '');
          html += `<li>${processInlineFormatting(itemText)}</li>`;
        }
      });
      html += `</ul>`;
    } else {
      // Regular paragraph - join all lines
      const paragraphText = lines.join(' ').trim();
      if (paragraphText) {
        html += `<p>${processInlineFormatting(paragraphText)}</p>`;
      }
    }
  }
  
  html += `</div>`;
  return html;
};

// ---------------- API ----------------
export async function POST(req) {
  try {
    const authResult = await verifyAdminOrAutomationSecret(req);
    if (!authResult.ok) {
      return forbiddenArticlesWriteResponse(authResult.error);
    }
    const { headline, category, image_url } = await req.json();
    
    if (!headline) {
      return NextResponse.json({ error: "Headline is required" }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    // image_url is optional, but if provided, validate it's a valid URL
    if (image_url && !image_url.match(/^https?:\/\/.+/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    /* =====================================================
       STEP 1: VERIFIED FACT EXTRACTION (WEB SEARCH – ONCE)
       ===================================================== */
    const factualResponse = await client.responses.create({
      model: "gpt-4.1-mini",
      tools: [{ type: "web_search" }],
      input: `
Search the web and extract ONLY VERIFIED information.

Topic:
"${headline}"

CRITICAL RULES:
- Use ONLY officially confirmed information
- If something is unconfirmed, clearly say:
  "As of <current year>, no official confirmation exists."
- DO NOT infer deals, prices, approvals, or decisions
- DO NOT merge rumours or analyst speculation
- Keep facts short and clear
- Mention the year explicitly

OUTPUT:
Plain factual notes only (no storytelling)
`,
      max_output_tokens: 900
    });

    const factualNotes = factualResponse.output_text;
    if (!factualNotes) {
      return NextResponse.json({ error: "No factual data found" }, { status: 500 });
    }

    /* =====================================================
       STEP 2: CLEAN UI ARTICLE (JSON, NO WEB)
       ===================================================== */
    const articleResponse = await client.responses.create({
      model: "gpt-4.1-nano",
      input: `
You are a responsible news editor write news in very easy to understand language.

Using ONLY the verified notes below, write a
clean, cautious, UI-friendly news article.

IMPORTANT:
- DO NOT present unconfirmed events as facts
- Do NOT add new facts

UI RULES:
- Short paragraphs (2–3 sentences)
- Blank line between paragraphs
- Bullet points for facts
- Clear headings
- Professional, neutral tone

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
${factualNotes}
"""
`,
      max_output_tokens: 1200
    });

    let articleJson = safeJsonParse(articleResponse.output_text);

    /* =====================================================
       STEP 3: SAFE EXPANSION TO 500–700 WORDS (NO NEW FACTS)
       ===================================================== */
    let words = countWords(articleJson.article);

    if (words < 500) {
      const expandResponse = await client.responses.create({
        model: "gpt-4.1-nano",
        input: `
Expand the article below to BETWEEN 500 AND 700 WORDS. Write in very easy to understand language.
STRICT RULES:
- Do NOT add new facts
- Do NOT invent numbers or events
- Expand explanation, background, and implications ONLY
- Keep short paragraphs and bullets
- Maintain neutral tone

RETURN ONLY THE UPDATED ARTICLE TEXT.

ARTICLE:
"""
${articleJson.article}
"""
`,
        max_output_tokens: 1400
      });

      articleJson.article = expandResponse.output_text.trim();
      words = countWords(articleJson.article);
    }

    if (words < 500) {
      return NextResponse.json(
        { error: "Word count out of range", wordCount: words },
        { status: 500 }
      );
    }

    const articleHtml = convertToHtml(articleJson.article);

    // Extract excerpt from description or article
    const excerpt = articleJson.description || articleJson.article.substring(0, 200) + '...';

    /* =====================================================
       STEP 4: SUGGEST SUBREDDIT (ROUND-ROBIN)
       ===================================================== */
    const subreddits = [
      'r/delhi',
      'r/bangalore',
      'r/mumbai',
      'r/chennai',
      'r/hyderabad',
      'r/Kerala',
      'r/kolkata',
      'r/TamilNadu',
      'r/pune',
      'r/Maharashtra',
      'r/bihar',
      'r/ahmedabad',
      'r/lucknow',
      'r/Goa',
      'r/Uttarakhand',
      'r/assam',
      'r/gurgaon',
      'r/karnataka',
      'r/Rajasthan',
      'r/HimachalPradesh',
      'r/Chandigarh',
      'r/gujarat',
      'r/Odisha',
      'r/uttarpradesh',
      'r/Northeastindia',
      'r/indianews',
      'r/indiadiscussion'
    ];

    let suggestedSubreddit = null;
    try {
      // Get current tracking record
      const { data: trackingData } = await supabase
        .from('subreddit_tracking')
        .select('last_index')
        .eq('id', 1)
        .single();

      // Calculate next index (round-robin)
      const currentIndex = trackingData 
        ? ((trackingData.last_index + 1) % subreddits.length)
        : 0;

      // Get the next subreddit in round-robin
      suggestedSubreddit = subreddits[currentIndex];

      // Update the tracking record (upsert will create if doesn't exist)
      const { error: updateError } = await supabase
        .from('subreddit_tracking')
        .upsert({ id: 1, last_index: currentIndex }, { onConflict: 'id' });

      if (updateError) {
        console.error('Error updating subreddit tracking:', updateError);
        // Fallback to first subreddit if update fails
        suggestedSubreddit = subreddits[0];
      }
    } catch (subredditError) {
      console.error('Error in subreddit round-robin:', subredditError);
      // Fallback to first subreddit on error
      suggestedSubreddit = subreddits[0];
    }

    /* =====================================================
       SAVE TO DATABASE
       ===================================================== */
    try {
      const { data: savedArticle, error: dbError } = await getSupabaseAdmin()
        .from('articles')
        .insert({
          title: headline,
          content: sanitizeArticleHtml(articleHtml),
          excerpt: excerpt.substring(0, 500), // Limit excerpt length
          category,
          tags: [],
          featured_image_url: image_url,
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
        message: 'Article generated and saved successfully',
        data: {
          id: savedArticle.id,
          title: savedArticle.title,
          slug: savedArticle.slug,
          category: savedArticle.category,
          excerpt: savedArticle.excerpt,
          featured_image_url: savedArticle.featured_image_url,
          created_at: savedArticle.created_at,
          url: `/articles/${savedArticle.slug}`,
          suggested_subreddit: suggestedSubreddit
        },
        meta: {
          wordCount: words,
          verified: true,
          webSearchUsed: 1,
          stepsUsed: 4
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

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}