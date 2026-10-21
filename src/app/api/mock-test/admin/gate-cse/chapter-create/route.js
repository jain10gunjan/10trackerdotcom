import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { createGateChapterMock } from '@/features/mock-test/lib/gateChapterMock';
import { isGateCseExamSlug } from '@/features/mock-test/lib/gateCseBlueprint';

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
      examCategory = 'gate-cse',
      subject,
      chapter,
      totalQuestions = 20,
      durationMinutes = 45,
      addToMotdPool = false,
      name = null,
    } = body || {};

    if (!isGateCseExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'Only for gate-cse' },
        { status: 400 }
      );
    }

    if (!subject || !chapter) {
      return NextResponse.json(
        { success: false, error: 'subject and chapter are required' },
        { status: 400 }
      );
    }

    const created = await createGateChapterMock({
      subject,
      chapter,
      totalQuestions,
      durationMinutes,
      createdBy: userEmail || 'admin',
      addToMotdPool: Boolean(addToMotdPool),
      name,
    });

    if (!created.ok) {
      return NextResponse.json(
        {
          success: false,
          error: created.error || 'Not enough questions',
          available: created.available,
          needed: created.needed,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Created chapter mock (${created.questionCount} Q)`,
      test: created.test,
      available: created.available,
      poolItem: created.poolItem,
      poolError: created.poolError
        ? String(created.poolError.message || created.poolError)
        : null,
    });
  } catch (err) {
    console.error('gate-cse chapter-create', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Create failed' },
      { status: 500 }
    );
  }
}
