import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeEmail } from '@/lib/normalizeEmail';
import {
  getUserPremiumState,
  isSetupError,
  listActivePaths,
  normalizeSlug,
} from '@/features/og-trackers/lib/ogTrackerService';

function db() {
  return getSupabaseServer(isValidServiceRoleKey());
}

function isDemoPath(path) {
  const slug = String(path?.slug || '');
  const tags = Array.isArray(path?.tags) ? path.tags : [];
  return slug.startsWith('demo-') || tags.includes('demo');
}

/**
 * Public paths only — demos excluded for top-notch catalog UX.
 */
export async function listPublicPaths(email = null) {
  const catalog = await listActivePaths(email);
  if (catalog.setupRequired) return catalog;
  return {
    ...catalog,
    paths: (catalog.paths || []).filter((p) => !isDemoPath(p)),
  };
}

function mapExamRow(row, stats = {}) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || '',
    icon: row.icon || 'GraduationCap',
    sortOrder: row.sort_order,
    isFeatured: Boolean(row.is_featured),
    chapterCount: stats.chapterCount || 0,
    liveChapterCount: stats.liveChapterCount || 0,
    totalSteps: stats.totalSteps || 0,
    completedSteps: stats.completedSteps || 0,
    percent: stats.percent || 0,
  };
}

function mapChapterRow(row, path = null) {
  const total = path?.totalResources || 0;
  const completed = path?.completedResources || 0;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || '',
    icon: row.icon || 'BookOpen',
    sortOrder: row.sort_order,
    status: row.status || 'coming_soon',
    path: path
      ? {
          id: path.id,
          slug: path.slug,
          title: path.title,
          locked: path.locked,
          isPremium: path.isPremium,
          totalResources: total,
          completedResources: completed,
          percent: path.percent || 0,
        }
      : null,
  };
}

async function loadChapterPathStats(chapterIds, email) {
  if (!chapterIds.length) return { byChapter: {}, totals: {} };

  const supabase = db();
  const { data: paths, error } = await supabase
    .from('og_paths')
    .select('id, slug, title, description, category, tags, icon, sort_order, is_premium, is_active, chapter_id')
    .eq('is_active', true)
    .in('chapter_id', chapterIds);

  if (error) throw error;

  const publicPaths = (paths || []).filter((p) => !isDemoPath(p));
  const pathIds = publicPaths.map((p) => p.id);
  const resourceCounts = {};
  const completedCounts = {};
  const resourceIdsByPath = {};

  if (pathIds.length) {
    const { data: resources } = await supabase
      .from('og_resources')
      .select('id, path_id')
      .in('path_id', pathIds);

    for (const r of resources || []) {
      resourceCounts[r.path_id] = (resourceCounts[r.path_id] || 0) + 1;
      if (!resourceIdsByPath[r.path_id]) resourceIdsByPath[r.path_id] = [];
      resourceIdsByPath[r.path_id].push(r.id);
    }

    const userEmail = normalizeEmail(email);
    if (userEmail) {
      const allResourceIds = (resources || []).map((r) => r.id);
      if (allResourceIds.length) {
        const { data: progress } = await supabase
          .from('og_progress')
          .select('resource_id')
          .eq('user_email', userEmail)
          .eq('status', 'COMPLETED')
          .in('resource_id', allResourceIds);

        const completedSet = new Set((progress || []).map((p) => p.resource_id));
        for (const [pathId, ids] of Object.entries(resourceIdsByPath)) {
          completedCounts[pathId] = ids.filter((id) => completedSet.has(id)).length;
        }
      }
    }
  }

  const { isPremium } = await getUserPremiumState(email);
  const byChapter = {};

  for (const p of publicPaths) {
    const total = resourceCounts[p.id] || 0;
    const completed = completedCounts[p.id] || 0;
    const mapped = {
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      category: p.category || 'General',
      tags: Array.isArray(p.tags) ? p.tags : [],
      icon: p.icon || 'Map',
      isPremium: Boolean(p.is_premium),
      locked: Boolean(p.is_premium) && !isPremium,
      totalResources: total,
      completedResources: completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      chapterId: p.chapter_id,
    };
    // One primary path per chapter (lowest sort / first)
    if (!byChapter[p.chapter_id]) byChapter[p.chapter_id] = mapped;
  }

  return { byChapter, isPremium };
}

/**
 * Exam hub listing. Falls back to category-derived cards if hierarchy tables missing.
 */
export async function listExamHub(email = null) {
  const supabase = db();
  const { isPremium } = await getUserPremiumState(email);

  const { data: exams, error } = await supabase
    .from('og_exams')
    .select('id, slug, title, description, icon, sort_order, is_featured, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    if (isSetupError(error)) {
      return listExamHubFallback(email);
    }
    throw error;
  }

  if (!exams?.length) {
    return listExamHubFallback(email);
  }

  const examIds = exams.map((e) => e.id);
  const { data: chapters, error: chErr } = await supabase
    .from('og_chapters')
    .select('id, exam_id, slug, title, status, is_active, sort_order')
    .eq('is_active', true)
    .in('exam_id', examIds);

  if (chErr) throw chErr;

  const chapterIds = (chapters || []).map((c) => c.id);
  const { byChapter } = await loadChapterPathStats(chapterIds, email);

  const chaptersByExam = {};
  for (const c of chapters || []) {
    if (!chaptersByExam[c.exam_id]) chaptersByExam[c.exam_id] = [];
    chaptersByExam[c.exam_id].push(c);
  }

  const hubExams = exams.map((exam) => {
    const list = chaptersByExam[exam.id] || [];
    let totalSteps = 0;
    let completedSteps = 0;
    let liveChapterCount = 0;

    for (const c of list) {
      if (c.status === 'live') liveChapterCount += 1;
      const path = byChapter[c.id];
      if (path) {
        totalSteps += path.totalResources || 0;
        completedSteps += path.completedResources || 0;
      }
    }

    return mapExamRow(exam, {
      chapterCount: list.length,
      liveChapterCount,
      totalSteps,
      completedSteps,
      percent: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
    });
  });

  return {
    exams: hubExams,
    hierarchyReady: true,
    setupRequired: false,
    isPremium,
  };
}

