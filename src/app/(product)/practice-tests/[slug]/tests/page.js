import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Clock, ListOrdered, ArrowRight } from 'lucide-react';
import { resolveVendorAccess } from '@/features/vendor-tests/server/resolveVendorAccess';
import VendorRestrictedPanel from '@/features/vendor-tests/components/VendorRestrictedPanel';
import VendorPortalShell from '@/features/vendor-tests/components/VendorPortalShell';
import VendorPageHeader, {
  VendorCard,
  VendorPrimaryButton,
  VendorSecondaryButton,
} from '@/features/vendor-tests/components/VendorUi';
import { primaryDomainHint } from '@/features/vendor-tests/lib/vendorAccess';

function inWindow(test, now = new Date()) {
  if (test.starts_at && now < new Date(test.starts_at)) return false;
  if (test.ends_at && now > new Date(test.ends_at)) return false;
  return true;
}

/** Student-facing published test list */
export default async function VendorTestsPage({ params }) {
  const { slug } = await params;
  const result = await resolveVendorAccess(slug, { requireAuth: true, minRole: 'student' });

  if (result.status === 401) {
    redirect(`/sign-in?redirect=/practice-tests/${encodeURIComponent(slug)}/tests`);
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

  const { data: tests, error } = await result.supabase
    .from('vendor_tests')
    .select(
      'id, title, description, duration_minutes, total_questions, starts_at, ends_at, max_attempts, status'
    )
    .eq('vendor_id', result.vendor.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <VendorPortalShell>
        <div className="mx-auto max-w-3xl px-4 text-sm text-rose-700">
          Failed to load tests: {error.message}
        </div>
      </VendorPortalShell>
    );
  }

  const list = tests || [];
  const now = new Date();

  const { data: openAttempts } = await result.supabase
    .from('vendor_attempts')
    .select('id, test_id')
    .eq('vendor_id', result.vendor.id)
    .eq('user_email', result.email)
    .eq('status', 'in_progress');

  const openByTest = Object.fromEntries(
    (openAttempts || []).map((a) => [a.test_id, a.id])
  );

  return (
    <VendorPortalShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <VendorPageHeader
          backHref={`/practice-tests/${result.publicVendor.slug}`}
          backLabel={result.publicVendor.name}
          title="Tests"
          description="Published institute tests. Start or resume when the schedule window is open."
          actions={
            result.permissions?.manageTests ? (
              <VendorSecondaryButton
                as={Link}
                href={`/practice-tests/${result.publicVendor.slug}/admin/tests`}
                className="!py-2 !text-xs"
              >
                Manage tests
              </VendorSecondaryButton>
            ) : null
          }
        />

        {list.length === 0 ? (
          <VendorCard className="p-8 text-center">
            <p className="text-sm text-neutral-500">
              No published tests yet. Ask your institute admin to publish one.
            </p>
          </VendorCard>
        ) : (
          <ul className="space-y-3">
            {list.map((t) => {
              const open = inWindow(t, now);
              const resumeId = openByTest[t.id];
              return (
                <li key={t.id}>
                  <VendorCard className="group p-5 transition hover:border-teal-300 hover:shadow-md hover:shadow-teal-100/40">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold tracking-tight text-neutral-900">
                            {t.title}
                          </h2>
                          {!open ? (
                            <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                              Outside window
                            </span>
                          ) : resumeId ? (
                            <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                              In progress
                            </span>
                          ) : (
                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                              Open
                            </span>
                          )}
                        </div>
                        {t.description ? (
                          <p className="mt-1 text-sm text-neutral-600">{t.description}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {t.duration_minutes} min
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ListOrdered className="h-3.5 w-3.5" /> {t.total_questions}{' '}
                            questions
                          </span>
                          <span>up to {t.max_attempts} attempt(s)</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <VendorPrimaryButton
                          as={Link}
                          href={`/practice-tests/${result.publicVendor.slug}/tests/${t.id}`}
                          className="!py-2"
                        >
                          {resumeId ? 'Resume' : 'View & start'}
                          <ArrowRight className="h-4 w-4" />
                        </VendorPrimaryButton>
                        {resumeId ? (
                          <VendorSecondaryButton
                            as={Link}
                            href={`/practice-tests/${result.publicVendor.slug}/attempt/${resumeId}`}
                            className="!border-amber-200 !bg-amber-50 !py-2 !text-amber-900 hover:!bg-amber-100"
                          >
                            Continue
                          </VendorSecondaryButton>
                        ) : null}
                      </div>
                    </div>
                  </VendorCard>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </VendorPortalShell>
  );
}
