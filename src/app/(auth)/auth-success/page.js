import { redirect } from 'next/navigation';

/**
 * Legacy token dump page — disabled.
 * Google OAuth completes via NextAuth (/api/auth/callback/google).
 */
export default function AuthSuccess() {
  redirect('/sign-in');
}
