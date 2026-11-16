import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeCategorySlug } from '@/features/exam-hub/lib/categoryKey';
import { getSubjectStats, slugifySubject, resolveChapterPracticeHref } from '@/features/exam-hub/lib/examHubUtils';
import { fetchExamSubjects } from '@/features/exam-hub/lib/fetchExamSubjects';
import { applyProgressUserFilter, parseProgressIdArray } from '@/lib/progressIdentity';
import { practiceAreaMatchesSlug } from '@/lib/examProfile';

function matchesArea(area, slug) {
  return practiceAreaMatchesSlug(area, slug);
}

function subjectForTopic(topic, catalogSubjects) {
  if (!topic) return null;
  const match = catalogSubjects.find((s) =>
    s.subtopics?.some((t) => t.title === topic)
  );
  return match?.subject ?? null;
}

function completedCount(row) {
  return parseProgressIdArray(row?.completedquestions).length;
}

function progressAreaVariants(examSlug) {
  const slug = normalizeCategorySlug(examSlug);
  if (!slug) return [];
  const variants = new Set([slug]);
  for (const v of getCategoryVariants(slug) || []) {
    const n = normalizeCategorySlug(v);
    if (n) variants.add(n);
    if (v) variants.add(String(v).trim());
  }
  return [...variants].filter(Boolean);
}

async function fetchProgressRowsWithClient(supabase, user, { examSlug = '', limit = 0 } = {}) {
  const areaVariants = progressAreaVariants(examSlug);

  let query = supabase
    .from('user_progress')
    .select(
      'area, topic, completedquestions, correctanswers, points, updated_at, created_at'
    )
    .not('area', 'is', null);

  query = applyProgressUserFilter(query, user);
  if (areaVariants.length) {
    query = query.in('area', areaVariants);
  }
  if (limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (!error) return data || [];

  if (error.code === '42703' || error.code === 'PGRST204') {
    let fallbackQuery = supabase
      .from('user_progress')
      .select('area, topic, completedquestions, correctanswers, points')
      .not('area', 'is', null);
    fallbackQuery = applyProgressUserFilter(fallbackQuery, user);
    if (areaVariants.length) {
      fallbackQuery = fallbackQuery.in('area', areaVariants);
    }
    if (limit > 0) {
      fallbackQuery = fallbackQuery.limit(limit);
    }
    const fallback = await fallbackQuery;
    if (fallback.error) throw fallback.error;
    return fallback.data || [];
  }

  throw error;
}

/**
 * Fetch user_progress — service role first, then anon (same as /api/exam-hub).
 * Pass examSlug to scope rows to the selected exam (home dashboard path).
 */
export async function fetchUserProgressRowsForDashboard(
  user,
  { examSlug = '', limit = 80, serviceOnly = false } = {}
) {
  const serviceClient = getSupabaseServer(isValidServiceRoleKey());
  let rows = await fetchProgressRowsWithClient(serviceClient, user, { examSlug, limit });

  if (!rows.length && !serviceOnly) {
    const anonClient = getSupabaseServer(false);
    rows = await fetchProgressRowsWithClient(anonClient, user, { examSlug, limit });
  }

  return rows.sort((a, b) => {
    const ta = new Date(a.updated_at || a.created_at || 0).getTime();
    const tb = new Date(b.updated_at || b.created_at || 0).getTime();
    return tb - ta;
  });
}

/**
 * Continue payload for an exam hub page — identical to GET /api/exam-hub/[slug]/progress.
 */
export function resolveExamHubContinue(progressRows, slug, catalogSubjects = []) {
  const normalizedSlug = normalizeCategorySlug(slug);
  if (!normalizedSlug) return null;

  const relevant = (progressRows || []).filter((row) => matchesArea(row.area, normalizedSlug));

  const topicTotals = {};
  for (const sub of catalogSubjects) {
    for (const t of sub.subtopics || []) {
      topicTotals[t.title] = (topicTotals[t.title] || 0) + (t.count || 0);
    }
  }

  const subjectMap = {};
  for (const sub of catalogSubjects) {
    const key = sub.subject;
    const { questionsCount } = getSubjectStats(sub);
    subjectMap[key] = {
      name: key,
      slug: slugifySubject(key),
      totalQuestions: questionsCount,
      completedQuestions: 0,
      topicCount: sub.subtopics?.length || 0,
      topicsCompleted: 0,
    };
  }

  let continueCandidate = null;

  for (const row of relevant) {
    const completed = completedCount(row);
    if (completed === 0) continue;

    const subjectKey = subjectForTopic(row.topic, catalogSubjects);
    const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : 0;

    if (subjectKey && subjectMap[subjectKey]) {
      subjectMap[subjectKey].completedQuestions += completed;
      const topicTotal = topicTotals[row.topic] || 0;
      if (topicTotal > 0 && completed >= topicTotal) {
        subjectMap[subjectKey].topicsCompleted += 1;
      }
    }

    // Prefer chapter href when catalog is warm; otherwise topic practice URL (no scan required).
    const href = catalogSubjects.length
      ? resolveChapterPracticeHref(normalizedSlug, row.topic, catalogSubjects)
      : `/${normalizedSlug}/practice/${encodeURIComponent(row.topic)}`;

    if (!continueCandidate || updatedAt > continueCandidate.updatedAt) {
      continueCandidate = {
        subject: subjectKey || row.topic,
        subjectSlug: subjectKey ? slugifySubject(subjectKey) : null,
        topic: row.topic,
        href,
        updatedAt,
      };
    }
  }

  if (continueCandidate) {
    return {
      subject: continueCandidate.subjectSlug,
      topic: continueCandidate.topic,
      href: continueCandidate.href,
      hasProgress: true,
    };
  }

  if (catalogSubjects.length > 0) {
    const first = catalogSubjects[0];
    return {
      subject: slugifySubject(first.subject),
      topic: null,
      href: `/${normalizedSlug}/${slugifySubject(first.subject)}`,
      hasProgress: false,
    };
  }

  return {
    subject: null,
    topic: null,
    href: `/${normalizedSlug}`,
    hasProgress: false,
  };
}

export function examHubContinueToPracticeCard(continuePayload) {
  if (!continuePayload?.href) return null;

  return {
    subject: continuePayload.subject,
    topic: continuePayload.topic,
    href: continuePayload.href,
    description: continuePayload.topic
      ? 'Continue your last practice session for this exam.'
      : 'Continue your last practice session for this exam.',
  };
}

export async function getExamHubContinueForUser(user, examSlug) {
  const slug = normalizeCategorySlug(examSlug);
  if (!slug) return null;

  const [progressRows, catalogSubjects] = await Promise.all([
    fetchUserProgressRowsForDashboard(user),
    fetchExamSubjects(slug),
  ]);

  return resolveExamHubContinue(progressRows, slug, catalogSubjects);
}

/** @deprecated use matchesArea via practiceAreaMatchesSlug */
export function examHubMatchesArea(area, slug) {
  const variants = getCategoryVariants(slug).map((v) => v.toLowerCase());
  const a = String(area || '').trim().toLowerCase();
  return variants.includes(a) || a === normalizeCategorySlug(slug);
}
