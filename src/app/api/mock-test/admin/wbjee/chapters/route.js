import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { listWbjeeChapters, WBJEE_CHAPTER_DEFAULTS } from '@/features/mock-test/lib/wbjeeChapterMock';
import { isWbjeeExamSlug } from '@/features/mock-test/lib/wbjeeBlueprint';

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
    const examCategory = searchParams.get('category') || 'wbjee';
    const subject = searchParams.get('subject') || null;
    if (!isWbjeeExamSlug(examCategory)) {
      return NextResponse.json({ success: false, error: 'Only for wbjee' }, { status: 400 });
    }

    const chapters = await listWbjeeChapters({ subject });
    const subjects = [...new Set(chapters.map((c) => c.subject))].sort();
    return NextResponse.json({
      success: true,
      subjects,
      chapters,
      defaults: WBJEE_CHAPTER_DEFAULTS,
    });
  } catch (err) {
    console.error('wbjee chapters list', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list chapters' },
      { status: 500 }
    );
  }
}
