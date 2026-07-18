-- Indexes for admin Review DB at ~100k+ rows (run once after filter RPC).
-- Safe to re-run (IF NOT EXISTS). Does not need re-run when data grows; Postgres uses indexes automatically.
-- After large bulk imports, run in SQL Editor: ANALYZE examtracker;

CREATE INDEX IF NOT EXISTS idx_examtracker_category
  ON public.examtracker (category);

CREATE INDEX IF NOT EXISTS idx_examtracker_category_subject
  ON public.examtracker (category, subject);

CREATE INDEX IF NOT EXISTS idx_examtracker_category_subject_chapter
  ON public.examtracker (category, subject, chapter);

-- Supports list sort: year desc, _id asc within a filter
CREATE INDEX IF NOT EXISTS idx_examtracker_cat_subj_ch_year_id
  ON public.examtracker (category, subject, chapter, year DESC NULLS LAST, _id);
