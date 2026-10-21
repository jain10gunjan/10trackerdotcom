import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { listGateCseChapters } from '@/features/mock-test/lib/gateChapterMock';
import { isGateCseExamSlug } from '@/features/mock-test/lib/gateCseBlueprint';

export async function GET(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const examCategory = searchParams.get('category') || 'gate-cse';
    const subject = searchParams.get('subject') || null;

    if (!isGateCseExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'Only for gate-cse' },
        { status: 400 }
      );
    }

    const chapters = await listGateCseChapters({ subject });
    const subjects = [...new Set(chapters.map((c) => c.subject))].sort();

    return NextResponse.json({
      success: true,
      chapters,
      subjects,
    });
  } catch (err) {
    console.error('gate-cse chapters', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list chapters' },
      { status: 500 }
    );
  }
}
