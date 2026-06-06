'use client';

import { usePathname } from 'next/navigation';
import { useProfileGate } from '@/context/ProfileGateContext';
import { isTermsReacceptHiddenPath } from '@/lib/profileGatePaths';
import TermsReacceptPanel from '@/components/profile/TermsReacceptPanel';

/**
 * Blocking modal on main app routes only.
 * Hidden on legal/browse pages (banner there) and /profile (full settings form).
 */
export default function TermsReacceptanceModal() {
  const pathname = usePathname();
  const { termsReacceptRequired } = useProfileGate();

  if (!termsReacceptRequired) return null;
  if (isTermsReacceptHiddenPath(pathname)) return null;

  const returnPath = pathname || '/';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-[2px]" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-reaccept-title"
        className="relative w-full max-w-md bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden"
      >
        <TermsReacceptPanel variant="modal" returnPath={returnPath} />
      </div>
    </div>
  );
}
