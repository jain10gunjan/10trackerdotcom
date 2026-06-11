import Link from 'next/link';
import { Info } from 'lucide-react';
import { ROADMAP_CATALOG_DISCLAIMER } from '@/lib/roadmaps/constants';

export default function RoadmapsDisclaimerBanner({ className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 sm:px-5 sm:py-3.5 ${className}`}
      role="note"
    >
      <div className="flex gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 text-sm text-amber-950/90 leading-relaxed">
          <p>{ROADMAP_CATALOG_DISCLAIMER}</p>
          <p className="mt-1.5 text-xs text-amber-900/70">
            <Link href="/pricing" className="font-semibold underline hover:text-amber-950">
              View unlimited practice plans
            </Link>
            {' · '}
            <Link href="/terms-and-services" className="font-semibold underline hover:text-amber-950">
              Terms of service
            </Link>
            {' · '}
            <Link href="/privacy-policy" className="font-semibold underline hover:text-amber-950">
              Privacy policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
