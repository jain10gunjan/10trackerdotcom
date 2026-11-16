-- OG Trackers hierarchy: Exam → Chapter → Path
-- Run in Supabase SQL Editor. Safe to re-run.
-- YouTube / resource content can be attached later via og_resources on linked paths.

-- ── Exams ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.og_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'GraduationCap',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_og_exams_active_sort
  ON public.og_exams (is_active, sort_order);

-- ── Chapters ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.og_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.og_exams(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'coming_soon'
    CHECK (status IN ('live', 'coming_soon', 'draft')),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exam_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_og_chapters_exam_sort
  ON public.og_chapters (exam_id, is_active, sort_order);

-- ── Link paths → chapters ──────────────────────────────────────────────────
ALTER TABLE public.og_paths
  ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.og_chapters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_og_paths_chapter
  ON public.og_paths (chapter_id)
  WHERE chapter_id IS NOT NULL;

-- ── Seed: GATE CSE + chapters ──────────────────────────────────────────────
INSERT INTO public.og_exams (slug, title, description, icon, sort_order, is_featured, is_active)
VALUES (
  'gate-cse',
  'GATE CSE',
  'Chapter-wise trackers for GATE Computer Science — watch, practice, mock, repeat.',
  'Cpu',
  10,
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO public.og_exams (slug, title, description, icon, sort_order, is_featured, is_active)
VALUES
  (
    'dsa',
    'DSA',
    'Data Structures & Algorithms paths for interviews and fundamentals.',
    'Code2',
    20,
    false,
    true
  ),
  (
    'placement',
    'Placement',
    'Interview-ready study loops — aptitude, coding, and company patterns.',
    'Briefcase',
    30,
    false,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- GATE CSE chapters (content / YouTube can be filled later)
WITH exam AS (
  SELECT id FROM public.og_exams WHERE slug = 'gate-cse' LIMIT 1
)
INSERT INTO public.og_chapters (exam_id, slug, title, description, icon, sort_order, status, is_active)
SELECT exam.id, v.slug, v.title, v.description, v.icon, v.sort_order, v.status, true
FROM exam
CROSS JOIN (
  VALUES
    ('discrete-mathematics', 'Discrete Mathematics', 'Sets, logic, graphs, combinatorics — full watch → practice → mock loop.', 'Brain', 10, 'live'),
    ('digital-logic', 'Digital Logic', 'Boolean algebra, circuits, number systems.', 'Cpu', 20, 'coming_soon'),
    ('computer-organization', 'Computer Organization', 'Architecture, memory, pipelining.', 'Server', 30, 'coming_soon'),
    ('programming-ds', 'Programming & Data Structures', 'C/C++ fundamentals and core DS for GATE.', 'Code2', 40, 'coming_soon'),
    ('algorithms', 'Algorithms', 'Complexity, sorting, graphs, DP.', 'Layers', 50, 'coming_soon'),
    ('theory-of-computation', 'Theory of Computation', 'Automata, grammars, decidability.', 'BookOpen', 60, 'coming_soon'),
    ('compiler-design', 'Compiler Design', 'Lexing, parsing, optimization.', 'FileCode', 70, 'coming_soon'),
    ('operating-systems', 'Operating Systems', 'Processes, scheduling, memory, sync.', 'Terminal', 80, 'coming_soon'),
    ('databases', 'Databases', 'ER, SQL, normalization, transactions.', 'Database', 90, 'coming_soon'),
    ('computer-networks', 'Computer Networks', 'OSI/TCP-IP, routing, reliability.', 'Globe', 100, 'coming_soon')
) AS v(slug, title, description, icon, sort_order, status)
ON CONFLICT (exam_id, slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Attach existing Discrete Math path to its chapter
UPDATE public.og_paths p
SET
  chapter_id = c.id,
  category = 'GATE CSE',
  updated_at = NOW()
FROM public.og_chapters c
JOIN public.og_exams e ON e.id = c.exam_id
WHERE p.slug = 'gate-cse-discrete-mathematics'
  AND e.slug = 'gate-cse'
  AND c.slug = 'discrete-mathematics';

-- Hide demo paths from public catalog (keep rows for admin/dev)
UPDATE public.og_paths
SET is_active = false, updated_at = NOW()
WHERE slug IN ('demo-dsa-youtube', 'demo-study-path')
   OR ('demo' = ANY (tags));
