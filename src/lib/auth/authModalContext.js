/** Context copy + behavior for the in-app auth modal based on current route. */

function formatSlugSegment(segment) {
  if (!segment) return '';
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getAuthModalContext(pathname, search = '') {
  const path = (pathname || '/').toLowerCase();
  const returnPath = `${pathname || '/'}${search || ''}`;

  let title = 'Sign in to continue';
  let subtitle = 'Save your progress and pick up where you left off.';
  let showBenefits = true;
  let allowGuestContinue = true;

  if (path.includes('/mock-test/') && path.includes('/attempt/')) {
    title = 'Sign in to continue your test';
    subtitle = 'Finish your mock test with saved answers and a scored result.';
  } else if (path.includes('/mock-test/')) {
    title = 'Sign in for mock tests';
    subtitle = 'Save scores, view ranks, and track every attempt.';
  } else if (path.includes('/daily-practice/')) {
    title = 'Sign in for daily practice';
    subtitle = 'Save today’s set and build your streak over time.';
  } else if (path.endsWith('/practice') || /\/practice(\/|$)/.test(path)) {
    const parts = path.split('/').filter(Boolean);
    const topic = parts[parts.length - 1];
    const topicLabel = formatSlugSegment(topic);
    title = 'Sign in to save progress';
    subtitle = topicLabel
      ? `Keep your answers and points for ${topicLabel}.`
      : 'Keep your answers, points, and practice history synced.';
  } else if (/^\/[^/]+\/[^/]+\/[^/]+/.test(path) && !path.startsWith('/mock-test')) {
    const chapter = path.split('/').filter(Boolean)[2];
    const chapterLabel = formatSlugSegment(chapter);
    title = 'Sign in to save chapter progress';
    subtitle = chapterLabel
      ? `Resume ${chapterLabel} with your answers saved.`
      : 'Save answers and accuracy for this chapter.';
  } else if (/^\/[^/]+\/[^/]+/.test(path) && !path.startsWith('/mock-test')) {
    const subject = path.split('/').filter(Boolean)[1];
    const subjectLabel = formatSlugSegment(subject);
    title = 'Sign in to track this subject';
    subtitle = subjectLabel
      ? `Save progress across ${subjectLabel} topics.`
      : 'Unlock saved progress and topic-wise analytics.';
  } else if (path === '/exams' || /^\/[^/]+$/.test(path)) {
    title = 'Sign in to get started';
    subtitle = 'Practice MCQs, mock tests, and daily sets with progress saved.';
  }

  const signUpHref = `/sign-up?redirect=${encodeURIComponent(returnPath)}`;

  return {
    title,
    subtitle,
    showBenefits,
    allowGuestContinue,
    returnPath,
    signUpHref,
  };
}

/** Purchase / checkout flows — no guest bypass */
export function getPurchaseAuthModalContext(returnPath) {
  return {
    title: 'Sign in to continue',
    subtitle: 'Sign in to complete your purchase securely.',
    showBenefits: false,
    allowGuestContinue: false,
    returnPath: returnPath || '/',
    signUpHref: `/sign-up?redirect=${encodeURIComponent(returnPath || '/')}`,
  };
}
