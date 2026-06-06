import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { adminAdjustCredits } from '@/lib/credits/walletService';
import { formatAdminDbError } from '@/lib/supabaseAdmin';

/** POST — grant credits (delta) or set absolute balance for a user */
export async function POST(request) {
  const { isAdmin, userEmail: adminEmail, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const targetEmail = normalizeEmail(body?.userEmail || body?.email);
    const mode = body?.mode === 'set' ? 'set' : 'grant';
    const amount = Number(body?.amount);

    if (!targetEmail) {
      return NextResponse.json({ success: false, error: 'userEmail is required' }, { status: 400 });
    }

    if (!Number.isFinite(amount)) {
      return NextResponse.json({ success: false, error: 'amount must be a number' }, { status: 400 });
    }

    if (mode === 'set') {
      if (amount < 0 || amount > 1_000_000) {
        return NextResponse.json(
          { success: false, error: 'set balance must be between 0 and 1,000,000' },
          { status: 400 }
        );
      }
    } else if (amount === 0 || amount < -1_000_000 || amount > 1_000_000) {
      return NextResponse.json(
        { success: false, error: 'grant amount must be between -1,000,000 and 1,000,000 (not 0)' },
        { status: 400 }
      );
    }

    const note = body?.note ? String(body.note).trim().slice(0, 500) : null;

    const result = await adminAdjustCredits(targetEmail, {
      delta: mode === 'grant' ? Math.round(amount) : undefined,
      setBalance: mode === 'set' ? Math.round(amount) : undefined,
      note,
      adminEmail,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[admin credits POST]', err);
    return NextResponse.json(
      {
        success: false,
        error: formatAdminDbError(err),
      },
      { status: 500 }
    );
  }
}
