-- Add social media embeds to existing articles table
-- Run this in Supabase SQL editor

-- Step 1: Add social_media_embeds column to existing articles table
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS social_media_embeds JSONB DEFAULT '[]'::jsonb;

-- Step 2: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_social_embeds ON articles USING GIN (social_media_embeds);

-- Step 3: Update published_articles view to include social_media_embeds
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
    a.social_media_embeds,  -- Added this field
    ac.name as category_name,
    ac.color as category_color
FROM articles a
LEFT JOIN article_categories ac ON a.category = ac.slug
WHERE a.status = 'published'
ORDER BY a.is_featured DESC, a.created_at DESC;

-- Done! Now you can use social_media_embeds in your articles
-- Example data structure:
-- [
--   {
--     "type": "instagram",
--     "url": "https://instagram.com/p/...",
--     "embed_code": "<iframe>...</iframe>",
--     "caption": "Optional caption"
--   },
--   {
--     "type": "reel",
--     "url": "https://instagram.com/reel/...",
--     "embed_code": "<iframe>...</iframe>",
--     "caption": "Optional caption"
--   },
--   {
--     "type": "youtube",
--     "url": "https://youtube.com/watch?v=...",
--     "embed_code": "<iframe>...</iframe>",
--     "caption": "Optional caption"
--   }
-- ]

