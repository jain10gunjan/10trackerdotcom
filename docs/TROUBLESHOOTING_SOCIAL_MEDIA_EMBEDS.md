# Troubleshooting Social Media Embeds

## Issue: Embeds not showing on UI

### Step 1: Verify Database Setup
Run this SQL in Supabase to ensure the view includes the field:

```sql
-- Update published_articles view to include social_media_embeds
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
    a.social_media_embeds,  -- This field must be included
    ac.name as category_name,
    ac.color as category_color
FROM articles a
LEFT JOIN article_categories ac ON a.category = ac.slug
WHERE a.status = 'published'
ORDER BY a.is_featured DESC, a.created_at DESC;
```

### Step 2: Add Embeds to Article
1. Go to `/admin/articles`
2. Click "Edit" on any article
3. Scroll to "Social Media Embeds" section
4. Click "Add Embed"
5. Fill in:
   - Type: (Instagram, Reel, YouTube, Video, or Image)
   - URL: (e.g., `https://instagram.com/p/...`)
   - OR Embed Code: (HTML iframe code)
   - Caption: (Optional)
6. Click "Add Embed"
7. Click "Update Article"

### Step 3: Check Console Logs
Open browser console (F12) and look for:
- `🔍 Article Data:` - Shows what data is being received
- `✅ Rendering embeds:` - Shows embeds being rendered
- `❌ No embeds to display` - Means array is empty

### Step 4: Verify Data in Database
Check if embeds are saved:
```sql
SELECT id, title, social_media_embeds 
FROM articles 
WHERE id = YOUR_ARTICLE_ID;
```

Should show something like:
```json
[
  {
    "type": "instagram",
    "url": "https://instagram.com/p/...",
    "embed_code": "<iframe>...</iframe>",
    "caption": "Optional caption"
  }
]
```

### Common Issues:

1. **Empty Array `[]`**: 
   - Solution: Add embeds via admin panel

2. **Field Missing from View**:
   - Solution: Run the SQL script above

3. **Component Not Rendering**:
   - Check browser console for errors
   - Verify `SocialMediaEmbed.jsx` exists in `src/components/`

4. **Data Not Saving**:
   - Check admin panel form submission
   - Verify API route is saving `social_media_embeds` field

### Test with Sample Data:
You can manually add test data in Supabase:
```sql
UPDATE articles 
SET social_media_embeds = '[
  {
    "type": "youtube",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "embed_code": "<iframe width=\"560\" height=\"315\" src=\"https://www.youtube.com/embed/dQw4w9WgXcQ\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>",
    "caption": "Test YouTube Video"
  }
]'::jsonb
WHERE id = YOUR_ARTICLE_ID;
```

Then refresh the article page to see if it displays.

