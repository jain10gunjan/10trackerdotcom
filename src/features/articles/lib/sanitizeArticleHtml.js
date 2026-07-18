import sanitizeHtml from 'sanitize-html';

const ARTICLE_ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'br',
  'hr',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'strike',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'a',
  'img',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'span',
  'div',
  'section',
  'article',
  'sup',
  'sub',
];

const ARTICLE_ALLOWED_ATTRIBUTES = {
  a: ['href', 'name', 'target', 'rel', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
  '*': ['class', 'id'],
};

const ARTICLE_ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel'];

/** Sanitize article body HTML before persist or render. */
export function sanitizeArticleHtml(html) {
  if (!html) return '';
  try {
    return sanitizeHtml(String(html), {
      allowedTags: ARTICLE_ALLOWED_TAGS,
      allowedAttributes: ARTICLE_ALLOWED_ATTRIBUTES,
      allowedSchemes: ARTICLE_ALLOWED_SCHEMES,
      allowProtocolRelative: false,
      transformTags: {
        a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
      },
    });
  } catch (error) {
    console.error('[articles] sanitizeArticleHtml failed', error);
    return '';
  }
}

const EMBED_ALLOWED_TAGS = [...ARTICLE_ALLOWED_TAGS, 'iframe', 'blockquote'];
const EMBED_ALLOWED_ATTRIBUTES = {
  ...ARTICLE_ALLOWED_ATTRIBUTES,
  iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'loading', 'title'],
  blockquote: ['class', 'data-*'],
};

/** Sanitize third-party embed HTML (allows iframe from known hosts). */
export function sanitizeEmbedHtml(html) {
  if (!html) return '';
  try {
    return sanitizeHtml(String(html), {
      allowedTags: EMBED_ALLOWED_TAGS,
      allowedAttributes: EMBED_ALLOWED_ATTRIBUTES,
      allowedSchemes: ARTICLE_ALLOWED_SCHEMES,
      allowProtocolRelative: false,
      allowedIframeHostnames: [
        'www.youtube.com',
        'youtube.com',
        'www.youtube-nocookie.com',
        'player.vimeo.com',
        'platform.twitter.com',
        'www.instagram.com',
      ],
    });
  } catch (error) {
    console.error('[articles] sanitizeEmbedHtml failed', error);
    return '';
  }
}
