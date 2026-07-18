import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { getBillingLegalInfo, validateTermsAcceptance } from '@/features/billing/lib/legal';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { isRlsPolicyError } from '@/lib/supabaseAdmin';
import {
  getRoadmapBySlug,
  normalizeSlug,
  userHasPurchased,
  ROADMAPS_SETUP_HINT,
} from '@/features/roadmaps/lib/roadmapService';

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
    const termsCheck = validateTermsAcceptance(body);
    if (!termsCheck.ok) {
      return NextResponse.json({ success: false, error: termsCheck.error }, { status: 400 });
    }

    const slug = normalizeSlug(body.roadmapSlug || body.slug);
    const roadmap = await getRoadmapBySlug(slug);
    if (!roadmap?.is_active) {
      return NextResponse.json({ success: false, error: 'Roadmap not available' }, { status: 404 });
    }

    if (await userHasPurchased(email, roadmap.id)) {
      return NextResponse.json({ success: false, error: 'Already purchased' }, { status: 400 });
    }

    const legal = getBillingLegalInfo();
    const termsAcceptedAt = new Date().toISOString();
    const amountPaise = roadmap.price_inr * 100;
    const shortEmail = email.split('@')[0].slice(0, 10);
    const receipt = `rm_${shortEmail}_${uuidv4().slice(0, 8)}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        email,
        roadmapId: roadmap.id,
        roadmapSlug: roadmap.slug,
        type: 'roadmap',
      },
    });

    const supabase = getSupabaseServer(isValidServiceRoleKey());
    const { error: dbErr } = await supabase.from('roadmap_orders').insert({
      user_email: email,
      roadmap_id: roadmap.id,
      amount_paise: amountPaise,
      status: 'pending',
      razorpay_order_id: order.id,
      terms_accepted_at: termsAcceptedAt,
      terms_version: legal.termsVersion,
      business_name: legal.businessName,
    });

    if (dbErr) {
      console.error('roadmap_orders insert', dbErr);
      if (dbErr.code === '42P01' || isRlsPolicyError(dbErr)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Roadmaps billing not configured',
            setupHint: ROADMAPS_SETUP_HINT,
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { success: false, error: dbErr.message || 'Failed to save order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      roadmapSlug: roadmap.slug,
      roadmapTitle: roadmap.title,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      customerName: session.user?.name || email.split('@')[0],
      customerEmail: email,
      legal,
      noRefundsNotice: 'All sales are final. No refunds on roadmap purchases.',
    });
  } catch (err) {
    console.error('roadmaps/purchase/create-order', err);
    const msg = err?.error?.description || err.message || 'Failed to create order';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
