import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { requireSessionEmail } from '@/lib/credits/requireSession';
import {
  getPlanById,
  planAmountPaiseFromConfig,
} from '@/lib/credits/pricingService';
import { getBillingLegalInfo, validateTermsAcceptance } from '@/lib/billing/legal';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { email, session, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const body = await request.json();
    const { planId } = body;
    const termsCheck = validateTermsAcceptance(body);
    if (!termsCheck.ok) {
      return NextResponse.json({ success: false, error: termsCheck.error }, { status: 400 });
    }

    const plan = await getPlanById(planId);
    if (!plan || plan.isActive === false) {
      return NextResponse.json({ success: false, error: 'Invalid or inactive plan' }, { status: 400 });
    }

    const legal = getBillingLegalInfo();
    const termsAcceptedAt = new Date().toISOString();

    const amountPaise = planAmountPaiseFromConfig(plan);
    const shortEmail = email.split('@')[0].slice(0, 12);
    const receipt = `sub_${shortEmail}_${uuidv4().slice(0, 8)}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        email,
        planId,
        type: 'subscription',
      },
    });

    const supabase = getSupabaseServer(isValidServiceRoleKey());
    const { error: dbErr } = await supabase.from('subscription_orders').insert({
      user_email: email,
      plan_id: planId,
      amount_paise: amountPaise,
      status: 'pending',
      razorpay_order_id: order.id,
      terms_accepted_at: termsAcceptedAt,
      terms_version: legal.termsVersion,
      business_name: legal.businessName,
      gstin: legal.gstin || null,
    });

    if (dbErr) {
      console.error('subscription_orders insert', dbErr);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId,
      planName: plan.name,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      customerName: session.user?.name || email.split('@')[0],
      customerEmail: email,
      legal,
    });
  } catch (err) {
    console.error('subscriptions/create-order', err);
    const msg =
      err?.error?.description || err.message || 'Failed to create order';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
