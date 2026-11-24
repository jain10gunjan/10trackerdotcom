import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { adminGrantSubscription } from '@/features/credits/lib/walletService';
import { formatAdminDbError } from '@/lib/supabaseAdmin';

/** POST — assign a subscription with no payment. Writes the live row and a grant log. */
export async function POST(request) {
  const { isAdmin, userEmail: adminEmail, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const targetEmail = normalizeEmail(body?.userEmail || body?.email);
    const planId = String(body?.planId || '').trim();
    const note = body?.note ? String(body.note).trim().slice(0, 500) : null;

    if (!targetEmail) {
      return NextResponse.json({ success: false, error: 'userEmail is required' }, { status: 400 });
    }
    if (!planId) {
      return NextResponse.json({ success: false, error: 'planId is required' }, { status: 400 });
    }

    const result = await adminGrantSubscription(targetEmail, {
      planId,
      note,
      adminEmail,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[admin subscriptions POST]', err);
    const message = formatAdminDbError(err);
    const status = /missing|unknown plan|invalid/i.test(message) ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
