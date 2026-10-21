'use client';

import { useEffect } from 'react';
import { trackContentEvent } from '@/lib/analytics';

/** Fires a GA content_engagement event. DB view_count is no longer tracked in the UI. */
export default function ArticleViewTracker({ articleId }) {
  useEffect(() => {
    if (!articleId) return;
    trackContentEvent('viewed', 'article', articleId);
  }, [articleId]);

  return null;
}
