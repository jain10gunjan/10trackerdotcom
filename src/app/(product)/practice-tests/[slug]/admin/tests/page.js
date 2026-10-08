import { redirect } from 'next/navigation';
import { resolveVendorAccess } from '@/features/vendor-tests/server/resolveVendorAccess';
import VendorRestrictedPanel from '@/features/vendor-tests/components/VendorRestrictedPanel';
import VendorTestsClient from '@/features/vendor-tests/components/VendorTestsClient';
import { primaryDomainHint } from '@/features/vendor-tests/lib/vendorAccess';

export default async function VendorAdminTestsPage({ params }) {
  const { slug } = await params;
  const result = await resolveVendorAccess(slug, {
    requireAuth: true,
    minRole: 'vendor_staff',
  });

  if (result.status === 401) {
    redirect(`/sign-in?redirect=/practice-tests/${encodeURIComponent(slug)}/admin/tests`);
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

  return <VendorTestsClient slug={slug} />;
}
