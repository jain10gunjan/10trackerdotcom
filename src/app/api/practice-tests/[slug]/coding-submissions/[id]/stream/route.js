import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { getCodingContestsDb } from '@/features/coding-contests/server/db';
import { getCodingUser } from '@/features/coding-contests/server/getCodingUser';
import { publicSubmissionResult } from '@/features/coding-contests/lib/contestAccess';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { slug, id } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  const user = await getCodingUser();
  if (!user.ok) {
    return new Response(JSON.stringify({ success: false, error: user.error }), {
      status: user.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = getCodingContestsDb();
  const encoder = new TextEncoder();

  let closed = false;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        for (let i = 0; i < 90 && !closed; i++) {
          const { data: submission } = await supabase
            .from('coding_submissions')
            .select(
              'id, contest_id, user_id, status, verdict, score, time_ms, memory_kb, is_run_only, error_message, created_at, finished_at'
            )
            .eq('id', id)
            .maybeSingle();

          if (!submission) {
            send({ error: 'Not found' });
            break;
          }

          const { data: contest } = await supabase
            .from('coding_contests')
            .select('vendor_id')
            .eq('id', submission.contest_id)
            .maybeSingle();
          if (!contest || contest.vendor_id !== ctx.vendor.id) {
            send({ error: 'Not found' });
            break;
          }

          const isStaff =
            ctx.role === 'vendor_staff' ||
            ctx.role === 'vendor_admin' ||
            ctx.isSuperAdmin;
          if (!isStaff && submission.user_id !== user.userId) {
            send({ error: 'Forbidden' });
            break;
          }

          const { data: results } = await supabase
            .from('coding_submission_results')
            .select(
              'id, sort_order, is_hidden, status, verdict, time_ms, memory_kb, stdout, stderr, finished'
            )
            .eq('submission_id', id)
            .order('sort_order', { ascending: true });

          send({
            submission: {
              ...submission,
              results: (results || []).map((r) => publicSubmissionResult(r)),
            },
          });

          if (submission.status === 'done' || submission.status === 'error') break;
          await new Promise((r) => setTimeout(r, 1500));
        }
      } catch (err) {
        send({ error: err.message });
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
