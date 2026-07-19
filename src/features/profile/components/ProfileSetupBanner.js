'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useProfileGate } from '@/context/ProfileGateContext';
import { getSafeRedirect } from '@/lib/safeRedirect';
import { buildProfileSetupHref } from '@/lib/profileGatePaths';

/** Shown on browseable pages when the user still needs to finish profile onboarding */
export default function ProfileSetupBanner() {
  const { gateActive } = useProfileGate();
  const searchParams = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get('redirect')) || '/';

  if (!gateActive) return null;

  return (
    <div className="bg-neutral-900 text-white text-sm">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-neutral-300">
          Finish profile setup to unlock practice and mock tests.
        </span>
        <Link
          href={buildProfileSetupHref(redirect)}
          className="inline-flex items-center rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/15 transition-colors shrink-0"
        >
          Continue setup
        </Link>
      </div>
    </div>
  );
}
