import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { listKcetChapters, KCET_CHAPTER_DEFAULTS } from '@/features/mock-test/lib/kcetChapterMock';
import { isKcetExamSlug } from '@/features/mock-test/lib/kcetBlueprint';

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
    const examCategory = searchParams.get('category') || 'kcet';
    const subject = searchParams.get('subject') || null;
    if (!isKcetExamSlug(examCategory)) {
      return NextResponse.json({ success: false, error: 'Only for kcet' }, { status: 400 });
    }

    const chapters = await listKcetChapters({ subject });
    const subjects = [...new Set(chapters.map((c) => c.subject))].sort();
    return NextResponse.json({
      success: true,
      subjects,
      chapters,
      defaults: KCET_CHAPTER_DEFAULTS,
    });
  } catch (err) {
    console.error('kcet chapters list', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list chapters' },
      { status: 500 }
    );
  }
}
