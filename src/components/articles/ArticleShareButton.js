'use client';

import { Share2 } from 'lucide-react';
import { trackSocialShare } from '@/lib/analytics';

export default function ArticleShareButton({ articleId, title, excerpt }) {
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: excerpt || title, url });
        trackSocialShare('native_share', 'article', articleId);
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      trackSocialShare('clipboard', 'article', articleId);
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-neutral-700 ring-1 ring-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>
  );
}
