import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { getBillingLegalInfo, validateTermsAcceptance } from '@/features/billing/lib/legal';
import { getVendorSupabase } from '@/features/vendor-tests/lib/vendorDb';
import { getVendorPlanById, VENDOR_PLAN_IDS } from '@/features/vendor-tests/lib/vendorPlans';
import { normalizeEmail } from '@/lib/normalizeEmail';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST — create Razorpay order for a vendor SaaS plan.
 * Body: { vendorId, planId, termsAccepted }
 */
export async function POST(request) {
  try {
    const { email, session, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const body = await request.json();
    const vendorId = String(body?.vendorId || '').trim();
    const planId = String(body?.planId || '').trim();
    const termsCheck = validateTermsAcceptance(body);
    if (!termsCheck.ok) {
      return NextResponse.json({ success: false, error: termsCheck.error }, { status: 400 });
    }

    const plan = getVendorPlanById(planId);
    if (!plan || plan.id === VENDOR_PLAN_IDS.TRIAL || !plan.amountPaise) {
      return NextResponse.json({ success: false, error: 'Invalid paid plan' }, { status: 400 });
    }

    const supabase = getVendorSupabase();
    const { data: member } = await supabase
      .from('vendor_members')
      .select('role, status')
      .eq('vendor_id', vendorId)
      .eq('user_email', normalizeEmail(email))
      .maybeSingle();

    if (!member || member.status !== 'active' || member.role !== 'vendor_admin') {
      return NextResponse.json({ success: false, error: 'Vendor admin required' }, { status: 403 });
    }

    const { data: vendor, error: vendorErr } = await supabase
      .from('vendors')
      .select('id, name, slug')
      .eq('id', vendorId)
      .maybeSingle();
    if (vendorErr || !vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    const legal = getBillingLegalInfo();
    const termsAcceptedAt = new Date().toISOString();
    const shortSlug = vendor.slug.slice(0, 12);
    const receipt = `vnd_${shortSlug}_${uuidv4().slice(0, 8)}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount: plan.amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        email,
        planId,
        vendorId,
        type: 'vendor_subscription',
      },
    });

    const { error: dbErr } = await supabase.from('vendor_subscription_orders').insert({
      vendor_id: vendorId,
      buyer_email: normalizeEmail(email),
      plan_id: planId,
      amount_paise: plan.amountPaise,
      status: 'pending',
      razorpay_order_id: order.id,
      terms_accepted_at: termsAcceptedAt,
      terms_version: legal.termsVersion,
    });

    if (dbErr) {
      console.error('vendor_subscription_orders insert', dbErr);
      return NextResponse.json(
        {
          success: false,
          error:
            dbErr.message ||
            'Billing tables missing — run supabase/migrations/setup_vendor_saas_billing.sql',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId,
      planName: plan.name,
      vendorId,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      customerName: session.user?.name || email.split('@')[0],
      customerEmail: email,
      legal,
    });
  } catch (err) {
    console.error('vendor-billing/create-order', err);
    return NextResponse.json(
      { success: false, error: err?.error?.description || err.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