async function listExamHubFallback(email) {
  const catalog = await listPublicPaths(email);
  if (catalog.setupRequired) {
    return {
      exams: [],
      hierarchyReady: false,
      setupRequired: true,
      isPremium: catalog.isPremium,
      error: catalog.error,
    };
  }

  const byCategory = new Map();
  for (const p of catalog.paths || []) {
    const key = p.category || 'General';
    if (!byCategory.has(key)) {
      byCategory.set(key, {
        title: key,
        slug: normalizeSlug(key) || 'general',
        paths: [],
      });
    }
    byCategory.get(key).paths.push(p);
  }

  const exams = Array.from(byCategory.values()).map((group, i) => {
    const totalSteps = group.paths.reduce((s, p) => s + (p.totalResources || 0), 0);
    const completedSteps = group.paths.reduce((s, p) => s + (p.completedResources || 0), 0);
    return {
      id: group.slug,
      slug: group.slug,
      title: group.title,
      description: `${group.paths.length} tracker${group.paths.length === 1 ? '' : 's'}`,
      icon: 'Map',
      sortOrder: i,
      isFeatured: i === 0,
      chapterCount: group.paths.length,
      liveChapterCount: group.paths.length,
      totalSteps,
      completedSteps,
      percent: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      legacy: true,
    };
  });

  return {
    exams,
    hierarchyReady: false,
    setupRequired: false,
    isPremium: catalog.isPremium,
  };
}

/**
 * Single exam with chapters + linked trackers.
 */
export async function getExamBySlug(examSlug, email = null) {
  const slug = normalizeSlug(examSlug);
  const supabase = db();
  const { isPremium } = await getUserPremiumState(email);

  const { data: exam, error } = await supabase
    .from('og_exams')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    if (isSetupError(error)) {
      return getExamBySlugFallback(slug, email);
    }
    throw error;
  }

  if (!exam) {
    return getExamBySlugFallback(slug, email);
  }

  const { data: chapters, error: chErr } = await supabase
    .from('og_chapters')
    .select('*')
    .eq('exam_id', exam.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (chErr) throw chErr;

  const chapterIds = (chapters || []).map((c) => c.id);
  const { byChapter } = await loadChapterPathStats(chapterIds, email);

  const mappedChapters = (chapters || []).map((c) => mapChapterRow(c, byChapter[c.id] || null));

  let totalSteps = 0;
  let completedSteps = 0;
  for (const c of mappedChapters) {
    if (c.path) {
      totalSteps += c.path.totalResources || 0;
      completedSteps += c.path.completedResources || 0;
    }
  }

  return {
    exam: {
      ...mapExamRow(exam, {
        chapterCount: mappedChapters.length,
        liveChapterCount: mappedChapters.filter((c) => c.status === 'live').length,
        totalSteps,
        completedSteps,
        percent: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      }),
    },
    chapters: mappedChapters,
    hierarchyReady: true,
    setupRequired: false,
    isPremium,
  };
}

async function getExamBySlugFallback(slug, email) {
  const catalog = await listPublicPaths(email);
  if (catalog.setupRequired) {
    return { exam: null, chapters: [], hierarchyReady: false, setupRequired: true, isPremium: catalog.isPremium };
  }

  const paths = (catalog.paths || []).filter(
    (p) => normalizeSlug(p.category) === slug || normalizeSlug(p.category) === slug
  );

  if (!paths.length) {
    return { exam: null, chapters: [], hierarchyReady: false, setupRequired: false, isPremium: catalog.isPremium };
  }

  const title = paths[0].category || slug;
  const totalSteps = paths.reduce((s, p) => s + (p.totalResources || 0), 0);
  const completedSteps = paths.reduce((s, p) => s + (p.completedResources || 0), 0);

  return {
    exam: {
      id: slug,
      slug,
      title,
      description: 'Trackers in this category',
      icon: 'Map',
      sortOrder: 0,
      isFeatured: false,
      chapterCount: paths.length,
      liveChapterCount: paths.length,
      totalSteps,
      completedSteps,
      percent: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      legacy: true,
    },
    chapters: paths.map((p, i) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description || '',
      icon: p.icon || 'BookOpen',
      sortOrder: i,
      status: 'live',
      path: {
        id: p.id,
        slug: p.slug,
        title: p.title,
        locked: p.locked,
        isPremium: p.isPremium,
        totalResources: p.totalResources,
        completedResources: p.completedResources,
        percent: p.percent,
      },
    })),
    hierarchyReady: false,
    setupRequired: false,
    isPremium: catalog.isPremium,
  };
}
