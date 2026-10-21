import { redirect } from 'next/navigation';
import { resolveVendorAccess } from '@/features/vendor-tests/server/resolveVendorAccess';
import VendorRestrictedPanel from '@/features/vendor-tests/components/VendorRestrictedPanel';
import ContestLeaderboardClient from '@/features/coding-contests/components/ContestLeaderboardClient';
import { primaryDomainHint } from '@/features/vendor-tests/lib/vendorAccess';

export default async function CodingLeaderboardPage({ params }) {
  const { slug, contestId } = await params;
  const result = await resolveVendorAccess(slug, {
    requireAuth: true,
    minRole: 'student',
  });

  if (result.status === 401) {
    redirect(
      `/sign-in?redirect=/practice-tests/${encodeURIComponent(slug)}/coding-contests/${contestId}/leaderboard`
    );
  }
  if (!result.ok) {
    return (
      <VendorRestrictedPanel
        slug={slug}
        vendorName={result.vendor?.name}
        message={result.message}
        domainHint={primaryDomainHint(result.domains || [])}
      />
    );
  }

  return <ContestLeaderboardClient slug={slug} contestId={contestId} />;
}
