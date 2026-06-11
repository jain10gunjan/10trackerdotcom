import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { getCategoryVariants } from '@/lib/mockTestUtils';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { fetchExamSubjects } from '@/lib/examHub/fetchExamSubjects';
import { normalizeCategorySlug } from '@/lib/examHub/categoryKey';
import { getSubjectStats, slugifySubject } from '@/lib/examHub/examHubUtils';

function matchesArea(area, slug) {
  if (!area) return false;
  const variants = getCategoryVariants(slug).map((v) => v.toLowerCase());
  const a = String(area).trim().toLowerCase();
  return variants.includes(a) || a === normalizeCategorySlug(slug);
}

function subjectForTopic(topic, catalogSubjects) {
  if (!topic) return null;
  const match = catalogSubjects.find((s) =>
    s.subtopics?.some((t) => t.title === topic)
  );
  return match?.subject ?? null;
}

async function fetchProgressRows(supabase, email) {
  const base = supabase
    .from('user_progress')
    .select('area, topic, completedquestions, correctanswers, updated_at')
    .or(`user_id.eq.${email},email.eq.${email}`);

  const { data, error } = await base;
  if (!error) return data || [];

  if (error.code === '42703' || error.code === 'PGRST204') {
    const fallback = await supabase
      .from('user_progress')
      .select('area, topic, completedquestions, correctanswers')
      .or(`user_id.eq.${email},email.eq.${email}`);
    if (fallback.error) throw fallback.error;
    return fallback.data || [];
  }

  throw error;
}

export async function GET(_request, { params }) {
  try {
    const session = await auth();
    const email = normalizeEmail(session?.user?.email);
    if (!email) {
      return NextResponse.json({ success: true, subjects: [], continue: null, overallPercent: 0 });
    }

    const { slug: slugParam } = await params;
    const slug = normalizeCategorySlug(slugParam);
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Invalid exam' }, { status: 400 });
    }

    const supabase = getSupabaseServer(false);

    const [progressRows, catalogSubjects] = await Promise.all([
      fetchProgressRows(supabase, email),
      fetchExamSubjects(slug),
    ]);

    const relevant = (progressRows || []).filter((row) => matchesArea(row.area, slug));

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
      const completed = Array.isArray(row.completedquestions)
        ? row.completedquestions.length
        : 0;
      if (completed === 0) continue;

      const subjectKey = subjectForTopic(row.topic, catalogSubjects);
      if (!subjectKey || !subjectMap[subjectKey]) continue;

      subjectMap[subjectKey].completedQuestions += completed;

      const topicTotal = topicTotals[row.topic] || 0;
      if (topicTotal > 0 && completed >= topicTotal) {
        subjectMap[subjectKey].topicsCompleted += 1;
      }

      const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : 0;
      if (!continueCandidate || updatedAt > continueCandidate.updatedAt) {
        continueCandidate = {
          subject: subjectKey,
          subjectSlug: slugifySubject(subjectKey),
          topic: row.topic,
          topicSlug: String(row.topic || '').replace(/\s+/g, '-').toLowerCase(),
          updatedAt,
          href: `/${slug}/practice/${encodeURIComponent(row.topic)}`,
        };
      }
    }

    const subjects = Object.values(subjectMap).map((s) => ({
      ...s,
      percent:
        s.totalQuestions > 0
          ? Math.min(100, Math.round((s.completedQuestions / s.totalQuestions) * 100))
          : 0,
    }));

    const totalQuestions = subjects.reduce((n, s) => n + s.totalQuestions, 0);
    const completedQuestions = subjects.reduce((n, s) => n + s.completedQuestions, 0);
    const overallPercent =
      totalQuestions > 0 ? Math.min(100, Math.round((completedQuestions / totalQuestions) * 100)) : 0;

    return NextResponse.json({
      success: true,
      overallPercent,
      stats: {
        totalQuestions,
        completedQuestions,
        subjectsStarted: subjects.filter((s) => s.completedQuestions > 0).length,
      },
      subjects: subjects
        .filter((s) => s.completedQuestions > 0)
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 8),
      continue: continueCandidate
        ? {
            subject: continueCandidate.subject,
            subjectSlug: continueCandidate.subjectSlug,
            topic: continueCandidate.topic,
            href: continueCandidate.href,
          }
        : subjects.length
          ? {
              subject: catalogSubjects[0]?.subject,
              subjectSlug: slugifySubject(catalogSubjects[0]?.subject),
              topic: null,
              href: `/${slug}/${slugifySubject(catalogSubjects[0]?.subject)}`,
            }
          : null,
    });
  } catch (err) {
    console.error('GET /api/exam-hub/[slug]/progress', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load progress' },
      { status: 500 }
    );
  }
}
