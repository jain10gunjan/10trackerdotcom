import { redirect } from 'next/navigation';
import { resolveVendorAccess } from '@/features/vendor-tests/server/resolveVendorAccess';
import VendorRestrictedPanel from '@/features/vendor-tests/components/VendorRestrictedPanel';
import VendorTestInstructionsClient from '@/features/vendor-tests/components/VendorTestInstructionsClient';
import { primaryDomainHint } from '@/features/vendor-tests/lib/vendorAccess';
import { canReleaseResults } from '@/features/vendor-tests/lib/attemptQuestions';

export default async function VendorTestInstructionsPage({ params }) {
  const { slug, testId } = await params;
  const result = await resolveVendorAccess(slug, { requireAuth: true, minRole: 'student' });

  if (result.status === 401) {
    redirect(
      `/sign-in?redirect=/practice-tests/${encodeURIComponent(slug)}/tests/${encodeURIComponent(testId)}`
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

  const { data: test, error } = await result.supabase
    .from('vendor_tests')
    .select('*')
    .eq('vendor_id', result.vendor.id)
    .eq('id', testId)
    .maybeSingle();

  if (error || !test || test.status !== 'published') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-sm text-rose-700">
        {error?.message || 'Test not found or not published.'}
      </div>
    );
  }

  const { count } = await result.supabase
    .from('vendor_test_questions')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', result.vendor.id)
    .eq('test_id', testId);

  const { data: attempts } = await result.supabase
    .from('vendor_attempts')
    .select('id, status, started_at, submitted_at, score, max_score, percentage')
    .eq('vendor_id', result.vendor.id)
    .eq('test_id', testId)
    .eq('user_email', result.email)
    .order('started_at', { ascending: false });

  const released = canReleaseResults(test);
  const priorAttempts = (attempts || []).map((a) => ({
    ...a,
    score: released ? a.score : null,
    max_score: released ? a.max_score : null,
    percentage: released ? a.percentage : null,
  }));

  return (
    <VendorTestInstructionsClient
      slug={result.publicVendor.slug}
      test={test}
      questionCount={count || test.total_questions || 0}
      priorAttempts={priorAttempts}
      initialProfile={{
        roll_no: result.member?.roll_no || '',
        display_name: result.member?.display_name || '',
        branch: result.member?.branch || '',
        batch: result.member?.batch || '',
      }}
    />
  );
}
