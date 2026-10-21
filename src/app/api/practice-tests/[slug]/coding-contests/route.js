import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { getCodingContestsDb } from '@/features/coding-contests/server/db';
import { createContestSchema } from '@/features/coding-contests/lib/schemas';

function emptyToNull(v) {
  if (v === '' || v === undefined) return null;
  return v;
}

/** GET — list contests for vendor (students see published; staff see all) */
export async function GET(_request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  try {
    const supabase = getCodingContestsDb();
    let query = supabase
      .from('coding_contests')
      .select(
        'id, title, description, status, scoring_mode, starts_at, ends_at, created_at, updated_at'
      )
      .eq('vendor_id', ctx.vendor.id)
      .order('created_at', { ascending: false });

    const isStaff =
      ctx.role === 'vendor_staff' ||
      ctx.role === 'vendor_admin' ||
      ctx.isSuperAdmin;
    if (!isStaff) {
      query = query.eq('status', 'published');
    }

    const { data, error: dbErr } = await query;
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, contests: data || [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** POST — create contest (staff+) */
export async function POST(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createContestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    const v = parsed.data;
    const supabase = getCodingContestsDb();
    const { data, error: dbErr } = await supabase
      .from('coding_contests')
      .insert({
        vendor_id: ctx.vendor.id,
        title: v.title,
        description: emptyToNull(v.description),
        status: v.status || 'draft',
        scoring_mode: v.scoring_mode || 'icpc',
        stop_on_first_fail: v.stop_on_first_fail ?? true,
        ignore_ce_penalty: v.ignore_ce_penalty ?? true,
        wrong_penalty_minutes: v.wrong_penalty_minutes ?? 20,
        starts_at: emptyToNull(v.starts_at),
        ends_at: emptyToNull(v.ends_at),
        created_by: ctx.email || ctx.member?.user_email || null,
      })
      .select('*')
      .single();
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, contest: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
