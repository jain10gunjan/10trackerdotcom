import { NextResponse } from 'next/server';
import { getBillingLegalInfo } from '@/lib/billing/legal';

export async function GET() {
  return NextResponse.json({ success: true, ...getBillingLegalInfo() });
}
