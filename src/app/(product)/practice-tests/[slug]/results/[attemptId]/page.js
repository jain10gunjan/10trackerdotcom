import VendorAttemptAnalysisClient from '@/features/vendor-tests/components/VendorAttemptAnalysisClient';

export default async function VendorAttemptResultsPage({ params }) {
  const { slug, attemptId } = await params;
  return <VendorAttemptAnalysisClient slug={slug} attemptId={attemptId} />;
}
