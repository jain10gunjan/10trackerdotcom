'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useProfileGate } from '@/context/ProfileGateContext';
import { getSafeRedirect } from '@/lib/safeRedirect';
import { isOnboardingBrowsePath } from '@/lib/profileGatePaths';
import TermsReacceptPanel from '@/features/profile/components/TermsReacceptPanel';

/** Fixed bottom accept bar on legal/browse pages — does not cover page content */
export default function TermsReacceptanceBanner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { termsReacceptRequired } = useProfileGate();

  if (!termsReacceptRequired) return null;
  if (!isOnboardingBrowsePath(pathname)) return null;

  const returnPath =
    getSafeRedirect(searchParams.get('redirect')) ||
    pathname ||
    '/';

  return <TermsReacceptPanel variant="dock" returnPath={returnPath} />;
}
