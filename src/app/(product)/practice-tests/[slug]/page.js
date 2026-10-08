import VendorLandingPage from '@/features/vendor-tests/components/VendorLandingPage';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    title: `${slug} · Practice tests · 10Tracker`,
    robots: { index: false, follow: false },
  };
}

export default async function PracticeTestsVendorPage({ params }) {
  const { slug } = await params;
  return <VendorLandingPage slug={slug} />;
}
