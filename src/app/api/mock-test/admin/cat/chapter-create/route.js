import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { createCatTopicMock, CAT_TOPIC_DEFAULTS } from '@/features/mock-test/lib/catTopicMock';
import { isCatExamSlug } from '@/features/mock-test/lib/catBlueprint';

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
      examCategory = 'cat',
      subject,
      chapter,
      totalQuestions = CAT_TOPIC_DEFAULTS.totalQuestions,
      durationMinutes = CAT_TOPIC_DEFAULTS.durationMinutes,
      addToMotdPool = false,
      name = null,
    } = body || {};

    if (!isCatExamSlug(examCategory)) {
      return NextResponse.json({ success: false, error: 'Only for cat' }, { status: 400 });
    }
    if (!subject || !chapter) {
      return NextResponse.json(
        { success: false, error: 'subject and chapter are required' },
        { status: 400 }
      );
    }

    const result = await createCatTopicMock({
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
          error: result.error || 'Not enough questions in this topic',
          available: result.available,
          needed: result.needed,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Created ${result.questionCount}Q topic mock for ${result.subject} / ${result.chapter}`,
      test: result.test,
      questionCount: result.questionCount,
      available: result.available,
      durationMinutes: result.durationMinutes,
      poolItem: result.poolItem,
      poolError: result.poolError ? String(result.poolError.message || result.poolError) : null,
    });
  } catch (err) {
    console.error('cat topic-create', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Create failed' },
      { status: 500 }
    );
  }
}
