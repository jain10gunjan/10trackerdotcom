import VendorAttemptClient from '@/features/vendor-tests/components/VendorAttemptClient';

export default async function VendorAttemptPage({ params }) {
  const { slug, attemptId } = await params;
  return <VendorAttemptClient slug={slug} attemptId={attemptId} />;
}
