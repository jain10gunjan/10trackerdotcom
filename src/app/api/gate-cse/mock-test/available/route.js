import { NextResponse } from 'next/server';
import { fetchMockTestsForCategory, toLegacyGateTestShape } from '@/lib/mockTestQueries';

/** @deprecated Uses mock_tests — legacy path kept for compatibility */
export async function GET() {
  try {
    const tests = await fetchMockTestsForCategory('gate-cse');
    return NextResponse.json({
      success: true,
      tests: tests.map(toLegacyGateTestShape),
    });
  } catch (error) {
    console.error('Error fetching available tests:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}
