import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { loadOwnedAttempt, loadPublishedTest } from '@/features/vendor-tests/server/attemptService';
import {
  countFocusViolations,
  finalizeVendorAttempt,
  focusViolationLimit,
  updateInProgressAttempt,
} from '@/features/vendor-tests/server/finalizeVendorAttempt';

const MAX_EVENTS = 200;
const VIOLATION_GAP_MS = 800;

/**
 * POST — append anti-cheat events.
 * A focus_violation past the test limit auto-submits and marks the attempt cheated.
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
      return NextResponse.json({
        success: true,
        ignored: true,
        status: attempt.status,
        submitted: attempt.status === 'submitted' || attempt.status === 'auto_submitted',
      });
    }

    const { test, error: tErr } = await loadPublishedTest(
      ctx.supabase,
      ctx.vendor.id,
      attempt.test_id
    );
    if (tErr || !test) {
      return NextResponse.json(
        { success: false, error: tErr?.message || 'Test not found' },
        { status: tErr ? 500 : 404 }
      );
    }

    const limit = focusViolationLimit(test);
    const antiCheat = test.anti_cheat_enabled !== false;
    const existing = Array.isArray(attempt.anti_cheat_events) ? attempt.anti_cheat_events : [];
    const now = Date.now();
    const lastViolation = [...existing].reverse().find((event) => event?.type === 'focus_violation');
    const lastAt = lastViolation?.at ? new Date(lastViolation.at).getTime() : 0;

    const accepted = [];
    let addedViolation = false;
    for (const event of incoming.slice(0, 20)) {
      const type = String(event?.type || 'unknown').slice(0, 64);
      if (type === 'focus_violation') {
        if (!antiCheat) continue;
        if (addedViolation) continue;
        if (lastAt && now - lastAt < VIOLATION_GAP_MS) continue;
        addedViolation = true;
      }
      accepted.push({
        type,
        at: event?.at || new Date().toISOString(),
        meta: event?.meta && typeof event.meta === 'object' ? event.meta : undefined,
      });
    }

    if (!accepted.length) {
      const violationCount = countFocusViolations(attempt);
      return NextResponse.json({
        success: true,
        ignored: true,
        violationCount,
        maxViolations: limit,
        exceeded: antiCheat && violationCount > limit,
      });
    }

    const nextEvents = [...existing, ...accepted].slice(-MAX_EVENTS);
    const violationCount = addedViolation
      ? countFocusViolations(attempt) + 1
      : countFocusViolations(attempt);
    const exceeded = antiCheat && violationCount > limit;

    const { data: updated, error: upErr } = await updateInProgressAttempt(ctx.supabase, {
      vendorId: ctx.vendor.id,
      attemptId,
      userEmail: ctx.email,
      patch: {
        anti_cheat_events: nextEvents,
        focus_violation_count: violationCount,
      },
    });

    if (upErr) {
      return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
    }
    if (!updated) {
      return NextResponse.json({
        success: true,
        ignored: true,
        status: 'closed',
      });
    }

    if (!exceeded) {
      return NextResponse.json({
        success: true,
        eventCount: nextEvents.length,
        violationCount,
        maxViolations: limit,
        exceeded: false,
        submitted: false,
      });
    }

    const finalized = await finalizeVendorAttempt({
      supabase: ctx.supabase,
      vendorId: ctx.vendor.id,
      email: ctx.email,
      attemptId,
      attempt: {
        ...updated,
        focus_violation_count: violationCount,
        anti_cheat_events: nextEvents,
        final_stats: updated.final_stats || attempt.final_stats,
      },
      test,
      auto: true,
    });

    if (!finalized.ok) {
      return NextResponse.json(
        {
          success: false,
          error: finalized.error,
          violationCount,
          maxViolations: limit,
          exceeded: true,
        },
        { status: finalized.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      eventCount: nextEvents.length,
      violationCount,
      maxViolations: limit,
      exceeded: true,
      submitted: true,
      attempt: finalized.attempt,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
