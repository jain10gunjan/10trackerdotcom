import { auth } from '@/auth';

/**
 * NextAuth user for coding-contest routes (after requireVendorApi succeeded).
 */
export async function getCodingUser() {
  const session = await auth();
  const userId = session?.user?.id || session?.user?.sub;
  if (!userId) {
    return { ok: false, error: 'Sign in required', status: 401 };
  }
  return {
    ok: true,
    userId: String(userId),
    email: session.user.email || null,
    name: session.user.name || null,
  };
}
