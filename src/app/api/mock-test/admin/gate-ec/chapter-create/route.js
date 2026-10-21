import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { createGateEcChapterMock } from '@/features/mock-test/lib/gateEcChapterMock';
import { isGateEcExamSlug } from '@/features/mock-test/lib/gateEcBlueprint';

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
      examCategory = 'gate-ec',
      subject,
      chapter,
      totalQuestions = 20,
      durationMinutes = 45,
      addToMotdPool = false,
      name = null,
    } = body || {};

    if (!isGateEcExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'Only for gate-ec' },
        { status: 400 }
      );
    }

    if (!subject || !chapter) {
      return NextResponse.json(
        { success: false, error: 'subject and chapter are required' },
        { status: 400 }
      );
    }

    const created = await createGateEcChapterMock({
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
    console.error('gate-ec chapter-create', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Create failed' },
      { status: 500 }
    );
  }
}
