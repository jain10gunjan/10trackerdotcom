import { redirect } from 'next/navigation';

/** Legacy roadmaps product replaced by OG Trackers. */
export default function RoadmapsRedirectPage() {
  redirect('/og-trackers');
}
