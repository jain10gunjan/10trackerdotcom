'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function AuthPageShell({ children, backHref = '/', backLabel = 'Back to home' }) {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-700 mb-6"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {backLabel}
        </Link>
        {children}
      </div>
    </div>
  );
}
