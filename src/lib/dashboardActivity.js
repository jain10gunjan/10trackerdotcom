import { formatExamSlug, mockTestHrefForSlug } from '@/lib/platformExams';

function formatTopicLabel(topic) {
  return String(topic || '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function buildRecentPractice(rows, limit = 15) {
  return (rows || [])
    .filter((r) => r.area && r.topic && (r.updated_at || r.created_at))
    .sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime()
    )
    .slice(0, limit)
    .map((r) => {
      const area = String(r.area).toLowerCase();
      const topic = String(r.topic);
      return {
        type: 'practice',
        area,
        topic,
        title: formatTopicLabel(topic),
        subtitle: formatExamSlug(area),
        at: r.updated_at || r.created_at,
        href: `/${area}/practice/${topic}`,
      };
    });
}

export function buildRecentMockAttempts(attempts, limit = 15) {
  return (attempts || []).slice(0, limit).map((a) => {
    const category = String(a.category || '').toLowerCase();
    const completed = Boolean(a.isCompleted);
    return {
      type: 'mock',
      id: a.id,
      title: a.testName || 'Mock Test',
      subtitle: `${formatExamSlug(category)} · ${completed ? 'Completed' : 'In progress'}`,
      at: a.completedAt || a.startedAt,
      score: completed && a.percentage != null ? Math.round(a.percentage) : null,
      href: completed && a.id && category
        ? `/mock-test/${category}/results/${a.id}`
        : mockTestHrefForSlug(category),
    };
  });
}

export function buildRecentAllActivity(practiceItems, mockItems, limit = 20) {
  return [...practiceItems, ...mockItems]
    .filter((item) => item.at)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}
