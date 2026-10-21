import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { getCodingContestsDb } from '@/features/coding-contests/server/db';
import { testCaseSchema } from '@/features/coding-contests/lib/schemas';

async function assertProblem(supabase, vendorId, contestId, pid) {
  const { data: contest } = await supabase
    .from('coding_contests')
    .select('id')
    .eq('id', contestId)
    .eq('vendor_id', vendorId)
    .maybeSingle();
  if (!contest) return false;
  const { data: problem } = await supabase
    .from('coding_problems')
    .select('id')
    .eq('id', pid)
    .eq('contest_id', contestId)
    .maybeSingle();
  return Boolean(problem);
}

export async function GET(_request, { params }) {
  const { slug, contestId, pid } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  try {
    const supabase = getCodingContestsDb();
    if (!(await assertProblem(supabase, ctx.vendor.id, contestId, pid))) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    const { data, error: dbErr } = await supabase
      .from('coding_test_cases')
      .select('*')
      .eq('problem_id', pid)
      .order('sort_order', { ascending: true });
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, testCases: data || [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { slug, contestId, pid } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];
    const parsed = [];
    for (const item of items) {
      const r = testCaseSchema.safeParse(item);
      if (!r.success) {
        return NextResponse.json(
          { success: false, error: r.error.issues[0]?.message || 'Invalid input' },
          { status: 400 }
        );
      }
      parsed.push(r.data);
    }

    const supabase = getCodingContestsDb();
    if (!(await assertProblem(supabase, ctx.vendor.id, contestId, pid))) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const rows = parsed.map((v, i) => ({
      problem_id: pid,
      input: v.input,
      expected_output: v.expected_output,
      is_hidden: v.is_hidden ?? true,
      sort_order: v.sort_order ?? i,
    }));

    const { data, error: dbErr } = await supabase
      .from('coding_test_cases')
      .insert(rows)
      .select('*');
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, testCases: data || [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { slug, contestId, pid } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  try {
    const body = await request.json();
    const id = body?.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }
    const parsed = testCaseSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    const supabase = getCodingContestsDb();
    if (!(await assertProblem(supabase, ctx.vendor.id, contestId, pid))) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    const { data, error: dbErr } = await supabase
      .from('coding_test_cases')
      .update(parsed.data)
      .eq('id', id)
      .eq('problem_id', pid)
      .select('*')
      .single();
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, testCase: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { slug, contestId, pid } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }
    const supabase = getCodingContestsDb();
    if (!(await assertProblem(supabase, ctx.vendor.id, contestId, pid))) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    const { error: dbErr } = await supabase
      .from('coding_test_cases')
      .delete()
      .eq('id', id)
      .eq('problem_id', pid);
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
