import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { listGateEcChapters } from '@/features/mock-test/lib/gateEcChapterMock';
import { isGateEcExamSlug } from '@/features/mock-test/lib/gateEcBlueprint';

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
    const examCategory = searchParams.get('category') || 'gate-ec';
    const subject = searchParams.get('subject') || null;

    if (!isGateEcExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'Only for gate-ec' },
        { status: 400 }
      );
    }

    const chapters = await listGateEcChapters({ subject });
    const subjects = [...new Set(chapters.map((c) => c.subject))].sort();

    return NextResponse.json({
      success: true,
      chapters,
      subjects,
      defaults: { totalQuestions: 20, durationMinutes: 45 },
    });
  } catch (err) {
    console.error('gate-ec chapters', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list chapters' },
      { status: 500 }
    );
  }
}
