import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { getCodingContestsDb } from '@/features/coding-contests/server/db';
import { problemSchema } from '@/features/coding-contests/lib/schemas';

async function assertContest(supabase, vendorId, contestId) {
  const { data } = await supabase
    .from('coding_contests')
    .select('id')
    .eq('id', contestId)
    .eq('vendor_id', vendorId)
    .maybeSingle();
  return data;
}

export async function POST(request, { params }) {
  const { slug, contestId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = problemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    const supabase = getCodingContestsDb();
    if (!(await assertContest(supabase, ctx.vendor.id, contestId))) {
      return NextResponse.json({ success: false, error: 'Contest not found' }, { status: 404 });
    }
    const v = parsed.data;
    const { data, error: dbErr } = await supabase
      .from('coding_problems')
      .insert({
        contest_id: contestId,
        title: v.title,
        slug: v.slug || null,
        statement: v.statement || '',
        points: v.points ?? 100,
        sort_order: v.sort_order ?? 0,
        cpu_time_limit: v.cpu_time_limit ?? 2,
        wall_time_limit: v.wall_time_limit ?? 5,
        memory_limit_kb: v.memory_limit_kb ?? 128000,
      })
      .select('*')
      .single();
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, problem: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
