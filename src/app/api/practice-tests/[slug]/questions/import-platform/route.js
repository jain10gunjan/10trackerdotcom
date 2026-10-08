import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import {
  normalizeVendorQuestion,
  toVendorQuestionInsert,
} from '@/features/vendor-tests/lib/vendorQuestionNormalize';
import { insertVendorQuestions } from '@/features/vendor-tests/lib/vendorQuestionDb';
import {
  applyCategoryFilter,
  applySubjectFilter,
  applyChapterFilter,
  EXAMTRACKER_LIST_COLUMNS,
} from '@/lib/examtrackerFilters';

const MAX_IMPORT = 100;

/**
 * GET — search platform examtracker (preview, no copy)
 * Query: category, subject, chapter, topic, difficulty, q, limit, offset
 */
export async function GET(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const subject = searchParams.get('subject');
  const chapter = searchParams.get('chapter');
  const topic = searchParams.get('topic');
  const difficulty = searchParams.get('difficulty');
  const q = String(searchParams.get('q') || '').trim();
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0);

  let query = ctx.supabase
    .from('examtracker')
    .select(EXAMTRACKER_LIST_COLUMNS, { count: 'exact' })
    .order('year', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (category) query = applyCategoryFilter(query, category);
  if (subject) query = applySubjectFilter(query, subject);
  if (chapter) query = applyChapterFilter(query, chapter);
  if (topic) query = query.eq('topic', topic);
  if (difficulty) query = query.eq('difficulty', difficulty.toLowerCase());
  if (q) query = query.ilike('question', `%${q}%`);

  const { data, error: listError, count } = await query;
  if (listError) {
    return NextResponse.json({ success: false, error: listError.message }, { status: 500 });
  }

  // Strip nothing for admin preview — they need correct_option to decide. Student never hits this.
  return NextResponse.json({
    success: true,
    questions: data || [],
    count: count ?? (data || []).length,
    limit,
    offset,
  });
}

/**
 * POST — copy selected platform questions into vendor bank (new _ids)
 * Body: { ids: string[] } OR { filters: { category, subject, chapter, topic, difficulty }, limit? }
 */
export async function POST(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;
  if (!ctx.permissions.manageTests) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    let sourceRows = [];

    if (Array.isArray(body.ids) && body.ids.length) {
      if (body.ids.length > MAX_IMPORT) {
        return NextResponse.json(
          { success: false, error: `Max ${MAX_IMPORT} questions per import` },
          { status: 400 }
        );
      }
      const { data, error: fetchError } = await ctx.supabase
        .from('examtracker')
        .select(EXAMTRACKER_LIST_COLUMNS)
        .in('_id', body.ids.map(String));
      if (fetchError) {
        return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
      }
      sourceRows = data || [];
    } else if (body.filters && typeof body.filters === 'object') {
      const limit = Math.min(MAX_IMPORT, Math.max(1, Number(body.limit) || 20));
      let query = ctx.supabase
        .from('examtracker')
        .select(EXAMTRACKER_LIST_COLUMNS)
        .limit(limit);
      const f = body.filters;
      if (f.category) query = applyCategoryFilter(query, f.category);
      if (f.subject) query = applySubjectFilter(query, f.subject);
      if (f.chapter) query = applyChapterFilter(query, f.chapter);
      if (f.topic) query = query.eq('topic', f.topic);
      if (f.difficulty) query = query.eq('difficulty', String(f.difficulty).toLowerCase());
      const { data, error: fetchError } = await query;
      if (fetchError) {
        return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
      }
      sourceRows = data || [];
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide ids[] or filters{}' },
        { status: 400 }
      );
    }

    if (!sourceRows.length) {
      return NextResponse.json({ success: false, error: 'No platform questions found' }, { status: 404 });
    }

    // Skip already-copied (same source_question_id)
    const sourceIds = sourceRows.map((r) => String(r._id));
    const { data: already } = await ctx.supabase
      .from('vendor_questions')
      .select('source_question_id')
      .eq('vendor_id', ctx.vendor.id)
      .in('source_question_id', sourceIds);

    const alreadySet = new Set((already || []).map((r) => r.source_question_id));
    const toCopy = sourceRows.filter((r) => !alreadySet.has(String(r._id)));
    const skipped = sourceRows.length - toCopy.length;

    const inserts = [];
    const rowErrors = [];
    for (const src of toCopy) {
      const n = normalizeVendorQuestion(src, { forceNewId: true });
      if (!n.ok) {
        rowErrors.push({ sourceId: src._id, error: n.error });
        continue;
      }
      inserts.push(
        toVendorQuestionInsert(n.row, {
          vendorId: ctx.vendor.id,
          source: 'copied_from_platform',
          sourceQuestionId: String(src._id),
          createdBy: ctx.email,
        })
      );
    }

    if (!inserts.length) {
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped,
        message: skipped
          ? 'All selected questions were already imported'
          : 'Nothing to import',
        rowErrors,
      });
    }

    const { data: saved, error: insertError } = await insertVendorQuestions(
      ctx.supabase,
      inserts
    );

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: 'questions.imported_from_platform',
      entityType: 'vendor_question',
      details: { imported: saved?.length || 0, skipped },
    });

    return NextResponse.json({
      success: true,
      imported: saved?.length || 0,
      skipped,
      questions: saved || [],
      rowErrors,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
