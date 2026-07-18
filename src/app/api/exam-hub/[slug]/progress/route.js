import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { fetchExamSubjects } from '@/features/exam-hub/lib/fetchExamSubjects';
import { normalizeCategorySlug } from '@/features/exam-hub/lib/categoryKey';
import { getSubjectStats, slugifySubject } from '@/features/exam-hub/lib/examHubUtils';
import {
  fetchUserProgressRowsForDashboard,
  resolveExamHubContinue,
} from '@/features/exam-hub/lib/examHubProgress';
import { parseProgressIdArray } from '@/lib/progressIdentity';
import { practiceAreaMatchesSlug } from '@/lib/examProfile';

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

    const user = { email, authId: session.user?.id };
    const [progressRows, catalogSubjects] = await Promise.all([
      fetchUserProgressRowsForDashboard(user),
      fetchExamSubjects(slug),
    ]);

    const relevant = (progressRows || []).filter((row) => practiceAreaMatchesSlug(row.area, slug));

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

    for (const row of relevant) {
      const completed = parseProgressIdArray(row.completedquestions).length;
      if (completed === 0) continue;

      const subjectKey = catalogSubjects.find((s) =>
        s.subtopics?.some((t) => t.title === row.topic)
      )?.subject;
      if (!subjectKey || !subjectMap[subjectKey]) continue;

      subjectMap[subjectKey].completedQuestions += completed;

      const topicTotal = topicTotals[row.topic] || 0;
      if (topicTotal > 0 && completed >= topicTotal) {
        subjectMap[subjectKey].topicsCompleted += 1;
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

    const continueResolved = resolveExamHubContinue(progressRows, slug, catalogSubjects);

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
      continue: continueResolved,
    });
  } catch (err) {
    console.error('GET /api/exam-hub/[slug]/progress', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load progress' },
      { status: 500 }
    );
  }
}
