import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/lib/credits/requireSession';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { isRlsPolicyError } from '@/lib/supabaseAdmin';
import { recordPurchase, ROADMAPS_SETUP_HINT } from '@/lib/roadmaps/roadmapService';

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
      roadmapSlug,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Missing payment fields' }, { status: 400 });
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
      .from('roadmap_orders')
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
      return NextResponse.json({ success: true, alreadyProcessed: true, roadmapSlug });
    }

    await recordPurchase({
      userEmail: email,
      roadmapId: orderRow.roadmap_id,
      amountPaise: orderRow.amount_paise,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      termsAcceptedAt: orderRow.terms_accepted_at,
      termsVersion: orderRow.terms_version,
    });

    await supabase
      .from('roadmap_orders')
      .update({
        status: 'completed',
        razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id);

    const { data: roadmap } = await supabase
      .from('roadmaps')
      .select('slug, title')
      .eq('id', orderRow.roadmap_id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      roadmapSlug: roadmap?.slug || roadmapSlug,
      roadmapTitle: roadmap?.title,
    });
  } catch (err) {
    console.error('roadmaps/purchase/verify', err);
    if (isRlsPolicyError(err) || err?.code === '42P01') {
      return NextResponse.json(
        { success: false, error: 'Roadmaps billing not configured', setupHint: ROADMAPS_SETUP_HINT },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
