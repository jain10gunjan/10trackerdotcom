import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { fetchMockTestsForCategory, toLegacyGateTestShape } from '@/lib/mockTestQueries';

/** @deprecated Uses mock_tests */
export async function GET() {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const tests = await fetchMockTestsForCategory('gate-cse', { useServiceRole: true });
    return NextResponse.json({
      success: true,
      tests: tests.map(toLegacyGateTestShape),
    });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}
