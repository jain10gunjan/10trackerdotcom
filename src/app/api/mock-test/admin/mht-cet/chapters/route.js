import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { listMhtCetChapters } from '@/features/mock-test/lib/mhtCetChapterMock';
import { isMhtCetExamSlug } from '@/features/mock-test/lib/mhtCetBlueprint';

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
    const examCategory = searchParams.get('category') || 'mht-cet';
    const subject = searchParams.get('subject') || null;

    if (!isMhtCetExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'Only for mht-cet' },
        { status: 400 }
      );
    }

    const chapters = await listMhtCetChapters({ subject });
    const subjects = [...new Set(chapters.map((c) => c.subject))].sort();

    return NextResponse.json({
      success: true,
      subjects,
      chapters,
      defaults: { totalQuestions: 20 },
    });
  } catch (err) {
    console.error('mht-cet chapters list', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list chapters' },
      { status: 500 }
    );
  }
}
