import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import {
  VENDOR_JSON_TEMPLATE,
  parseVendorQuestionsJson,
} from '@/features/vendor-tests/lib/vendorJson';
import {
  normalizeVendorQuestion,
  toVendorQuestionInsert,
  normalizeQuestionText,
} from '@/features/vendor-tests/lib/vendorQuestionNormalize';
import { insertVendorQuestions } from '@/features/vendor-tests/lib/vendorQuestionDb';

const MAX_ROWS = 500;

/** GET — download JSON template */
export async function GET(_request, { params }) {
  const { slug } = await params;
  const { error } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  return new NextResponse(JSON.stringify(VENDOR_JSON_TEMPLATE, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="vendor-questions-template.json"',
    },
  });
}

/**
 * POST — validate and/or import JSON
 * Body: { json: string|object|array, dryRun?: boolean, defaults?: object }
 *   or raw array / { questions: [...] } as the body itself
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
    const dryRun = body?.dryRun !== false;
    const defaults =
      body?.defaults && typeof body.defaults === 'object' ? body.defaults : {};

    const payload =
      body?.json !== undefined
        ? body.json
        : body?.questions !== undefined || Array.isArray(body)
          ? body
          : null;

    if (payload == null) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Provide { "json": [...] } or { "questions": [...] } or a raw JSON array',
        },
        { status: 400 }
      );
    }

    const parsed = parseVendorQuestionsJson(payload);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    if (parsed.objects.length > MAX_ROWS) {
      return NextResponse.json(
        { success: false, error: `Max ${MAX_ROWS} questions per upload` },
        { status: 400 }
      );
    }

    const { data: existing } = await ctx.supabase
      .from('vendor_questions')
      .select('_id, question')
      .eq('vendor_id', ctx.vendor.id)
      .limit(2000);

    const existingTexts = new Set(
      (existing || []).map((r) => normalizeQuestionText(r.question)).filter(Boolean)
    );
    const batchTexts = new Set();

    const valid = [];
    const rowErrors = [];
    let skippedCount = 0;

    for (const item of parsed.objects) {
      if (!item.data || typeof item.data !== 'object' || Array.isArray(item.data)) {
        rowErrors.push({ row: item.rowIndex, error: 'Each item must be a JSON object' });
        continue;
      }
      const n = normalizeVendorQuestion(item.data, { defaults, forceNewId: true });
      if (!n.ok) {
        rowErrors.push({ row: item.rowIndex, error: n.error });
        continue;
      }
      const textKey = normalizeQuestionText(n.row.question);
      if (!textKey) {
        rowErrors.push({ row: item.rowIndex, error: 'Empty question text' });
        continue;
      }
      // Same question already in bank or earlier in this file → skip (not an error)
      if (existingTexts.has(textKey) || batchTexts.has(textKey)) {
        skippedCount += 1;
        continue;
      }
      batchTexts.add(textKey);
      valid.push(n.row);
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        validCount: valid.length,
        skippedCount,
        errorCount: rowErrors.length,
        rowErrors: rowErrors.slice(0, 100),
        preview: valid.slice(0, 5),
      });
    }

    if (!valid.length) {
      if (!rowErrors.length) {
        return NextResponse.json({
          success: true,
          dryRun: false,
          savedCount: 0,
          skippedCount,
          errorCount: 0,
          rowErrors: [],
        });
      }
      return NextResponse.json(
        {
          success: false,
          error: 'No valid questions to import',
          skippedCount,
          rowErrors: rowErrors.slice(0, 100),
        },
        { status: 400 }
      );
    }

    const inserts = valid.map((row) =>
      toVendorQuestionInsert(row, {
        vendorId: ctx.vendor.id,
        source: 'json',
        createdBy: ctx.email,
      })
    );

    let saved = 0;
    for (let i = 0; i < inserts.length; i += 100) {
      const chunk = inserts.slice(i, i + 100);
      const { data: chunkData, error: insertError } = await insertVendorQuestions(
        ctx.supabase,
        chunk
      );
      if (insertError) {
        // Likely source check constraint if migration not applied
        if (/source|check/i.test(insertError.message || '')) {
          const fallback = chunk.map((r) => ({ ...r, source: 'csv' }));
          const retry = await insertVendorQuestions(ctx.supabase, fallback);
          if (retry.error) {
            return NextResponse.json(
              {
                success: false,
                error: retry.error.message,
                savedCount: saved,
                rowErrors: rowErrors.slice(0, 100),
              },
              { status: 500 }
            );
          }
          saved += retry.data?.length || fallback.length;
          continue;
        }
        return NextResponse.json(
          {
            success: false,
            error: insertError.message,
            savedCount: saved,
            rowErrors: rowErrors.slice(0, 100),
          },
          { status: 500 }
        );
      }
      saved += chunkData?.length || chunk.length;
    }

    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: 'questions.json_imported',
      entityType: 'vendor_question',
      details: { saved, skippedCount, errorCount: rowErrors.length },
    });

    return NextResponse.json({
      success: true,
      dryRun: false,
      savedCount: saved,
      skippedCount,
      errorCount: rowErrors.length,
      rowErrors: rowErrors.slice(0, 100),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
