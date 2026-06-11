'use client';

import { useEffect } from 'react';
import { trackContentEvent } from '@/lib/analytics';

export default function ArticleViewTracker({ articleId }) {
  useEffect(() => {
    if (articleId) trackContentEvent('viewed', 'article', articleId);
  }, [articleId]);
  return null;
}
