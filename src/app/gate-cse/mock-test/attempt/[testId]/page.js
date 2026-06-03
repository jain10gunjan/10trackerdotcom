import { redirect } from 'next/navigation';

export default async function LegacyGateCseAttemptRedirect({ params }) {
  const { testId } = await params;
  redirect(`/mock-test/gate-cse/attempt/${testId}`);
}
