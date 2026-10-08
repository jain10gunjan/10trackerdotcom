import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import {
  VENDOR_CSV_TEMPLATE,
  parseCsvText,
  csvRowsToObjects,
} from '@/features/vendor-tests/lib/vendorCsv';
import {
  normalizeVendorQuestion,
  toVendorQuestionInsert,
  normalizeQuestionText,
} from '@/features/vendor-tests/lib/vendorQuestionNormalize';
import { insertVendorQuestions } from '@/features/vendor-tests/lib/vendorQuestionDb';

const MAX_ROWS = 500;

/** GET — download CSV template */
export async function GET(_request, { params }) {
  const { slug } = await params;
  const { error } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  return new NextResponse(VENDOR_CSV_TEMPLATE, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="vendor-questions-template.csv"',
    },
  });
}

/**
 * POST — validate and/or import CSV
 * Body: { csv: string, dryRun?: boolean, defaults?: object }
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
    const csv = body.csv;
    const dryRun = body.dryRun !== false; // default preview
    const defaults = body.defaults && typeof body.defaults === 'object' ? body.defaults : {};

    if (!csv || typeof csv !== 'string') {
      return NextResponse.json({ success: false, error: 'csv string required' }, { status: 400 });
    }

    const rows = parseCsvText(csv);
    const parsed = csvRowsToObjects(rows);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    if (parsed.objects.length > MAX_ROWS) {
      return NextResponse.json(
        { success: false, error: `Max ${MAX_ROWS} rows per upload` },
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
      // Re-upload of the same file: all skipped, no real errors → success
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
          error: 'No valid rows to import',
          skippedCount,
          rowErrors: rowErrors.slice(0, 100),
        },
        { status: 400 }
      );
    }

    const inserts = valid.map((row) =>
      toVendorQuestionInsert(row, {
        vendorId: ctx.vendor.id,
        source: 'csv',
        createdBy: ctx.email,
      })
    );

    // Insert in chunks of 100
    let saved = 0;
    for (let i = 0; i < inserts.length; i += 100) {
      const chunk = inserts.slice(i, i + 100);
      const { data: chunkData, error: insertError } = await insertVendorQuestions(
        ctx.supabase,
        chunk
      );
      if (insertError) {
        return NextResponse.json(
          {
            success: false,
            error: insertError.message,
            savedCount: saved,
            skippedCount,
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
      action: 'questions.csv_imported',
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
