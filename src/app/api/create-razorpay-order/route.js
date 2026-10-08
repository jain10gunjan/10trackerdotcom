import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { resolveLegacyPlanAmountPaise } from '@/features/billing/lib/legacyPlanPricing';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { email, session, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json().catch(() => ({}));
    const plan = typeof body?.plan === 'string' ? body.plan.trim() : '';
    const name =
      (typeof body?.name === 'string' && body.name.trim()) ||
      session?.user?.name ||
      email.split('@')[0];

    // Ignore client-supplied amount — price is resolved server-side only.
    const amountPaise = resolveLegacyPlanAmountPaise(plan);
    if (!amountPaise) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const shortEmail = email.split('@')[0].slice(0, 15);
    const uniqueId = uuidv4().slice(0, 8);
    const receipt = `rcpt_${shortEmail}_${uniqueId}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: { email, name, plan },
    });

    const supabase = getSupabaseServer(isValidServiceRoleKey());
    const { error: dbErr } = await supabase.from('orders').insert({
      user_email: email,
      plan,
      status: 'pending',
      amount: amountPaise,
      razorpay_order_id: order.id,
      created_at: new Date().toISOString(),
    });

    if (dbErr) {
      console.error('orders insert failed:', dbErr.message);
      return NextResponse.json(
        { error: 'Failed to record order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    if (error.error && error.error.description) {
      return NextResponse.json(
        { error: `Razorpay error: ${error.error.description}` },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
