import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { activateSubscription } from '@/features/credits/lib/walletService';
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
      planId,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return NextResponse.json(
        { success: false, error: 'Missing payment fields' },
        { status: 400 }
      );
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = getSupabaseServer(isValidServiceRoleKey());

    const { data: orderRow, error: orderErr } = await supabase
      .from('subscription_orders')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_email', email)
      .maybeSingle();

    if (orderErr) throw orderErr;

    if (!orderRow) {
      return NextResponse.json(
        { success: false, error: 'Order not found for this account' },
        { status: 404 }
      );
    }

    if (orderRow.status === 'completed') {
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    if (orderRow.plan_id !== planId) {
      return NextResponse.json({ success: false, error: 'Plan mismatch' }, { status: 400 });
    }

    if (!orderRow.terms_accepted_at) {
      return NextResponse.json(
        { success: false, error: 'Terms acceptance required before payment' },
        { status: 400 }
      );
    }

    const subscription = await activateSubscription(email, planId, {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amountPaise: orderRow.amount_paise,
    });

    await supabase
      .from('subscription_orders')
      .update({
        status: 'completed',
        razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id);

    return NextResponse.json({
      success: true,
      subscription: {
        planId: subscription.plan_id,
        expiresAt: subscription.expires_at,
      },
    });
  } catch (err) {
    console.error('subscriptions/verify', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
