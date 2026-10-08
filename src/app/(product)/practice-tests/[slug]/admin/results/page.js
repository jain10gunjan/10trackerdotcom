import { redirect } from 'next/navigation';
import { resolveVendorAccess } from '@/features/vendor-tests/server/resolveVendorAccess';
import VendorRestrictedPanel from '@/features/vendor-tests/components/VendorRestrictedPanel';
import VendorResultsListClient from '@/features/vendor-tests/components/VendorResultsListClient';
import { primaryDomainHint } from '@/features/vendor-tests/lib/vendorAccess';

export default async function VendorAdminResultsPage({ params }) {
  const { slug } = await params;
  const result = await resolveVendorAccess(slug, {
    requireAuth: true,
    minRole: 'vendor_staff',
  });

  if (result.status === 401) {
    redirect(`/sign-in?redirect=/practice-tests/${encodeURIComponent(slug)}/admin/results`);
  }
  if (!result.ok || !result.permissions?.viewResults) {
    return (
      <VendorRestrictedPanel
        slug={slug}
        vendorName={result.vendor?.name}
        message={result.message || 'You do not have permission to view results.'}
        domainHint={primaryDomainHint(result.domains || [])}
      />
    );
  }

  return <VendorResultsListClient slug={result.publicVendor.slug} />;
}
