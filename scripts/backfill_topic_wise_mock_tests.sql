-- Optional: tag existing topic-wise mock tests so they appear under the Topic-wise tab.
-- Run in Supabase SQL Editor. Adjust the WHERE clause to match your tests.

UPDATE public.mock_tests
SET
  description = COALESCE(NULLIF(TRIM(description), ''), 'Topic-wise test'),
  creation_mode = COALESCE(creation_mode, 'topic_auto'),
  name = CASE
    WHEN name ILIKE '%topic test%' THEN name
    WHEN TRIM(COALESCE(description, '')) ILIKE 'topic-wise test:%' THEN
      TRIM(SUBSTRING(description FROM 'Topic-wise test:\s*(.*)')) || ' Topic Test'
    ELSE name
  END
WHERE
  is_active = true
  AND (
    description ILIKE 'topic-wise test%'
    OR name ILIKE '%topic test%'
    OR creation_mode = 'topic_auto'
  );
