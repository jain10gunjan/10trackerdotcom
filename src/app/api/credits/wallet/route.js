import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/lib/credits/requireSession';
import { getWalletSummary } from '@/lib/credits/walletService';

export async function GET() {
  try {
    const { email, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const summary = await getWalletSummary(email);
    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error('credits/wallet', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load wallet' },
      { status: 500 }
    );
  }
}
