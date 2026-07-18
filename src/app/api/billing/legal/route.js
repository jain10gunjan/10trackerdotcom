import { NextResponse } from 'next/server';
import { getBillingLegalInfo } from '@/features/billing/lib/legal';

export async function GET() {
  return NextResponse.json({ success: true, ...getBillingLegalInfo() });
}
