# Article Categories Update

This update changes the article categories to only include the following 6 categories:

1. **Categories** - General categories and topics
2. **Latest Jobs** - Latest job openings and opportunities  
3. **Exam Results** - Exam results and scorecards
4. **Answer Key** - Answer keys for various exams
5. **Admit Cards** - Admit cards and hall tickets
6. **News** - Latest news and updates

## Files Modified

1. `supabase/migrations/articles_setup.sql` - Updated default categories for new installations
2. `supabase/migrations/update_article_categories.sql` - Script to update existing database
3. `src/app/articles/[slug]/page.js` - Updated hardcoded category mappings

## How to Apply Changes

### For New Installations
Run the updated `supabase/migrations/articles_setup.sql` script in your Supabase SQL editor.

### For Existing Installations
Run the `supabase/migrations/update_article_categories.sql` script in your Supabase SQL editor. This will:
- Delete existing categories
- Insert the new 6 categories
- Update existing articles to map to appropriate new categories

## Category Mapping
Existing articles will be mapped as follows:
- `exam-preparation` → `categories`
- `study-materials` → `categories` 
- `success-stories` → `news`
- `career-guidance` → `latest-jobs`
- `technology` → `news`
- `general` → `categories`
- Any other categories → `categories`

## Testing
After running the SQL script, verify that:
1. Only the 6 new categories appear in the articles section
2. Existing articles are properly categorized
3. The article pages display the correct category names and colors
