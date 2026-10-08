import { redirect } from 'next/navigation';

/**
 * Legacy query-param auth handler — disabled.
 * Identity must come from NextAuth only; never trust URL tokens.
 */
export default function AuthHandler() {
  redirect('/sign-in');
}
