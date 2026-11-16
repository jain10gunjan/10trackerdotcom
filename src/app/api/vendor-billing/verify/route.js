import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { getVendorSupabase } from '@/features/vendor-tests/lib/vendorDb';
import { getVendorPlanById } from '@/features/vendor-tests/lib/vendorPlans';
import { normalizeEmail } from '@/lib/normalizeEmail';

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
      vendorId,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId || !vendorId) {
      return NextResponse.json({ success: false, error: 'Missing payment fields' }, { status: 400 });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    const plan = getVendorPlanById(planId);
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 });
    }

    const supabase = getVendorSupabase();
    const { data: orderRow, error: orderErr } = await supabase
      .from('vendor_subscription_orders')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('vendor_id', vendorId)
      .eq('buyer_email', normalizeEmail(email))
      .maybeSingle();

    if (orderErr) throw orderErr;
    if (!orderRow) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    if (orderRow.status === 'paid') {
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }
    if (orderRow.plan_id !== planId) {
      return NextResponse.json({ success: false, error: 'Plan mismatch' }, { status: 400 });
    }

    const renewsAt = plan.intervalDays
      ? new Date(Date.now() + plan.intervalDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const vendorUpdate = {
      plan_id: planId,
      plan_status: 'active',
      plan_renews_at: renewsAt,
      updated_at: new Date().toISOString(),
    };
    if (plan.codingContestsAddon) {
      vendorUpdate.coding_contests_addon = true;
    }

    const { error: vendorErr } = await supabase
      .from('vendors')
      .update(vendorUpdate)
      .eq('id', vendorId);
    if (vendorErr) throw vendorErr;

    await supabase
      .from('vendor_subscription_orders')
      .update({
        status: 'paid',
        razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderRow.id);

    return NextResponse.json({ success: true, planId, renewsAt });
  } catch (err) {
    console.error('vendor-billing/verify', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
