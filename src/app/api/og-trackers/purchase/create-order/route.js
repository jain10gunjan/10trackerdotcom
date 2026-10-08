import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import {
  createPremiumOrderRecord,
  getUserPremiumState,
} from '@/features/og-trackers/lib/ogTrackerService';
import { getOgPremiumAmountPaise } from '@/features/og-trackers/lib/constants';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST() {
  try {
    const { email, session, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const state = await getUserPremiumState(email);
    if (state.isPremium) {
      return NextResponse.json({
        success: true,
        alreadyPremium: true,
      });
    }

    const amountPaise = getOgPremiumAmountPaise();
    const shortEmail = email.split('@')[0].slice(0, 12);
    const receipt = `og_${shortEmail}_${uuidv4().slice(0, 8)}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: { email, type: 'og_trackers_premium' },
    });

    await createPremiumOrderRecord(email, order.id, amountPaise);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      customerName: session.user?.name || email.split('@')[0],
      customerEmail: email,
    });
  } catch (err) {
    console.error('og-trackers/purchase/create-order', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
