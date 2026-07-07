import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { extractGateOverflowSolution } from '@/lib/gateoverflowSolution';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const url = body?.url;
    const questionId = body?.questionId || 'extract';
    const pastedHtml = body?.html || body?.pastedHtml || null;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A GateOverflow discussion URL is required.' },
        { status: 400 }
      );
    }

    const result = await extractGateOverflowSolution(url, questionId, pastedHtml);

    return NextResponse.json({
      success: true,
      solution: result.url,
      solutiontext: result.solutiontext,
    });
  } catch (error) {
    console.error('extract-gate-solution:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to extract solution.',
        code: error?.code || undefined,
      },
      { status: error?.code === 'GATEOVERFLOW_BLOCKED' ? 502 : 500 }
    );
  }
}
