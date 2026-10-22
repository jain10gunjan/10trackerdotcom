import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  createMhtCetMockFromPicks,
  previewMhtCetPaper,
} from '@/features/mock-test/lib/mhtCetGenerator';
import { MHT_CET_PAPER, isMhtCetExamSlug } from '@/features/mock-test/lib/mhtCetBlueprint';

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
      examCategory = 'mht-cet',
      questionIds = null,
      name = null,
      addToMotdPool = false,
      rePreview = false,
    } = body || {};

    if (!isMhtCetExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for mht-cet' },
        { status: 400 }
      );
    }

    let picks;

    if (rePreview || !Array.isArray(questionIds) || questionIds.length === 0) {
      const preview = await previewMhtCetPaper({});
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
      if (questionIds.length !== MHT_CET_PAPER.totalQuestions) {
        return NextResponse.json(
          {
            success: false,
            error: `Need exactly ${MHT_CET_PAPER.totalQuestions} question IDs`,
          },
          { status: 400 }
        );
      }

      const supabase = getSupabaseAdmin();
      const { data: rows, error } = await supabase
        .from('mhcetquestions')
        .select('id, subject, topic, difficulty, options_A, options_B, options_C, options_D')
        .in(
          'id',
          questionIds.map((id) => (/^\d+$/.test(String(id)) ? Number(id) : id))
        );

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      const byId = new Map((rows || []).map((row) => [String(row.id), row]));
      const missing = questionIds.filter((id) => !byId.has(String(id)));
      if (missing.length) {
        const { data: examRows, error: examError } = await supabase
          .from('examtracker')
          .select('_id, subject, chapter, topic, difficulty, options_A, options_B, options_C, options_D')
          .in('_id', missing.map(String));
        if (examError) {
          return NextResponse.json({ success: false, error: examError.message }, { status: 500 });
        }
        (examRows || []).forEach((row) => byId.set(String(row._id), row));
      }

      picks = questionIds.map((id, index) => {
        const row = byId.get(String(id));
        if (!row) throw new Error(`Question not found: ${id}`);
        const section =
          index < 50 ? 'Physics' : index < 100 ? 'Chemistry' : 'Mathematics';
        return {
          ...row,
          _id: String(row._id ?? row.id),
          subject: row.subject || section,
          _marks: index < 100 ? 1 : 2,
          topic: row.topic || row.chapter || '',
        };
      });
    }

    const created = await createMhtCetMockFromPicks({
      picks,
      name,
      createdBy: userEmail || 'admin',
      addToMotdPool: Boolean(addToMotdPool),
    });

    return NextResponse.json({
      success: true,
      message: `Created MHT-CET mock (${created.questionCount} Q, 200 marks, no negative marking)`,
      test: created.test,
      poolItem: created.poolItem,
      poolError: created.poolError ? String(created.poolError.message || created.poolError) : null,
    });
  } catch (err) {
    console.error('mht-cet create', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Create failed' },
      { status: 500 }
    );
  }
}
