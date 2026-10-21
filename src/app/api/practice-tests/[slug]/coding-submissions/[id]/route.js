import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { getCodingContestsDb } from '@/features/coding-contests/server/db';
import { getCodingUser } from '@/features/coding-contests/server/getCodingUser';
import { publicSubmissionResult } from '@/features/coding-contests/lib/contestAccess';

export async function GET(_request, { params }) {
  const { slug, id } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  try {
    const user = await getCodingUser();
    if (!user.ok) {
      return NextResponse.json({ success: false, error: user.error }, { status: user.status });
    }

    const supabase = getCodingContestsDb();
    const { data: submission, error: sErr } = await supabase
      .from('coding_submissions')
      .select(
        'id, contest_id, problem_id, user_id, language_id, status, verdict, score, time_ms, memory_kb, is_run_only, error_message, created_at, finished_at, source_code'
      )
      .eq('id', id)
      .maybeSingle();
    if (sErr) {
      return NextResponse.json({ success: false, error: sErr.message }, { status: 500 });
    }
    if (!submission) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const { data: contest } = await supabase
      .from('coding_contests')
      .select('id, vendor_id')
      .eq('id', submission.contest_id)
      .eq('vendor_id', ctx.vendor.id)
      .maybeSingle();
    if (!contest) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const isStaff =
      ctx.role === 'vendor_staff' ||
      ctx.role === 'vendor_admin' ||
      ctx.isSuperAdmin;
    if (!isStaff && submission.user_id !== user.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { data: results } = await supabase
      .from('coding_submission_results')
      .select(
        'id, sort_order, is_hidden, status, verdict, time_ms, memory_kb, stdout, stderr, finished'
      )
      .eq('submission_id', id)
      .order('sort_order', { ascending: true });

    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
        source_code:
          isStaff || submission.user_id === user.userId ? submission.source_code : undefined,
        results: (results || []).map((r) => publicSubmissionResult(r)),
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
