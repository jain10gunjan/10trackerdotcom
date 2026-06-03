-- =============================================================================
-- STEP 1 of 3 — Platform exams table only (no user_profiles / user_progress).
--
-- DEADLOCK AVOIDANCE:
--   • Close other SQL Editor tabs running migrations
--   • Pause npm run dev for 1–2 minutes (optional but helps)
--   • Run this file alone, wait until it succeeds
--   • Then run add_dashboard_profile_columns.sql
--   • Then run add_user_progress_updated_at.sql (or ensure_user_profiles if never run)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.platform_exams (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  icon TEXT,
  color_gradient TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_exams_active ON public.platform_exams (is_active, sort_order);

ALTER TABLE public.platform_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_exams_read ON public.platform_exams;
CREATE POLICY platform_exams_read ON public.platform_exams
  FOR SELECT USING (true);

DROP POLICY IF EXISTS platform_exams_admin_write ON public.platform_exams;
CREATE POLICY platform_exams_admin_write ON public.platform_exams
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT ON public.platform_exams TO anon, authenticated;
GRANT ALL ON public.platform_exams TO service_role;

INSERT INTO public.platform_exams (slug, name, description, category, image_url, icon, color_gradient, sort_order, is_active)
VALUES
  ('upsc-prelims', 'UPSC Prelims', 'Union Public Service Commission - Civil Services Prelims', 'Civil Services',
   'https://c.ndtvimg.com/upsc_625x300_1529562820916.jpg?downsize=773:435', '📚', 'from-orange-500 to-red-500', 10, true),
  ('general-aptitude', 'General Aptitude', 'Quantitative Aptitude and Verbal Ability', 'General',
   NULL, '📊', 'from-purple-500 to-pink-500', 20, true),
  ('gate-cse', 'GATE CSE', 'Graduate Aptitude Test - Computer Science', 'Engineering',
   'https://www.spinoneducation.com/wp-content/uploads/2022/02/Gate.webp', '💻', 'from-gray-500 to-cyan-500', 30, false),
  ('mht-cet', 'MHT-CET', 'Maharashtra Common Entrance Test', 'State Level',
   'https://images.careerindia.com/img/2022/04/mht-1611563405-1650630681.jpg', '🎓', 'from-teal-500 to-cyan-500', 40, false)
ON CONFLICT (slug) DO NOTHING;

-- Run NOTIFY only after all migration steps (see add_dashboard_profile_columns.sql)
