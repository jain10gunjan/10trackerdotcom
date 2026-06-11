/** Helpers for GKToday admin UI. */

export function slugifyTitle(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseTagsInput(raw) {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function buildPublishPayload(form) {
  return {
    title: form.title?.trim(),
    slug: form.slug?.trim(),
    content: form.content,
    excerpt: form.excerpt?.trim() || form.description?.trim(),
    category: form.category?.trim() || "Current Affairs",
    image_url: form.imageUrl?.trim(),
    author_email: form.authorEmail?.trim() || "gunjan@10tracker.com",
    status: form.status || "published",
    tags: parseTagsInput(form.tags),
    is_featured: Boolean(form.isFeatured),
    view_count: 0,
    social_media_embeds: [],
    force: Boolean(form.force),
  };
}

export function formFromRewrite(rewritten, articleMeta = {}) {
  const slug =
    articleMeta.slug ||
    slugifyTitle(rewritten.title) ||
    slugifyTitle(articleMeta.url?.split("/").filter(Boolean).pop());

  return {
    sourceUrl: rewritten.sourceUrl || articleMeta.url || "",
    title: rewritten.title || "",
    slug,
    description: rewritten.description || "",
    excerpt: rewritten.excerpt || rewritten.description || "",
    imageUrl: rewritten.coverImage?.src || articleMeta.thumbnail?.src || "",
    category: "Current Affairs",
    tags: "current-affairs, news",
    status: "published",
    authorEmail: "gunjan@10tracker.com",
    content: rewritten.article || "",
    isFeatured: false,
    force: false,
  };
}
