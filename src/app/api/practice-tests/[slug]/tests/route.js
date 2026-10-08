import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import { normalizeVendorTestPayload } from '@/features/vendor-tests/lib/vendorTestNormalize';

/**
 * GET — list tests
 * Students: published only (and inside window optional later)
 * Staff+: all statuses unless ?status=
 */
export async function GET(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const isStaff = ctx.permissions.manageTests;

  let query = ctx.supabase
    .from('vendor_tests')
    .select(
      'id, title, description, duration_minutes, status, starts_at, ends_at, total_questions, total_marks, passing_marks, negative_marking, max_attempts, result_release, results_released, anti_cheat_enabled, created_at, updated_at'
    )
    .eq('vendor_id', ctx.vendor.id)
    .order('created_at', { ascending: false });

  if (!isStaff) {
    query = query.eq('status', 'published');
  } else if (status) {
    query = query.eq('status', status);
  }

  const { data, error: listError } = await query;
  if (listError) {
    return NextResponse.json({ success: false, error: listError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, tests: data || [] });
}

/** POST — create draft test */
export async function POST(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;
  if (!ctx.permissions.manageTests) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const n = normalizeVendorTestPayload(body, { partial: false });
    if (!n.ok) {
      return NextResponse.json({ success: false, error: n.error }, { status: 400 });
    }

    const { data, error: insertError } = await ctx.supabase
      .from('vendor_tests')
      .insert({
        vendor_id: ctx.vendor.id,
        ...n.data,
        total_questions: 0,
        created_by: ctx.email,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: 'test.created',
      entityType: 'vendor_test',
      entityId: data.id,
      details: { title: data.title },
    });

    return NextResponse.json({ success: true, test: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
