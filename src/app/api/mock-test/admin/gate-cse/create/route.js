import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  createGateCseMockFromPicks,
  previewGateCsePaper,
} from '@/features/mock-test/lib/gateCseGenerator';
import {
  GATE_CSE_PAPER,
  isGateCseExamSlug,
} from '@/features/mock-test/lib/gateCseBlueprint';
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
      examCategory = 'gate-cse',
      questionIds = null,
      pickMeta = null,
      name = null,
      addToMotdPool = false,
      rePreview = false,
    } = body || {};

    if (!isGateCseExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for gate-cse' },
        { status: 400 }
      );
    }

    let picks;

    if (rePreview || !Array.isArray(questionIds) || questionIds.length === 0) {
      const preview = await previewGateCsePaper({});
      if (!preview.ok) {
        return NextResponse.json(
          {
            success: false,
            error: 'Blueprint shortfall — cannot create test',
            audit: preview.blocks.map((b) => ({
              blockId: b.blockId,
              subject: b.subject,
              audit: b.audit,
            })),
          },
          { status: 422 }
        );
      }
      picks = preview.picks;
    } else {
      if (questionIds.length !== GATE_CSE_PAPER.totalQuestions) {
        return NextResponse.json(
          {
            success: false,
            error: `Need exactly ${GATE_CSE_PAPER.totalQuestions} question IDs`,
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
      const metaById = new Map();
      if (Array.isArray(pickMeta)) {
        pickMeta.forEach((m) => {
          if (m?.id != null) metaById.set(String(m.id), m);
        });
      }

      picks = questionIds.map((id) => {
        const row = byId.get(String(id));
        if (!row) throw new Error(`Question not found: ${id}`);
        const meta = metaById.get(String(id)) || {};
        return {
          ...row,
          _marks: Number(meta.marks) === 2 ? 2 : 1,
          _qType: hasPopulatedOptions(row) ? 'mcq' : 'nat',
          _blueprintKey: meta.blueprintKey || '',
          _blockId: meta.blockId || '',
        };
      });
    }

    const created = await createGateCseMockFromPicks({
      picks,
      name,
      createdBy: userEmail || 'admin',
      addToMotdPool: Boolean(addToMotdPool),
    });

    return NextResponse.json({
      success: true,
      message: `Created GATE CSE mock (${created.questionCount} Q)`,
      test: created.test,
      poolItem: created.poolItem,
      poolError: created.poolError
        ? String(created.poolError.message || created.poolError)
        : null,
    });
  } catch (err) {
    console.error('gate-cse create', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Create failed' },
      { status: 500 }
    );
  }
}
