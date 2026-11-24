import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  createViteeeMockFromPicks,
  previewViteeePaper,
} from '@/features/mock-test/lib/viteeeGenerator';
import { VITEEE_PAPER, isViteeeExamSlug } from '@/features/mock-test/lib/viteeeBlueprint';

const SECTION_BY_INDEX = [
  { until: 40, subject: 'Mathematics' },
  { until: 75, subject: 'Physics' },
  { until: 110, subject: 'Chemistry' },
  { until: 120, subject: 'Aptitude' },
  { until: 125, subject: 'English' },
];

function sectionForIndex(index) {
  return SECTION_BY_INDEX.find((section) => index < section.until)?.subject || 'Unknown';
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
      examCategory = 'viteee',
      questionIds = null,
      name = null,
      addToMotdPool = false,
      rePreview = false,
    } = body || {};

    if (!isViteeeExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for viteee' },
        { status: 400 }
      );
    }

    let picks;
    if (rePreview || !Array.isArray(questionIds) || questionIds.length === 0) {
      const preview = await previewViteeePaper({});
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
      if (questionIds.length !== VITEEE_PAPER.totalQuestions) {
        return NextResponse.json(
          { success: false, error: `Need exactly ${VITEEE_PAPER.totalQuestions} question IDs` },
          { status: 400 }
        );
      }
      const supabase = getSupabaseAdmin();
      const { data: rows, error } = await supabase
        .from('examtracker').or('verification_status.is.null,verification_status.not.in.(unpublished_draft,publish_rejected)')
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

    const created = await createViteeeMockFromPicks({
      picks,
      name,
      createdBy: userEmail || 'admin',
      addToMotdPool: Boolean(addToMotdPool),
    });

    return NextResponse.json({
      success: true,
      message: `Created VITEEE mock (${created.questionCount} Q, 500 marks, +4/−1)`,
      test: created.test,
      poolItem: created.poolItem,
      poolError: created.poolError ? String(created.poolError.message || created.poolError) : null,
    });
  } catch (err) {
    console.error('viteee create', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Create failed' },
      { status: 500 }
    );
  }
}
