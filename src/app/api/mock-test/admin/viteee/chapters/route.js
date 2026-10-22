import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { listViteeeChapters, VITEEE_CHAPTER_DEFAULTS } from '@/features/mock-test/lib/viteeeChapterMock';
import { isViteeeExamSlug } from '@/features/mock-test/lib/viteeeBlueprint';

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
    const examCategory = searchParams.get('category') || 'viteee';
    const subject = searchParams.get('subject') || null;
    if (!isViteeeExamSlug(examCategory)) {
      return NextResponse.json({ success: false, error: 'Only for viteee' }, { status: 400 });
    }

    const chapters = await listViteeeChapters({ subject });
    const subjects = [...new Set(chapters.map((c) => c.subject))].sort();
    return NextResponse.json({
      success: true,
      subjects,
      chapters,
      defaults: VITEEE_CHAPTER_DEFAULTS,
    });
  } catch (err) {
    console.error('viteee chapters list', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list chapters' },
      { status: 500 }
    );
  }
}
