/**
 * Cleans legacy CMS HTML that often ships with spacer divs, empty blocks,
 * and inline heights that create huge gaps on article detail pages.
 */
export function normalizeArticleContent(html) {
  if (!html || typeof html !== 'string') return '';

  let out = html
    // Drop empty block elements
    .replace(/<(p|div|span|section)[^>]*>\s*(?:&nbsp;|\u00a0|\s|<br\s*\/?>)*<\/\1>/gi, '')
    // Remove broken / placeholder images
    .replace(/<img[^>]*\ssrc=["'](?:#|about:blank|)["'][^>]*>/gi, '')
    // Strip tall inline height attributes (common paste artifact)
    .replace(/\sheight=["']\d{2,}["']/gi, '')
    // Strip tall min-height / height / margin from inline styles
    .replace(/\sstyle=(["'])([\s\S]*?)\1/gi, (match, quote, style) => {
      const cleaned = style
        .replace(/(?:^|;)\s*height\s*:\s*\d{3,}px\s*;?/gi, ';')
        .replace(/(?:^|;)\s*min-height\s*:\s*\d{3,}px\s*;?/gi, ';')
        .replace(/(?:^|;)\s*margin-(?:top|bottom)\s*:\s*\d{3,}px\s*;?/gi, ';')
        .replace(/(?:^|;)\s*padding-(?:top|bottom)\s*:\s*\d{3,}px\s*;?/gi, ';')
        .replace(/;+/g, ';')
        .replace(/^;|;$/g, '')
        .trim();
      return cleaned ? ` style=${quote}${cleaned}${quote}` : '';
    });

  // Collapse runs of 3+ line breaks
  out = out.replace(/(<br\s*\/?>\s*){3,}/gi, '<br />');

  return out.trim();
}
