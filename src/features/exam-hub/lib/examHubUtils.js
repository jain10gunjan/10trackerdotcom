export const slugifySubject = (str) =>
  String(str ?? '')
    .replace(/\s+/g, '-')
    .toLowerCase();

export const unslugTopic = (str) => String(str ?? '').replace(/-/g, ' ');

function normalizeMatchKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifyChapterSegment(chapter) {
  return String(chapter ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/** /{exam}/{subject}/{chapter}/practice — matches SubjectPracticePage chapter cards. */
export function buildChapterPracticeHref(categorySlug, subject, chapter) {
  const cat = String(categorySlug || '')
    .trim()
    .toLowerCase();
  const sub = slugifySubject(subject);
  const ch = slugifyChapterSegment(chapter);
  if (!cat || !sub || !ch) return cat ? `/${cat}` : '/exams';
  return `/${cat}/${sub}/${ch}/practice`;
}

/**
 * Map a user_progress.topic value to the chapter practice route using exam catalog.
 * Falls back to subject hub or exam hub when chapter cannot be resolved.
 */
export function resolveChapterPracticeHref(
  categorySlug,
  progressTopic,
  catalogSubjects = []
) {
  const cat = String(categorySlug || '')
    .trim()
    .toLowerCase();
  if (!cat) return '/exams';
  if (!progressTopic) return `/${cat}`;

  const key = normalizeMatchKey(progressTopic);
  const slugKey = slugifyChapterSegment(progressTopic);

  for (const sub of catalogSubjects || []) {
    for (const topic of sub.subtopics || []) {
      const titleKey = normalizeMatchKey(topic.title);
      const titleSlug = slugifyChapterSegment(topic.title);
      if (titleKey === key || titleSlug === slugKey) {
        const chapter = topic.chapter || topic.title;
        return buildChapterPracticeHref(cat, sub.subject, chapter);
      }
    }
  }

  for (const sub of catalogSubjects || []) {
    for (const topic of sub.subtopics || []) {
      if (!topic.chapter) continue;
      const chapterKey = normalizeMatchKey(topic.chapter);
      const chapterSlug = slugifyChapterSegment(topic.chapter);
      if (chapterKey === key || chapterSlug === slugKey) {
        return buildChapterPracticeHref(cat, sub.subject, topic.chapter);
      }
    }
  }

  for (const sub of catalogSubjects || []) {
    const hit = (sub.subtopics || []).some((topic) => {
      const titleKey = normalizeMatchKey(topic.title);
      const titleSlug = slugifyChapterSegment(topic.title);
      return titleKey === key || titleSlug === slugKey;
    });
    if (hit) {
      return `/${cat}/${slugifySubject(sub.subject)}`;
    }
  }

  return `/${cat}`;
}

export function getSubjectStats(subject) {
  const topicsCount = subject?.subtopics?.length ?? 0;
  const questionsCount =
    subject?.subtopics?.reduce((sum, topic) => sum + (topic?.count ?? 0), 0) ?? 0;
  return { topicsCount, questionsCount };
}

export function getHubAggregateStats(subjects = []) {
  return subjects.reduce(
    (acc, sub) => {
      const { topicsCount, questionsCount } = getSubjectStats(sub);
      acc.subjects += 1;
      acc.topics += topicsCount;
      acc.questions += questionsCount;
      return acc;
    },
    { subjects: 0, topics: 0, questions: 0 }
  );
}

export function filterSubjects(subjects, searchTerm = '') {
  const q = searchTerm.trim().toLowerCase();
  if (!q) return subjects;

  return subjects.filter(
    (sub) =>
      sub?.subject?.toLowerCase().includes(q) ||
      sub?.subtopics?.some(
        (topic) =>
          topic?.title?.toLowerCase().includes(q) || String(topic?.count ?? '').includes(q)
      )
  );
}

export function buildPathCards(categorySlug, { mockTestCount = 0, dailyPracticeCount = 0 } = {}) {
  const base = `/${categorySlug}`;
  return [
    {
      id: 'practice',
      href: '#practice-content',
      title: 'Practice MCQs',
      description: 'Topic-wise PYQs with solutions and progress tracking.',
      badge: 'Start here',
      scroll: true,
      live: true,
    },
    {
      id: 'mock-tests',
      href: `/mock-test/${categorySlug}`,
      title: 'Full mock tests',
      description: 'Full-length mocks with scores and leaderboard.',
      badge: mockTestCount > 0 ? `${mockTestCount} live` : 'Coming soon',
      live: mockTestCount > 0,
    },
    {
      id: 'daily',
      href: `${base}/daily-practice`,
      title: 'Daily practice',
      description: 'Short daily MCQ sets with explanations — no timer.',
      badge: dailyPracticeCount > 0 ? `${dailyPracticeCount} set${dailyPracticeCount === 1 ? '' : 's'}` : 'Explore',
      live: true,
    },
    {
      id: 'topic-tests',
      href: `${base}`,
      title: 'Topic-wise tests',
      description: 'Timed mini-tests for weak areas — launching soon.',
      badge: 'Coming soon',
      live: false,
    },
  ];
}
