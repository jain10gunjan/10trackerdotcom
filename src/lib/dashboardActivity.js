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
    .filter((r) => r.area && r.topic)
    .sort((a, b) => {
      const ta = new Date(a.updated_at || a.created_at || 0).getTime();
      const tb = new Date(b.updated_at || b.created_at || 0).getTime();
      return tb - ta;
    })
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
        at: r.updated_at || r.created_at || null,
        href: `/${area}/practice/${topic}`,
      };
    });
}

export function buildRecentMockAttempts(attempts, limit = 15) {
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

export function buildRecentAllActivity(practiceItems, mockItems, limit = 20) {
  return [...practiceItems, ...mockItems]
    .sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : 0;
      const tb = b.at ? new Date(b.at).getTime() : 0;
      return tb - ta;
    })
    .slice(0, limit);
}
