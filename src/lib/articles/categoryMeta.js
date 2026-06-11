/** Category slugs served at /article/[cate] */

export const ARTICLE_CATEGORY_META = {
  news: {
    name: 'News & updates',
    description:
      'Latest exam news, education announcements, and updates for competitive exam aspirants in India.',
    icon: 'newspaper',
  },
  'latest-jobs': {
    name: 'Latest jobs',
    description:
      'Government and private sector job notifications, recruitment alerts, and career opportunities.',
    icon: 'briefcase',
  },
  'exam-results': {
    name: 'Exam results',
    description:
      'Exam results, scorecards, merit lists, and cut-off updates for competitive exams.',
    icon: 'chart',
  },
  'answer-key': {
    name: 'Answer keys',
    description:
      'Official and provisional answer keys with solutions for recent exams.',
    icon: 'key',
  },
  'admit-cards': {
    name: 'Admit cards',
    description:
      'Admit card releases, hall tickets, and exam-day instructions.',
    icon: 'ticket',
  },
};

export function getCategoryMeta(slug) {
  return (
    ARTICLE_CATEGORY_META[slug] || {
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      description: `Browse ${slug.replace(/-/g, ' ')} articles on 10Tracker.`,
      icon: 'newspaper',
    }
  );
}

export const ARTICLE_PAGE_SIZE = 25;

export function safeArticlePage(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function formatArticleDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function formatArticleDateParts(dateString) {
  try {
    const d = new Date(dateString);
    return {
      day: d.getDate(),
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      year: d.getFullYear(),
    };
  } catch {
    return { day: '', month: '', year: '' };
  }
}

export function sanitizeSearchQuery(raw) {
  return String(raw || '')
    .trim()
    .slice(0, 120)
    .replace(/[%_\\]/g, '');
}
