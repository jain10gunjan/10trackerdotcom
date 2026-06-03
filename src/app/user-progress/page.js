import { redirect } from 'next/navigation';

/** Merged into home dashboard for signed-in users with complete profile */
export default function UserProgressRedirect() {
  redirect('/');
}
