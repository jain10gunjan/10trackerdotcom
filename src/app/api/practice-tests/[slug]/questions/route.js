import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import {
  normalizeVendorQuestion,
  toVendorQuestionInsert,
  fromVendorQuestionRow,
  normalizeQuestionText,
} from '@/features/vendor-tests/lib/vendorQuestionNormalize';
import { insertVendorQuestions } from '@/features/vendor-tests/lib/vendorQuestionDb';
import { backfillMissingOptionsFromPlatform } from '@/features/vendor-tests/lib/backfillQuestionOptions';

const LIST_COLUMNS =
  '_id, topic, category, subject, chapter, difficulty, year, question, options_a, options_b, options_c, options_d, correct_option, solution, directionhtml, questionimage, source, source_question_id, created_by, created_at, updated_at';

/** GET — list vendor questions (staff+) */
export async function GET(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');
  const category = searchParams.get('category');
  const subject = searchParams.get('subject');
  const chapter = searchParams.get('chapter');
  const difficulty = searchParams.get('difficulty');
  const q = String(searchParams.get('q') || '').trim();
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 50));
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0);

  let query = ctx.supabase
    .from('vendor_questions')
    .select(LIST_COLUMNS, { count: 'exact' })
    .eq('vendor_id', ctx.vendor.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (topic) query = query.eq('topic', topic);
  if (category) query = query.eq('category', category.toUpperCase());
  if (subject) query = query.eq('subject', subject);
  if (chapter) query = query.eq('chapter', chapter);
  if (difficulty) query = query.eq('difficulty', difficulty.toLowerCase());
  if (q) query = query.ilike('question', `%${q}%`);

  const { data, error: listError, count } = await query;
  if (listError) {
    return NextResponse.json({ success: false, error: listError.message }, { status: 500 });
  }

  const enriched = await backfillMissingOptionsFromPlatform(
    ctx.supabase,
    (data || []).map(fromVendorQuestionRow)
  );

  return NextResponse.json({
    success: true,
    questions: enriched.map(fromVendorQuestionRow),
    count: count ?? enriched.length,
    limit,
    offset,
  });
}

/** POST — create one question (manual) */
export async function POST(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;
  if (!ctx.permissions.manageTests) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const n = normalizeVendorQuestion(body?.question || body, {
      defaults: body?.defaults || {},
      forceNewId: true,
    });
    if (!n.ok) {
      return NextResponse.json({ success: false, error: n.error }, { status: 400 });
    }

    const dup = await findDuplicate(ctx.supabase, ctx.vendor.id, n.row.question);
    if (dup) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate question text already exists in this vendor bank',
          duplicateId: dup._id,
        },
        { status: 409 }
      );
    }

    const insert = toVendorQuestionInsert(n.row, {
      vendorId: ctx.vendor.id,
      source: 'manual',
      createdBy: ctx.email,
    });

    const { data: inserted, error: insertError } = await insertVendorQuestions(
      ctx.supabase,
      [insert]
    );

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    const data = inserted?.[0];
    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: 'question.created',
      entityType: 'vendor_question',
      entityId: data?._id,
      details: { topic: insert.topic, category: insert.category },
    });

    return NextResponse.json({
      success: true,
      question: fromVendorQuestionRow(data || insert),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** PATCH — update question by _id */
export async function PATCH(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;
  if (!ctx.permissions.manageTests) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = body._id || body.id;
    if (!id) {
      return NextResponse.json({ success: false, error: '_id required' }, { status: 400 });
    }

    const n = normalizeVendorQuestion({ ...body, _id: id }, { keepId: true });
    if (!n.ok) {
      return NextResponse.json({ success: false, error: n.error }, { status: 400 });
    }

    const insert = toVendorQuestionInsert(n.row, {
      vendorId: ctx.vendor.id,
      source: body.source || 'manual',
      sourceQuestionId: body.source_question_id || null,
      createdBy: ctx.email,
    });
    // Don't overwrite created_by / source on update unless provided
    delete insert.created_by;
    if (!body.source) delete insert.source;

    const { data, error: upError } = await ctx.supabase
      .from('vendor_questions')
      .update(insert)
      .eq('vendor_id', ctx.vendor.id)
      .eq('_id', id)
      .select()
      .maybeSingle();

    if (upError) {
      return NextResponse.json({ success: false, error: upError.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: 'question.updated',
      entityType: 'vendor_question',
      entityId: id,
    });

    return NextResponse.json({
      success: true,
      question: fromVendorQuestionRow(data),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** DELETE ?id= */
export async function DELETE(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;
  if (!ctx.permissions.manageTests) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  let id = searchParams.get('id');
  if (!id) {
    try {
      const body = await request.json();
      id = body.id || body._id;
    } catch {
      /* empty */
    }
  }
  if (!id) {
    return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
  }

  const { error: delError } = await ctx.supabase
    .from('vendor_questions')
    .delete()
    .eq('vendor_id', ctx.vendor.id)
    .eq('_id', id);

  if (delError) {
    return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
  }

  await writeVendorAuditLog(ctx.supabase, {
    vendorId: ctx.vendor.id,
    actorEmail: ctx.email,
    action: 'question.deleted',
    entityType: 'vendor_question',
    entityId: id,
  });

  return NextResponse.json({ success: true });
}

async function findDuplicate(supabase, vendorId, questionHtml) {
  const needle = normalizeQuestionText(questionHtml);
  if (!needle) return null;
  const { data } = await supabase
    .from('vendor_questions')
    .select('_id, question')
    .eq('vendor_id', vendorId)
    .limit(500);
  return (data || []).find((r) => normalizeQuestionText(r.question) === needle) || null;
}
