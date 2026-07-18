import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { getWalletSummary } from '@/features/credits/lib/walletService';

export async function GET() {
  try {
    const { email, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const summary = await getWalletSummary(email, { grantBonus: true });
    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error('credits/wallet', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load wallet' },
      { status: 500 }
    );
  }
}
