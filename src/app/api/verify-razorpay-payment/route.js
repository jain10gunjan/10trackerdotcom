import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { resolveLegacyPlanAmountPaise } from '@/features/billing/lib/legacyPlanPricing';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';

export async function POST(request) {
  try {
    const { email, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json().catch(() => ({}));

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment fields' },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Payment verification unavailable' },
        { status: 503 }
      );
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer(isValidServiceRoleKey());

    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_email', email)
      .maybeSingle();

    if (orderErr) {
      console.error('orders lookup failed:', orderErr.message);
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 500 }
      );
    }

    if (!orderRow) {
      return NextResponse.json(
        { success: false, error: 'Order not found for this account' },
        { status: 404 }
      );
    }

    if (orderRow.status === 'completed') {
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    const expectedAmount = resolveLegacyPlanAmountPaise(orderRow.plan);
    if (
      expectedAmount == null ||
      Number(orderRow.amount) !== Number(expectedAmount)
    ) {
      return NextResponse.json(
        { success: false, error: 'Order amount mismatch' },
        { status: 400 }
      );
    }

    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_email', email)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (updateErr) {
      console.error('orders update failed:', updateErr.message);
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 500 }
      );
    }

    if (!updated) {
      // Another request may have completed it concurrently
      const { data: again } = await supabase
        .from('orders')
        .select('status')
        .eq('razorpay_order_id', razorpay_order_id)
        .eq('user_email', email)
        .maybeSingle();
      if (again?.status === 'completed') {
        return NextResponse.json({ success: true, alreadyProcessed: true });
      }
      return NextResponse.json(
        { success: false, error: 'Could not complete order' },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
