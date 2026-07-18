-- Update published_articles view to include social_media_embeds
-- Run this in Supabase SQL editor

DROP VIEW IF EXISTS published_articles;

CREATE OR REPLACE VIEW published_articles AS
SELECT 
    a.id,
    a.title,
    a.slug,
    a.content,
    a.excerpt,
    a.category,
    a.tags,
    a.featured_image_url,
    a.author_email,
    a.status,
    a.is_featured,
    a.view_count,
    a.created_at,
    a.updated_at,
    a.social_media_embeds,
    ac.name as category_name,
    ac.color as category_color
FROM articles a
LEFT JOIN article_categories ac ON a.category = ac.slug
WHERE a.status = 'published'
ORDER BY a.is_featured DESC, a.created_at DESC;

