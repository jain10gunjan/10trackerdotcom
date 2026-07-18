/**
 * Shared utilities for article generation APIs
 */

// Constants
export const WORD_COUNT_MIN = 500;
export const WORD_COUNT_MAX = 700;
export const MAX_EXCERPT_LENGTH = 500;
export const MAX_EXPANSION_ATTEMPTS = 3;

/**
 * Count words in a text string
 * @param {string} text - Text to count words in
 * @returns {number} Word count
 */
export const countWords = (text = "") => {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Safely parse JSON from potentially malformed model output
 * @param {string} text - Text containing JSON
 * @returns {object} Parsed JSON object
 * @throws {Error} If JSON cannot be parsed
 */
export const safeJsonParse = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }

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

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export const escapeHtml = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, m =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[m])
  );
};

/**
 * Process inline formatting (bold text) and escape HTML
 * @param {string} text - Text to process
 * @returns {string} Processed HTML string
 */
export const processInlineFormatting = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  // Convert **text** to <strong>text</strong>
  let processed = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Escape HTML to prevent XSS
  processed = escapeHtml(processed);
  // Re-apply strong tags (since escapeHtml would have escaped them)
  processed = processed.replace(/&lt;strong&gt;(.+?)&lt;\/strong&gt;/g, '<strong>$1</strong>');
  return processed;
};

/**
 * Convert markdown article text to HTML
 * @param {string} article - Markdown article text
 * @returns {string} HTML formatted article
 */
export const convertToHtml = (article) => {
  if (!article || typeof article !== 'string') return "";
  
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

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validate headline
 * @param {string} headline - Headline to validate
 * @returns {object} { valid: boolean, error?: string }
 */
export const validateHeadline = (headline) => {
  if (!headline || typeof headline !== 'string') {
    return { valid: false, error: 'Headline must be a non-empty string' };
  }
  
  const trimmed = headline.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Headline cannot be empty' };
  }
  
  if (trimmed.length > 500) {
    return { valid: false, error: 'Headline must be 500 characters or less' };
  }
  
  return { valid: true };
};

/**
 * Validate category
 * @param {string} category - Category to validate
 * @returns {object} { valid: boolean, error?: string }
 */
export const validateCategory = (category) => {
  if (!category || typeof category !== 'string') {
    return { valid: false, error: 'Category must be a non-empty string' };
  }
  
  const trimmed = category.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Category cannot be empty' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Category must be 100 characters or less' };
  }
  
  return { valid: true };
};
