import { redirect } from 'next/navigation';
import { resolveVendorAccess } from '@/features/vendor-tests/server/resolveVendorAccess';
import VendorRestrictedPanel from '@/features/vendor-tests/components/VendorRestrictedPanel';
import VendorMembersClient from '@/features/vendor-tests/components/VendorMembersClient';
import { primaryDomainHint } from '@/features/vendor-tests/lib/vendorAccess';

export default async function VendorAdminMembersPage({ params }) {
  const { slug } = await params;
  const result = await resolveVendorAccess(slug, {
    requireAuth: true,
    minRole: 'vendor_admin',
  });

  if (result.status === 401) {
    redirect(`/sign-in?redirect=/practice-tests/${encodeURIComponent(slug)}/admin/members`);
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

  return <VendorMembersClient slug={slug} />;
}
