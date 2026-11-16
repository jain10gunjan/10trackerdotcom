import { redirect } from 'next/navigation';

/** Legacy parallel practice loop — use exam hubs + credits instead. */
export default function PracticeUnlimitedRedirect() {
  redirect('/exams');
}
