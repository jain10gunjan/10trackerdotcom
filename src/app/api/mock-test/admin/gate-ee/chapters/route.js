import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { listGateEeChapters } from '@/features/mock-test/lib/gateEeChapterMock';
import { isGateEeExamSlug } from '@/features/mock-test/lib/gateEeBlueprint';

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
    const examCategory = searchParams.get('category') || 'gate-ee';
    const subject = searchParams.get('subject') || null;

    if (!isGateEeExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'Only for gate-ee' },
        { status: 400 }
      );
    }

    const chapters = await listGateEeChapters({ subject });
    const subjects = [...new Set(chapters.map((c) => c.subject))].sort();

    return NextResponse.json({
      success: true,
      chapters,
      subjects,
      defaults: { totalQuestions: 20, durationMinutes: 45 },
    });
  } catch (err) {
    console.error('gate-ee chapters', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list chapters' },
      { status: 500 }
    );
  }
}
