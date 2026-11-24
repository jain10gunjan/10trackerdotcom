import { redirect } from 'next/navigation';

/** Alias: /homepage → canonical home at `/`. */
export default function HomepageAliasPage() {
  redirect('/');
}
