import { redirect } from 'next/navigation';
import { resolveVendorAccess } from '@/features/vendor-tests/server/resolveVendorAccess';
import VendorRestrictedPanel from '@/features/vendor-tests/components/VendorRestrictedPanel';
import { primaryDomainHint } from '@/features/vendor-tests/lib/vendorAccess';

export default async function VendorRestrictedPage({ params }) {
  const { slug } = await params;
  const result = await resolveVendorAccess(slug, { requireAuth: true });

  if (result.status === 401) {
    redirect(`/sign-in?redirect=/practice-tests/${encodeURIComponent(slug)}/restricted`);
  }

  // If they somehow have access, send them to the portal home
  if (result.ok) {
    redirect(`/practice-tests/${encodeURIComponent(slug)}`);
  }

  return (
    <VendorRestrictedPanel
      slug={slug}
      vendorName={result.vendor?.name}
      message={result.message}
      domainHint={primaryDomainHint(result.domains || [])}
    />
  );
}
