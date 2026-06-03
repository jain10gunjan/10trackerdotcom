import { redirect } from 'next/navigation';

export default async function LegacyGateCseResultRedirect({ params }) {
  const { instanceid } = await params;
  redirect(`/mock-test/gate-cse/results/${instanceid}`);
}
