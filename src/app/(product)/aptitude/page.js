import { redirect } from 'next/navigation';

/** Legacy aptitude hub → unified exam hub. */
export default function AptitudeHubRedirect() {
  redirect('/general-aptitude');
}
