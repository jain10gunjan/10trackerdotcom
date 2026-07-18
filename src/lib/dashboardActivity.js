import { formatExamSlug, mockTestHrefForSlug, practiceHrefForSlug } from '@/lib/platformExams';
import { parseProgressIdArray } from '@/lib/progressIdentity';
import { normalizeCategorySlug } from '@/features/exam-hub/lib/categoryKey';
import { slugifySubject } from '@/features/exam-hub/lib/examHubUtils';
import { practiceAreaMatchesSlug } from '@/lib/examProfile';
import { examHubContinueToPracticeCard } from '@/features/exam-hub/lib/examHubProgress';

const RECENT_ACTIVITY_LIMIT = 15;

function formatTopicLabel(topic) {
  return String(topic || '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function rowProgressStats(row) {
  const completedQuestions = parseProgressIdArray(row?.completedquestions).length;
  const correctAnswers = parseProgressIdArray(row?.correctanswers).length;
  const accuracy =
    completedQuestions > 0 ? Math.round((correctAnswers / completedQuestions) * 100) : null;

  return { completedQuestions, correctAnswers, accuracy };
}

/** Global latest practice row (any exam). */
export function buildContinueSession(rows) {
  let best = null;

  for (const row of rows || []) {
    if (!row?.area || !row?.topic) continue;

    const { completedQuestions, accuracy } = rowProgressStats(row);
    if (completedQuestions <= 0) continue;

    const practicedAt = row.updated_at || row.created_at || null;
    const practicedAtMs = practicedAt ? new Date(practicedAt).getTime() : 0;
    const area = normalizeCategorySlug(row.area);
    const topic = String(row.topic);

    if (!best || practicedAtMs > best.practicedAtMs) {
      best = {
        type: 'practice',
        area,
        topic,
        topicLabel: formatTopicLabel(topic),
        category: formatExamSlug(area),
        href: `/${area}/practice/${encodeURIComponent(topic)}`,
        completedQuestions,
        accuracy,
        practicedAt,
        practicedAtMs,
      };
    }
  }

  return best;
}

/**
 * Same continue resolution as GET /api/exam-hub/[slug]/progress (gate-cse page).
 */
export function buildExamHubStyleContinue(rows, examSlug, catalogSubjects = []) {
  const slug = normalizeCategorySlug(examSlug);
  if (!slug) return null;

  const subjectKeys = new Set((catalogSubjects || []).map((s) => s.subject));
  let best = null;

  for (const row of rows || []) {
    if (!row?.area || !row?.topic) continue;
    if (!practiceAreaMatchesSlug(row.area, slug)) continue;

    const { completedQuestions, accuracy } = rowProgressStats(row);
    if (completedQuestions <= 0) continue;

    const subjectKey = subjectForTopic(row.topic, catalogSubjects);
    if (!subjectKey || !subjectKeys.has(subjectKey)) continue;

    const practicedAt = row.updated_at || row.created_at || null;
    const practicedAtMs = practicedAt ? new Date(practicedAt).getTime() : 0;

    if (!best || practicedAtMs >= best.practicedAtMs) {
      best = {
        type: 'practice',
        area: slug,
        topic: String(row.topic),
        topicLabel: formatTopicLabel(row.topic),
        subject: slugifySubject(subjectKey),
        category: formatExamSlug(slug),
        href: `/${slug}/practice/${encodeURIComponent(row.topic)}`,
        completedQuestions,
        accuracy,
        practicedAt,
        practicedAtMs,
        description: 'Continue your last practice session for this exam.',
      };
    }
  }

  return best;
}

function subjectForTopic(topic, catalogSubjects = []) {
  if (!topic) return null;
  const match = catalogSubjects.find((s) =>
    s.subtopics?.some((t) => t.title === topic)
  );
  return match?.subject ?? null;
}

/** Attach catalog subject slug for exam-hub style "subject · topic" headline. */
export function enrichPracticeContinue(continueSession, catalogSubjects = []) {
  if (!continueSession) return null;
  const catalogSubject = subjectForTopic(continueSession.topic, catalogSubjects);
  const subject = catalogSubject
    ? slugifySubject(catalogSubject)
    : continueSession.area;

  return {
    ...continueSession,
    subject,
    topic: continueSession.topic,
    description: 'Continue your last practice session for this exam.',
  };
}

export function buildMockContinueSession(mockAttempts = [], primaryExam) {
  const inProgressMock = mockAttempts.find(
    (a) => !a.isCompleted && a.status === 'in_progress'
  );
  if (!inProgressMock) return null;

  const category = normalizeCategorySlug(
    inProgressMock.category || primaryExam?.slug || ''
  );
  const total = inProgressMock.totalQuestions ?? 0;
  const answered = inProgressMock.correctAnswers ?? 0;

  return {
    type: 'mock',
    subject: inProgressMock.testName || 'Mock test',
    topic: total > 0 ? `${answered} of ${total} answered` : 'In progress',
    category: formatExamSlug(category),
    categorySlug: category,
    href: category
      ? `/mock-test/${category}/attempt/${inProgressMock.testId}`
      : mockTestHrefForSlug(primaryExam?.slug),
    description: 'Resume your mock test where you left off.',
    practicedAt: inProgressMock.startedAt || null,
  };
}

/**
 * Practice + mock continue cards for the home dashboard.
 * Shows both when available; fallback when neither exists.
 */
export function resolveContinueOptions({
  examHubPractice,
  continueSession,
  recentPractice = [],
  mockAttempts = [],
  primaryExam,
}) {
  let practice = examHubContinueToPracticeCard(examHubPractice);

  if (!practice && continueSession?.href) {
    practice = examHubContinueToPracticeCard(continueSession);
  }

  if (!practice && recentPractice[0]?.href) {
    const item = recentPractice[0];
    practice = {
      subject: item.area || formatExamSlug(primaryExam?.slug),
      topic: item.title || item.topic,
      href: item.href,
      description: 'Continue your last practice session for this exam.',
    };
  }

  if (!practice && primaryExam?.slug) {
    const slug = normalizeCategorySlug(primaryExam.slug);
    practice = {
      subject: primaryExam.name || formatExamSlug(slug),
      topic: null,
      href: practiceHrefForSlug(slug),
      description: 'Pick up where you left off — continue topic practice.',
    };
  }

  const mock = buildMockContinueSession(mockAttempts, primaryExam);

  let fallback = null;
  if (!practice && !mock) {
    if (primaryExam?.slug) {
      fallback = {
        subject: primaryExam.name,
        topic: null,
        href: practiceHrefForSlug(primaryExam.slug),
        description: 'Start practicing topic-wise MCQs with solutions.',
      };
    } else {
      fallback = {
        subject: 'Explore exams',
        topic: null,
        href: '/exams',
        description: 'Pick your exam and begin your first session.',
      };
    }
  }

  return { practice, mock, fallback };
}

/** @deprecated Use resolveContinueOptions — kept for any legacy callers */
export function resolveContinueTarget(args) {
  const { practice, mock, fallback } = resolveContinueOptions(args);
  if (mock) {
    return {
      type: 'mock',
      category: mock.category,
      topic: mock.subject,
      title: mock.subject,
      subtitle: mock.topic,
      href: mock.href,
      cta: 'Resume mock test',
      practicedAt: mock.practicedAt,
      progress: null,
    };
  }
  if (practice) {
    return {
      type: 'practice',
      category: args.continueSession?.category,
      topic: args.continueSession?.topicLabel,
      title: args.continueSession?.topicLabel,
      subtitle: args.continueSession?.category,
      href: practice.href,
      cta: 'Continue practice',
      practicedAt: args.continueSession?.practicedAt,
      progress: args.continueSession
        ? {
            label: 'Topic progress',
            detail: `${args.continueSession.completedQuestions.toLocaleString()} questions · ${args.continueSession.accuracy}% accuracy`,
            percent: args.continueSession.accuracy,
          }
        : null,
    };
  }
  if (fallback) {
    return {
      type: 'discover',
      title: fallback.subject,
      subtitle: fallback.description,
      href: fallback.href,
      cta: 'Get started',
      practicedAt: null,
      progress: null,
    };
  }
  return null;
}

export function buildRecentPractice(rows, limit = RECENT_ACTIVITY_LIMIT) {
  return (rows || [])
    .filter((r) => r.area && r.topic)
    .sort((a, b) => {
      const ta = new Date(a.updated_at || a.created_at || 0).getTime();
      const tb = new Date(b.updated_at || b.created_at || 0).getTime();
      return tb - ta;
    })
    .slice(0, limit)
    .map((r) => {
      const area = normalizeCategorySlug(r.area);
      const topic = String(r.topic);
      const { completedQuestions, accuracy } = rowProgressStats(r);

      return {
        type: 'practice',
        area,
        topic,
        title: formatTopicLabel(topic),
        subtitle:
          completedQuestions > 0
            ? `${formatExamSlug(area)} · ${completedQuestions} questions`
            : formatExamSlug(area),
        at: r.updated_at || r.created_at || null,
        href: `/${area}/practice/${topic}`,
        score: accuracy,
      };
    });
}

export function buildRecentMockAttempts(attempts, limit = RECENT_ACTIVITY_LIMIT) {
  return (attempts || []).slice(0, limit).map((a) => {
    const category = String(a.category || '').toLowerCase();
    const completed = Boolean(a.isCompleted);
    const inProgress = !completed && a.status === 'in_progress';
    let href = mockTestHrefForSlug(category);
    if (inProgress && a.testId && category) {
      href = `/mock-test/${category}/attempt/${a.testId}`;
    } else if (completed && a.id && category) {
      href = `/mock-test/${category}/results/${a.id}`;
    }
    return {
      type: 'mock',
      id: a.id,
      title: a.testName || 'Mock Test',
      subtitle: `${formatExamSlug(category)} · ${completed ? 'Completed' : inProgress ? 'In progress' : 'Mock test'}`,
      at: a.completedAt || a.startedAt,
      score: completed && a.percentage != null ? Math.round(a.percentage) : null,
      href,
    };
  });
}

export function buildRecentAllActivity(practiceItems, mockItems, limit = RECENT_ACTIVITY_LIMIT) {
  return [...practiceItems, ...mockItems]
    .sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : 0;
      const tb = b.at ? new Date(b.at).getTime() : 0;
      return tb - ta;
    })
    .slice(0, limit);
}
