import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { loadOwnedAttempt } from '@/features/vendor-tests/server/attemptService';

const MAX_EVENTS = 200;

/**
 * POST — append anti-cheat events (visibility/blur/etc.)
 * Body: { events: [{ type, at?, meta? }] } or { type, at?, meta? }
 */
export async function POST(request, { params }) {
  const { slug, attemptId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  try {
    const body = await request.json();
    const incoming = Array.isArray(body.events)
      ? body.events
      : body.type
        ? [body]
        : [];

    if (!incoming.length) {
      return NextResponse.json({ success: false, error: 'events required' }, { status: 400 });
    }

    const { attempt, error: aErr } = await loadOwnedAttempt(
      ctx.supabase,
      ctx.vendor.id,
      attemptId,
      ctx.email
    );
    if (aErr) {
      return NextResponse.json({ success: false, error: aErr.message }, { status: 500 });
    }
    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Attempt not found' }, { status: 404 });
    }
    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ success: true, ignored: true, status: attempt.status });
    }

    const existing = Array.isArray(attempt.anti_cheat_events)
      ? attempt.anti_cheat_events
      : [];
    const next = [
      ...existing,
      ...incoming.slice(0, 20).map((e) => ({
        type: String(e.type || 'unknown').slice(0, 64),
        at: e.at || new Date().toISOString(),
        meta: e.meta && typeof e.meta === 'object' ? e.meta : undefined,
      })),
    ].slice(-MAX_EVENTS);

    const { error: upErr } = await ctx.supabase
      .from('vendor_attempts')
      .update({
        anti_cheat_events: next,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .eq('vendor_id', ctx.vendor.id)
      .eq('user_email', ctx.email)
      .eq('status', 'in_progress');

    if (upErr) {
      return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      eventCount: next.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
