import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resolveVendorAccess } from '@/features/vendor-tests/server/resolveVendorAccess';
import VendorRestrictedPanel from '@/features/vendor-tests/components/VendorRestrictedPanel';
import VendorAdminNav from '@/features/vendor-tests/components/VendorAdminNav';
import VendorPortalShell from '@/features/vendor-tests/components/VendorPortalShell';
import { primaryDomainHint } from '@/features/vendor-tests/lib/vendorAccess';

export default async function VendorAdminHomePage({ params }) {
  const { slug } = await params;
  const result = await resolveVendorAccess(slug, {
    requireAuth: true,
    minRole: 'vendor_staff',
  });

  if (result.status === 401) {
    redirect(`/sign-in?redirect=/practice-tests/${encodeURIComponent(slug)}/admin`);
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

  const v = result.publicVendor;
  const domains = (result.domains || []).map((d) => d.domain);

  return (
    <VendorPortalShell>
    <div className="mx-auto max-w-3xl px-4">
      <VendorAdminNav slug={v.slug} active="admin" />
      <Link
        href={`/practice-tests/${v.slug}`}
        className="text-sm font-medium text-teal-700 hover:text-teal-800"
      >
        ← Portal home
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900">{v.name} admin</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Manage access, members, and (next) tests for this institute. Platform mock tests are
        separate.
      </p>

      <dl className="mt-8 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-neutral-500">Slug</dt>
          <dd className="font-medium text-neutral-900">{v.slug}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Access mode</dt>
          <dd className="font-medium text-neutral-900">
            {result.settings?.access_mode || '—'}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500">Domains</dt>
          <dd className="font-medium text-neutral-900">
            {domains.length ? domains.map((d) => `@${d}`).join(', ') : 'None'}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500">Your role</dt>
          <dd className="font-medium text-neutral-900">
            {result.role}
            {result.isSuperAdmin ? ' (super admin)' : ''}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        {result.permissions.manageAccess ? (
          <>
            <Link
              href={`/practice-tests/${v.slug}/admin/settings`}
              className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Access & branding
            </Link>
            <Link
              href={`/practice-tests/${v.slug}/admin/members`}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800"
            >
              Members & requests
            </Link>
          </>
        ) : null}
        {result.permissions.manageTests ? (
          <>
            <Link
              href={`/practice-tests/${v.slug}/admin/questions`}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800"
            >
              Questions
            </Link>
            <Link
              href={`/practice-tests/${v.slug}/admin/tests`}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800"
            >
              Tests
            </Link>
          </>
        ) : (
          <p className="text-sm text-neutral-500">Access settings are admin-only.</p>
        )}
      </div>
    </div>
    </VendorPortalShell>
  );
}
