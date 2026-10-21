import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { getCodingContestsDb } from '@/features/coding-contests/server/db';
import { problemSchema } from '@/features/coding-contests/lib/schemas';
import { isContestActive } from '@/features/coding-contests/lib/contestAccess';
import { getCodingUser } from '@/features/coding-contests/server/getCodingUser';

async function loadProblem(supabase, vendorId, contestId, pid) {
  const { data: contest } = await supabase
    .from('coding_contests')
    .select('*')
    .eq('id', contestId)
    .eq('vendor_id', vendorId)
    .maybeSingle();
  if (!contest) return { contest: null, problem: null };

  const { data: problem } = await supabase
    .from('coding_problems')
    .select('*')
    .eq('id', pid)
    .eq('contest_id', contestId)
    .maybeSingle();
  return { contest, problem };
}

export async function GET(_request, { params }) {
  const { slug, contestId, pid } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  try {
    const supabase = getCodingContestsDb();
    const { contest, problem } = await loadProblem(
      supabase,
      ctx.vendor.id,
      contestId,
      pid
    );
    if (!contest || !problem) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const isStaff =
      ctx.role === 'vendor_staff' ||
      ctx.role === 'vendor_admin' ||
      ctx.isSuperAdmin;
    if (!isStaff && contest.status !== 'published') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const { data: languages } = await supabase
      .from('coding_languages')
      .select('id, name, judge0_language_id')
      .eq('enabled', true)
      .order('name', { ascending: true });

    let testCasesQuery = supabase
      .from('coding_test_cases')
      .select(
        isStaff
          ? 'id, input, expected_output, is_hidden, sort_order'
          : 'id, input, expected_output, is_hidden, sort_order'
      )
      .eq('problem_id', pid)
      .order('sort_order', { ascending: true });

    const { data: testCases } = await testCasesQuery;

    const visibleCases = isStaff
      ? testCases || []
      : (testCases || [])
          .filter((t) => !t.is_hidden)
          .map((t) => ({
            id: t.id,
            input: t.input,
            expected_output: t.expected_output,
            is_hidden: false,
            sort_order: t.sort_order,
          }));

    const hiddenCount = (testCases || []).filter((t) => t.is_hidden).length;

    const user = await getCodingUser();
    let history = [];
    if (user.ok) {
      const { data } = await supabase
        .from('coding_submissions')
        .select(
          'id, status, verdict, score, time_ms, memory_kb, language_id, created_at, finished_at, is_run_only'
        )
        .eq('problem_id', pid)
        .eq('user_id', user.userId)
        .eq('is_run_only', false)
        .order('created_at', { ascending: false })
        .limit(30);
      history = data || [];
    }

    return NextResponse.json({
      success: true,
      contest: {
        id: contest.id,
        title: contest.title,
        status: contest.status,
        starts_at: contest.starts_at,
        ends_at: contest.ends_at,
        scoring_mode: contest.scoring_mode,
      },
      problem: {
        id: problem.id,
        title: problem.title,
        slug: problem.slug,
        statement: problem.statement,
        points: problem.points,
        cpu_time_limit: problem.cpu_time_limit,
        wall_time_limit: problem.wall_time_limit,
        memory_limit_kb: problem.memory_limit_kb,
      },
      languages: languages || [],
      testCases: visibleCases,
      hiddenTestCaseCount: isStaff ? undefined : hiddenCount,
      submissions: history,
      active: isContestActive(contest),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { slug, contestId, pid } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = problemSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    const supabase = getCodingContestsDb();
    const { contest, problem } = await loadProblem(
      supabase,
      ctx.vendor.id,
      contestId,
      pid
    );
    if (!contest || !problem) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    const { data, error: dbErr } = await supabase
      .from('coding_problems')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', pid)
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

export async function DELETE(_request, { params }) {
  const { slug, contestId, pid } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  try {
    const supabase = getCodingContestsDb();
    const { contest, problem } = await loadProblem(
      supabase,
      ctx.vendor.id,
      contestId,
      pid
    );
    if (!contest || !problem) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    const { error: dbErr } = await supabase.from('coding_problems').delete().eq('id', pid);
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
