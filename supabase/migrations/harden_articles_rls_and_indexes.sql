-- Harden articles: RLS, composite indexes, FTS, Reddit outbox
-- Run in Supabase SQL editor after reviewing.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- Composite indexes for list/filter sorts
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_articles_status_created_at
  ON articles (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_status_category_created_at
  ON articles (status, category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_status_featured_created_at
  ON articles (status, is_featured DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_title_trgm
  ON articles USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_articles_excerpt_trgm
  ON articles USING gin (excerpt gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Full-text search vector
-- ---------------------------------------------------------------------------
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE articles
SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS idx_articles_search_vector
  ON articles USING gin (search_vector);

CREATE OR REPLACE FUNCTION articles_search_vector_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.excerpt, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_articles_search_vector ON articles;
CREATE TRIGGER trg_articles_search_vector
  BEFORE INSERT OR UPDATE OF title, excerpt ON articles
  FOR EACH ROW
  EXECUTE PROCEDURE articles_search_vector_trigger();

-- ---------------------------------------------------------------------------
-- Refresh published_articles view (include search_vector + caption if present)
-- ---------------------------------------------------------------------------
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
    a.search_vector,
    ac.name AS category_name,
    ac.color AS category_color
FROM articles a
LEFT JOIN article_categories ac ON a.category = ac.slug
WHERE a.status = 'published';

-- Optional: if you have featured_image_caption on articles, recreate the view to include it.

-- ---------------------------------------------------------------------------
-- Tighten RLS: categories no longer world-writable
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin can manage categories" ON article_categories;
DROP POLICY IF EXISTS "Anyone can read categories" ON article_categories;

CREATE POLICY "Anyone can read categories"
  ON article_categories
  FOR SELECT
  USING (true);

-- Writes go through service role (bypasses RLS) from Next.js admin APIs.
-- No INSERT/UPDATE/DELETE policy for anon/authenticated = deny by default.

DROP POLICY IF EXISTS "Admin can manage articles" ON articles;
DROP POLICY IF EXISTS "Anyone can read published articles" ON articles;

CREATE POLICY "Anyone can read published articles"
  ON articles
  FOR SELECT
  USING (status = 'published');

-- No broad FOR ALL policy. Mutations use SUPABASE_SERVICE_ROLE_KEY from the app.

-- ---------------------------------------------------------------------------
-- Reddit / SteinHQ durable outbox
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_reddit_outbox (
  id BIGSERIAL PRIMARY KEY,
  article_id BIGINT REFERENCES articles(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_article_reddit_outbox_status_created
  ON article_reddit_outbox (status, created_at ASC);

ALTER TABLE article_reddit_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages outbox" ON article_reddit_outbox;
-- No public policies: only service role bypasses RLS.

COMMENT ON TABLE article_reddit_outbox IS
  'Durable queue for SteinHQ/Reddit posts. Drain via POST /api/articles/outbox/drain';
