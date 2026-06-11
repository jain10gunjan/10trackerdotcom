'use client';

import SocialMediaEmbed from '@/components/SocialMediaEmbed';

export default function ArticleEmbeds({ embeds }) {
  if (!embeds?.length) return null;

  return (
    <div className="mb-8 pb-8 border-b border-neutral-100 space-y-6">
      {embeds.map((embed, index) =>
        embed && typeof embed === 'object' ? (
          <SocialMediaEmbed key={index} embed={embed} />
        ) : null
      )}
    </div>
  );
}
