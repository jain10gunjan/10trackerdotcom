import { redirect } from 'next/navigation';

export default function LegacyGateCseResultsRedirect() {
  redirect('/mock-test/gate-cse?tab=progress');
}
