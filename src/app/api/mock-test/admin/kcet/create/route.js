import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createKcetMockFromPicks, previewKcetPaper } from '@/features/mock-test/lib/kcetGenerator';
import { KCET_PAPER, isKcetExamSlug } from '@/features/mock-test/lib/kcetBlueprint';

function sectionForIndex(index) {
  if (index < 60) return 'Physics';
  if (index < 120) return 'Chemistry';
  return 'Mathematics';
}

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
      examCategory = 'kcet',
      questionIds = null,
      name = null,
      addToMotdPool = false,
      rePreview = false,
    } = body || {};

    if (!isKcetExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for kcet' },
        { status: 400 }
      );
    }

    let picks;
    if (rePreview || !Array.isArray(questionIds) || questionIds.length === 0) {
      const preview = await previewKcetPaper({});
      if (!preview.ok) {
        return NextResponse.json(
          {
            success: false,
            error: 'Blueprint shortfall — cannot create test',
            audit: preview.subjects.map((s) => ({ subject: s.subject, audit: s.audit })),
          },
          { status: 422 }
        );
      }
      picks = preview.picks;
    } else {
      if (questionIds.length !== KCET_PAPER.totalQuestions) {
        return NextResponse.json(
          { success: false, error: `Need exactly ${KCET_PAPER.totalQuestions} question IDs` },
          { status: 400 }
        );
      }
      const supabase = getSupabaseAdmin();
      const { data: rows, error } = await supabase
        .from('examtracker')
        .select('_id, subject, chapter, topic, difficulty, options_A, options_B, options_C, options_D')
        .in('_id', questionIds.map(String));
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      const byId = new Map((rows || []).map((row) => [String(row._id), row]));
      picks = questionIds.map((id, index) => {
        const row = byId.get(String(id));
        if (!row) throw new Error(`Question not found: ${id}`);
        return {
          ...row,
          _id: String(row._id),
          subject: row.subject || sectionForIndex(index),
          topic: row.topic || row.chapter || '',
        };
      });
    }

    const created = await createKcetMockFromPicks({
      picks,
      name,
      createdBy: userEmail || 'admin',
      addToMotdPool: Boolean(addToMotdPool),
    });

    return NextResponse.json({
      success: true,
      message: `Created KCET mock (${created.questionCount} Q, 180 marks, no negative marking)`,
      test: created.test,
      poolItem: created.poolItem,
      poolError: created.poolError ? String(created.poolError.message || created.poolError) : null,
    });
  } catch (err) {
    console.error('kcet create', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Create failed' },
      { status: 500 }
    );
  }
}
