import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  createJeeMainMockFromPicks,
  previewJeeMainPaper,
} from '@/features/mock-test/lib/jeeMainGenerator';
import {
  JEE_MAIN_PAPER,
  isJeeMainExamSlug,
} from '@/features/mock-test/lib/jeeMainBlueprint';
import { hasPopulatedOptions } from '@/lib/questionAnswerMode';

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
      examCategory = 'jee-main',
      questionIds = null,
      name = null,
      addToMotdPool = false,
      rePreview = false,
    } = body || {};

    if (!isJeeMainExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for jee-main' },
        { status: 400 }
      );
    }

    let picks;

    if (rePreview || !Array.isArray(questionIds) || questionIds.length === 0) {
      const preview = await previewJeeMainPaper({});
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
      if (questionIds.length !== JEE_MAIN_PAPER.totalQuestions) {
        return NextResponse.json(
          {
            success: false,
            error: `Need exactly ${JEE_MAIN_PAPER.totalQuestions} question IDs`,
          },
          { status: 400 }
        );
      }

      const supabase = getSupabaseAdmin();
      const { data: rows, error } = await supabase
        .from('examtracker')
        .select(
          '_id, subject, chapter, chapter_slug, topic, difficulty, options_A, options_B, options_C, options_D'
        )
        .in('_id', questionIds);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      const byId = new Map((rows || []).map((r) => [String(r._id), r]));
      picks = questionIds.map((id) => {
        const row = byId.get(String(id));
        if (!row) throw new Error(`Question not found: ${id}`);
        return {
          ...row,
          _section: hasPopulatedOptions(row) ? 'A' : 'B',
          _qType: hasPopulatedOptions(row) ? 'mcq' : 'nvq',
        };
      });
    }

    const created = await createJeeMainMockFromPicks({
      picks,
      name,
      createdBy: userEmail || 'admin',
      addToMotdPool: Boolean(addToMotdPool),
    });

    return NextResponse.json({
      success: true,
      message: `Created JEE Main mock (${created.questionCount} Q)`,
      test: created.test,
      poolItem: created.poolItem,
      poolError: created.poolError ? String(created.poolError.message || created.poolError) : null,
    });
  } catch (err) {
    console.error('jee-main create', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Create failed' },
      { status: 500 }
    );
  }
}
