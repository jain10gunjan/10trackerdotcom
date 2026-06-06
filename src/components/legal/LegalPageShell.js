'use client';

import { Suspense } from 'react';
import ProfileSetupBanner from '@/components/profile/ProfileSetupBanner';

/**
 * Shared shell for legal / info pages (terms, privacy, disclaimer, about, contact).
 * pt-24 clears fixed navbar; content is never covered by terms accept dock (bottom).
 */
export default function LegalPageShell({ children }) {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24">
      <Suspense fallback={null}>
        <ProfileSetupBanner />
      </Suspense>
      {children}
    </div>
  );
}
