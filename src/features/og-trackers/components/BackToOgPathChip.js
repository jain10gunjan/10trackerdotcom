'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Map } from 'lucide-react';

/**
 * Slim chip when arriving from an OG Tracker path (?from=og&path=slug).
 */
export default function BackToOgPathChip({ className = '' }) {
  const searchParams = useSearchParams();
  const from = searchParams?.get('from');
  const pathSlug = searchParams?.get('path');

  if (from !== 'og' || !pathSlug) return null;

  const safeSlug = String(pathSlug)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 64);
  if (!safeSlug) return null;

  return (
    <Link
      href={`/og-trackers/${safeSlug}?sync=1`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50 ${className}`}
    >
      <Map className="w-3.5 h-3.5 text-neutral-500" />
      Back to path
    </Link>
  );
}
