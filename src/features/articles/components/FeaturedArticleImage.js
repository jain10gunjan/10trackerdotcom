'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { isAutomationImageUrl } from '@/lib/resolveFeaturedImageUrl';

export default function FeaturedArticleImage({ src, alt, caption, useNextImage }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src) return null;

  const preferNative = isAutomationImageUrl(src) || !useNextImage;
  const captionText = typeof caption === 'string' ? caption.trim() : '';

  return (
    <figure className="relative w-full bg-neutral-100">
      <div className="relative aspect-[16/9] sm:aspect-[2.05/1] max-h-[min(28rem,55vw)] w-full overflow-hidden">
        {!loaded && !failed ? (
          <div
            className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-100 via-neutral-200/60 to-neutral-100"
            aria-hidden
          />
        ) : null}

        {failed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-100 text-neutral-400">
            <ImageIcon className="h-8 w-8 opacity-40" aria-hidden />
            <span className="text-xs">Image unavailable</span>
          </div>
        ) : preferNative ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            decoding="async"
            fetchPriority="high"
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            className={`object-cover transition-opacity duration-500 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )}

        {/* subtle bottom fade into content */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent"
          aria-hidden
        />
      </div>
      {captionText ? (
        <figcaption className="px-4 sm:px-8 lg:px-10 py-2.5 sm:py-3 text-xs sm:text-sm text-neutral-500 leading-relaxed border-b border-neutral-100 bg-white">
          {captionText}
        </figcaption>
      ) : null}
    </figure>
  );
}
