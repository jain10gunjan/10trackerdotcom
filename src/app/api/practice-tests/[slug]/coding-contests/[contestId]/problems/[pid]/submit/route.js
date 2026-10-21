import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { getCodingContestsDb } from '@/features/coding-contests/server/db';
import { submitSchema } from '@/features/coding-contests/lib/schemas';
import {
  ensureParticipant,
  isContestActive,
} from '@/features/coding-contests/lib/contestAccess';
import { enqueueJob } from '@/features/coding-contests/lib/jobQueue';
import {
  JOB_TYPES,
  SUBMIT_COOLDOWN_MS,
  SUBMISSION_STATUS,
} from '@/features/coding-contests/lib/constants';
import { getCodingUser } from '@/features/coding-contests/server/getCodingUser';
import {
  RATE_LIMITS,
  checkRateLimit,
  countInflightSubmissions,
} from '@/features/coding-contests/lib/rateLimit';

export async function POST(request, { params }) {
  const { slug, contestId, pid } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  try {
    const user = await getCodingUser();
    if (!user.ok) {
      return NextResponse.json({ success: false, error: user.error }, { status: user.status });
    }

    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const supabase = getCodingContestsDb();

    const [userRl, globalRl] = await Promise.all([
      checkRateLimit(
        supabase,
        `submit:user:${user.userId}`,
        RATE_LIMITS.SUBMIT_PER_USER_PER_MIN,
        60
      ),
      checkRateLimit(supabase, 'submit:global', RATE_LIMITS.SUBMIT_GLOBAL_PER_MIN, 60),
    ]);
    if (!userRl.allowed || !globalRl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many submissions. Please wait a moment and try again.',
          code: 'rate_limited',
        },
        { status: 429 }
      );
    }

    const inflight = await countInflightSubmissions(supabase, user.userId);
    if (inflight >= RATE_LIMITS.MAX_INFLIGHT_PER_USER) {
      return NextResponse.json(
        {
          success: false,
          error: `You already have ${inflight} submissions being judged. Wait for them to finish.`,
          code: 'inflight_limit',
        },
        { status: 429 }
      );
    }
    const { data: contest } = await supabase
      .from('coding_contests')
      .select('*')
      .eq('id', contestId)
      .eq('vendor_id', ctx.vendor.id)
      .maybeSingle();
    if (!contest || contest.status !== 'published') {
      return NextResponse.json({ success: false, error: 'Contest not available' }, { status: 404 });
    }
    if (!isContestActive(contest)) {
      return NextResponse.json(
        { success: false, error: 'Contest is not active' },
        { status: 403 }
      );
    }

    const { data: problem } = await supabase
      .from('coding_problems')
      .select('id')
      .eq('id', pid)
      .eq('contest_id', contestId)
      .maybeSingle();
    if (!problem) {
      return NextResponse.json({ success: false, error: 'Problem not found' }, { status: 404 });
    }

    const { data: language } = await supabase
      .from('coding_languages')
      .select('id, enabled')
      .eq('id', parsed.data.languageId)
      .maybeSingle();
    if (!language?.enabled) {
      return NextResponse.json(
        { success: false, error: 'Language not enabled' },
        { status: 400 }
      );
    }

    const { data: recent } = await supabase
      .from('coding_submissions')
      .select('id, created_at')
      .eq('problem_id', pid)
      .eq('user_id', user.userId)
      .eq('is_run_only', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.created_at) {
      const elapsed = Date.now() - new Date(recent.created_at).getTime();
      if (elapsed < SUBMIT_COOLDOWN_MS) {
        return NextResponse.json(
          {
            success: false,
            error: `Please wait ${Math.ceil((SUBMIT_COOLDOWN_MS - elapsed) / 1000)}s before submitting again`,
            code: 'cooldown',
          },
          { status: 429 }
        );
      }
    }

    await ensureParticipant(supabase, contestId, {
      userId: user.userId,
      userEmail: user.email || ctx.email,
      displayName: user.name || ctx.member?.display_name,
    });

    const { data: submission, error: insErr } = await supabase
      .from('coding_submissions')
      .insert({
        contest_id: contestId,
        problem_id: pid,
        user_id: user.userId,
        language_id: language.id,
        source_code: parsed.data.sourceCode,
        status: SUBMISSION_STATUS.QUEUED,
        is_run_only: false,
      })
      .select('id, status, created_at')
      .single();
    if (insErr) {
      return NextResponse.json({ success: false, error: insErr.message }, { status: 500 });
    }

    await enqueueJob(supabase, JOB_TYPES.JUDGE_SUBMISSION, {
      submissionId: submission.id,
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      status: submission.status,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
