import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resolveVendorAccess } from '@/features/vendor-tests/server/resolveVendorAccess';
import VendorRestrictedPanel from '@/features/vendor-tests/components/VendorRestrictedPanel';
import VendorPortalShell from '@/features/vendor-tests/components/VendorPortalShell';
import { primaryDomainHint } from '@/features/vendor-tests/lib/vendorAccess';
import { VENDOR_DB_SETUP_HINT } from '@/features/vendor-tests/lib/vendorDb';
import {
  VendorCard,
  VendorPrimaryButton,
  VendorSecondaryButton,
} from '@/features/vendor-tests/components/VendorUi';

export default async function VendorLandingPage({ slug }) {
  const result = await resolveVendorAccess(slug, { requireAuth: true, minRole: 'student' });

  if (result.status === 401) {
    redirect(`/sign-in?redirect=/practice-tests/${encodeURIComponent(slug)}`);
  }

  if (result.status === 404) {
    return (
      <VendorPortalShell>
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <VendorCard className="p-8">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Portal not found</h1>
            <p className="mt-2 text-sm text-neutral-600">
              No institute is registered at this address.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Back to 10Tracker
            </Link>
          </VendorCard>
        </div>
      </VendorPortalShell>
    );
  }

  if (result.status === 503) {
    return (
      <VendorPortalShell>
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <VendorCard className="p-8">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Setup required</h1>
            <p className="mt-3 text-sm text-neutral-600">{result.message || VENDOR_DB_SETUP_HINT}</p>
          </VendorCard>
        </div>
      </VendorPortalShell>
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

  const vendor = result.publicVendor;
  const theme = vendor.theme_color || '#0F766E';

  return (
    <VendorPortalShell>
      <div className="mx-auto max-w-3xl px-4">
        <VendorCard className="overflow-hidden">
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: theme }}
            aria-hidden
          />
          <div className="relative px-5 py-8 sm:px-8 sm:py-10">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.06),transparent_50%)]" />
            <div className="relative">
              {vendor.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vendor.logo_url}
                  alt=""
                  className="mb-4 h-12 w-auto object-contain"
                />
              ) : null}
              <span className="inline-flex items-center rounded-full border border-teal-100 bg-teal-50/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-800">
                Institute practice tests
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                {vendor.name}
              </h1>
              {vendor.city ? (
                <p className="mt-2 text-sm text-neutral-600">{vendor.city}</p>
              ) : null}
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-600">
                You are signed in with access to this institute portal. Take published tests,
                review results when released, and manage the bank if you are staff.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <VendorPrimaryButton as={Link} href={`/practice-tests/${vendor.slug}/tests`}>
                  View tests
                </VendorPrimaryButton>
                {result.permissions?.manageTests ? (
                  <VendorSecondaryButton
                    as={Link}
                    href={`/practice-tests/${vendor.slug}/admin`}
                  >
                    Admin dashboard
                  </VendorSecondaryButton>
                ) : null}
              </div>

              <p className="mt-6 text-xs text-neutral-500">
                Role: {result.role}
                {result.isSuperAdmin ? ' (platform super admin)' : ''}
              </p>
            </div>
          </div>
        </VendorCard>
      </div>
    </VendorPortalShell>
  );
}
