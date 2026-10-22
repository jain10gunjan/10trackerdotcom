import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import {
  createViteeeChapterMock,
  VITEEE_CHAPTER_DEFAULTS,
} from '@/features/mock-test/lib/viteeeChapterMock';
import { isViteeeExamSlug } from '@/features/mock-test/lib/viteeeBlueprint';

export async function POST(request) {
  const { isAdmin, userEmail, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const {
      examCategory = 'viteee',
      subject,
      chapter,
      totalQuestions = VITEEE_CHAPTER_DEFAULTS.totalQuestions,
      durationMinutes = VITEEE_CHAPTER_DEFAULTS.durationMinutes,
      addToMotdPool = false,
      name = null,
    } = body || {};

    if (!isViteeeExamSlug(examCategory)) {
      return NextResponse.json({ success: false, error: 'Only for viteee' }, { status: 400 });
    }
    if (!subject || !chapter) {
      return NextResponse.json(
        { success: false, error: 'subject and chapter are required' },
        { status: 400 }
      );
    }

    const result = await createViteeeChapterMock({
      subject: String(subject).trim(),
      chapter: String(chapter).trim(),
      totalQuestions,
      durationMinutes,
      createdBy: userEmail || 'admin',
      addToMotdPool: Boolean(addToMotdPool),
      name,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Not enough questions in this chapter',
          available: result.available,
          needed: result.needed,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Created ${result.questionCount}Q chapter mock for ${result.subject} / ${result.chapter}`,
      test: result.test,
      questionCount: result.questionCount,
      available: result.available,
      durationMinutes: result.durationMinutes,
      poolItem: result.poolItem,
      poolError: result.poolError ? String(result.poolError.message || result.poolError) : null,
    });
  } catch (err) {
    console.error('viteee chapter-create', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Create failed' },
      { status: 500 }
    );
  }
}
