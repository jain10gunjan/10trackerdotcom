-- Add social media embed fields to articles table
-- Run this in Supabase SQL editor

ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS social_media_embeds JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_social_embeds ON articles USING GIN (social_media_embeds);

-- Example structure for social_media_embeds:
-- [
--   {
--     "type": "image",
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
--     "type": "video",
--     "url": "https://youtube.com/watch?v=...",
--     "embed_code": "<iframe>...</iframe>",
--     "caption": "Optional caption"
--   }
-- ]

