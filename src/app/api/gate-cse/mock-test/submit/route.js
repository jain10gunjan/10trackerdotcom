import { NextResponse } from 'next/server';

/**
 * Legacy submit endpoint — student flow uses client-side user_test_attempts.
 * Returns guidance to use the mock-test UI.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      deprecated: true,
      error: 'This endpoint is deprecated. Submit tests via /mock-test/[examcategory]/attempt/[testId].',
      use: '/mock-test/gate-cse',
    },
    { status: 410 }
  );
}
