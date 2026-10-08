import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import { normalizeVendorTestPayload } from '@/features/vendor-tests/lib/vendorTestNormalize';

async function loadTest(supabase, vendorId, testId) {
  const { data, error } = await supabase
    .from('vendor_tests')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('id', testId)
    .maybeSingle();
  return { test: data, error };
}

/** GET one test (+ question ids for staff) */
export async function GET(_request, { params }) {
  const { slug, testId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  const { test, error: tErr } = await loadTest(ctx.supabase, ctx.vendor.id, testId);
  if (tErr) {
    return NextResponse.json({ success: false, error: tErr.message }, { status: 500 });
  }
  if (!test) {
    return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
  }

  if (!ctx.permissions.manageTests && test.status !== 'published') {
    return NextResponse.json({ success: false, error: 'Test not available' }, { status: 404 });
  }

  const { data: pins } = await ctx.supabase
    .from('vendor_test_questions')
    .select('question_id, question_order, marks')
    .eq('vendor_id', ctx.vendor.id)
    .eq('test_id', testId)
    .order('question_order', { ascending: true });

  return NextResponse.json({
    success: true,
    test,
    questionPins: pins || [],
  });
}

/** PATCH — update config / publish / archive */
export async function PATCH(request, { params }) {
  const { slug, testId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;
  if (!ctx.permissions.manageTests) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { test, error: tErr } = await loadTest(ctx.supabase, ctx.vendor.id, testId);
    if (tErr || !test) {
      return NextResponse.json(
        { success: false, error: tErr?.message || 'Test not found' },
        { status: tErr ? 500 : 404 }
      );
    }

    const n = normalizeVendorTestPayload(body, { partial: true });
    if (!n.ok) {
      return NextResponse.json({ success: false, error: n.error }, { status: 400 });
    }

    // Publishing requires ≥1 question
    if (n.data.status === 'published') {
      const { count } = await ctx.supabase
        .from('vendor_test_questions')
        .select('id', { count: 'exact', head: true })
        .eq('test_id', testId)
        .eq('vendor_id', ctx.vendor.id);
      if (!count) {
        return NextResponse.json(
          { success: false, error: 'Add at least one question before publishing' },
          { status: 400 }
        );
      }
      n.data.total_questions = count;
    }

    n.data.updated_at = new Date().toISOString();

    const { data, error: upError } = await ctx.supabase
      .from('vendor_tests')
      .update(n.data)
      .eq('vendor_id', ctx.vendor.id)
      .eq('id', testId)
      .select()
      .single();

    if (upError) {
      return NextResponse.json({ success: false, error: upError.message }, { status: 500 });
    }

    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: n.data.status ? `test.${n.data.status}` : 'test.updated',
      entityType: 'vendor_test',
      entityId: testId,
      details: n.data,
    });

    return NextResponse.json({ success: true, test: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** DELETE — only draft/archived */
export async function DELETE(_request, { params }) {
  const { slug, testId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;
  if (!ctx.permissions.manageTests) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const { test, error: tErr } = await loadTest(ctx.supabase, ctx.vendor.id, testId);
  if (tErr || !test) {
    return NextResponse.json(
      { success: false, error: tErr?.message || 'Test not found' },
      { status: tErr ? 500 : 404 }
    );
  }
  if (test.status === 'published') {
    return NextResponse.json(
      { success: false, error: 'Archive the test before deleting' },
      { status: 400 }
    );
  }

  const { error: delError } = await ctx.supabase
    .from('vendor_tests')
    .delete()
    .eq('vendor_id', ctx.vendor.id)
    .eq('id', testId);

  if (delError) {
    return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
  }

  await writeVendorAuditLog(ctx.supabase, {
    vendorId: ctx.vendor.id,
    actorEmail: ctx.email,
    action: 'test.deleted',
    entityType: 'vendor_test',
    entityId: testId,
  });

  return NextResponse.json({ success: true });
}
