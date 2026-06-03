import { auth } from '@/auth';
import { normalizeEmail } from '@/lib/normalizeEmail';

export async function requireSessionEmail() {
  const session = await auth();
  const email = normalizeEmail(session?.user?.email);
  if (!email) {
    return { error: 'Authentication required', status: 401, email: null, session: null };
  }
  return { email, session, error: null, status: null };
}
