import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import { fromVendorQuestionRow } from '@/features/vendor-tests/lib/vendorQuestionNormalize';

/**
 * GET — pinned questions with full bodies (staff only; students get questions via attempt API later)
 */
export async function GET(_request, { params }) {
  const { slug, testId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  const { data: pins, error: pinError } = await ctx.supabase
    .from('vendor_test_questions')
    .select('question_id, question_order, marks')
    .eq('vendor_id', ctx.vendor.id)
    .eq('test_id', testId)
    .order('question_order', { ascending: true });

  if (pinError) {
    return NextResponse.json({ success: false, error: pinError.message }, { status: 500 });
  }

  const ids = (pins || []).map((p) => p.question_id);
  let questions = [];
  if (ids.length) {
    const { data, error: qError } = await ctx.supabase
      .from('vendor_questions')
      .select('*')
      .eq('vendor_id', ctx.vendor.id)
      .in('_id', ids);
    if (qError) {
      return NextResponse.json({ success: false, error: qError.message }, { status: 500 });
    }
    const byId = Object.fromEntries(
      (data || []).map((q) => [q._id, fromVendorQuestionRow(q)])
    );
    questions = (pins || []).map((p) => ({
      ...p,
      question: byId[p.question_id] || null,
    }));
  }

  return NextResponse.json({ success: true, questions });
}

/**
 * PUT — replace question set
 * Body: { questionIds: string[], marks?: number[] }
 */
export async function PUT(request, { params }) {
  const { slug, testId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;
  if (!ctx.permissions.manageTests) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const questionIds = Array.isArray(body.questionIds)
      ? body.questionIds.map(String)
      : [];
    if (questionIds.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Max 200 questions per test' },
        { status: 400 }
      );
    }

    // Verify all questions belong to this vendor
    if (questionIds.length) {
      const { data: owned, error: ownError } = await ctx.supabase
        .from('vendor_questions')
        .select('_id')
        .eq('vendor_id', ctx.vendor.id)
        .in('_id', questionIds);
      if (ownError) {
        return NextResponse.json({ success: false, error: ownError.message }, { status: 500 });
      }
      if ((owned || []).length !== new Set(questionIds).size) {
        return NextResponse.json(
          { success: false, error: 'One or more questions are not in this vendor bank' },
          { status: 400 }
        );
      }
    }

    // Replace set in a simple transaction-like sequence
    const { error: delError } = await ctx.supabase
      .from('vendor_test_questions')
      .delete()
      .eq('vendor_id', ctx.vendor.id)
      .eq('test_id', testId);

    if (delError) {
      return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
    }

    if (questionIds.length) {
      const rows = questionIds.map((qid, index) => ({
        vendor_id: ctx.vendor.id,
        test_id: testId,
        question_id: qid,
        question_order: index + 1,
        marks: Array.isArray(body.marks) && body.marks[index] != null
          ? Number(body.marks[index]) || 1
          : 1,
      }));
      const { error: insError } = await ctx.supabase.from('vendor_test_questions').insert(rows);
      if (insError) {
        return NextResponse.json({ success: false, error: insError.message }, { status: 500 });
      }
    }

    const { error: upError } = await ctx.supabase
      .from('vendor_tests')
      .update({
        total_questions: questionIds.length,
        updated_at: new Date().toISOString(),
      })
      .eq('vendor_id', ctx.vendor.id)
      .eq('id', testId);

    if (upError) {
      return NextResponse.json({ success: false, error: upError.message }, { status: 500 });
    }

    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: 'test.questions_set',
      entityType: 'vendor_test',
      entityId: testId,
      details: { count: questionIds.length },
    });

    return NextResponse.json({ success: true, count: questionIds.length });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
