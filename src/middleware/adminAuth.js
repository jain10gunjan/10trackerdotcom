import { auth } from '@/auth';
import { isAdminEmail } from '@/lib/mockTestUtils';

export async function verifyAdminAuth() {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return { isAdmin: false, error: 'Authentication required' };
    }
    if (!isAdminEmail(email)) {
      return { isAdmin: false, error: 'Admin access required' };
    }
    return { isAdmin: true, userId: session.user.id, userEmail: email };
  } catch (error) {
    console.error('Admin auth error:', error);
    return { isAdmin: false, error: 'Authentication failed' };
  }
}

export function requireAdminAuth(handler) {
  return async (request, context) => {
    const { isAdmin, error } = await verifyAdminAuth();

    if (!isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error || 'Admin access required',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return handler(request, context);
  };
}
