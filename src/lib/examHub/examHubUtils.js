export const slugifySubject = (str) =>
  String(str ?? '')
    .replace(/\s+/g, '-')
    .toLowerCase();

export const unslugTopic = (str) => String(str ?? '').replace(/-/g, ' ');

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
