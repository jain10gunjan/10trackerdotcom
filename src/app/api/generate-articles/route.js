  import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ---------------- helpers ----------------
const countWords = (text = "") =>
  text.trim().split(/\s+/).length;

const safeJsonParse = (text) => {
  try {
    return JSON.parse(
      text.replace(/```json/gi, "").replace(/```/g, "").trim()
    );
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON from model");
    return JSON.parse(match[0]);
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
    
    // Check if it's a bullet list
    const hasBullets = lines.some(line => line.match(/^-\s/));
    
    if (hasBullets) {
      // Convert bullet list to HTML
      html += `<ul>`;
      lines.forEach(line => {
        const bulletMatch = line.match(/^-\s*(.+)$/);
        if (bulletMatch) {
          const itemText = bulletMatch[1].trim();
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
    const { headline } = await req.json();
    if (!headline) {
      return NextResponse.json({ error: "Headline is required" }, { status: 400 });
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

    /* =====================================================
       FINAL RESPONSE
       ===================================================== */
    return NextResponse.json({
      success: true,
      data: {
        title: articleJson.title,
        description: articleJson.description,
        article: articleJson.article,
        articleHtml
      },
      meta: {
        wordCount: words,
        verified: true,
        webSearchUsed: 1,
        stepsUsed: 3
      },
      cost: {
        realistic_range_inr: "₹0.18 – ₹0.25 per article"
      }
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const authResult = await verifyAdminOrAutomationSecret(request);
  if (!authResult.ok) {
    return forbiddenArticlesWriteResponse(authResult.error);
  }
  return NextResponse.json({
    message: "POST a headline to generate a verified news article",
    example: { headline: "Netflix and Warner Bros acquisition news" }
  });
}