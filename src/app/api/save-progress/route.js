/**
 * Legacy unauthenticated save-progress endpoint.
 * Prefer POST /api/practice/progress (session-auth'd).
 * This route now requires auth and accepts buffer-style `{ entries }` as well.
 */
import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { getProgressUserId } from '@/lib/progressIdentity';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { mergeProgressEntriesToSupabase } from '@/lib/server/mergeProgressEntries';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

export async function POST(request) {
  const { email, error, status } = await requireSessionEmail();
  if (error) {
    return NextResponse.json({ success: false, error }, { status });
  }

  const limit = checkApiRateLimit(email, 'save-progress-legacy', {
    windowMs: 60_000,
    max: 40,
  });
  if (!limit.ok) {
    const r = rateLimitResponse(limit);
    return NextResponse.json(r.body, { status: r.status, headers: r.headers });
  }

  try {
    let body;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      body = JSON.parse(await request.text());
    }

    const userId = getProgressUserId({ email });
    const supabase = getSupabaseAdmin();

    // New buffer format
    if (body?.entries && typeof body.entries === 'object') {
      const result = await mergeProgressEntriesToSupabase(
        supabase,
        userId,
        email,
        body.entries
      );
      return NextResponse.json({ success: true, saved: result.saved });
    }

    // Legacy single-topic format
    const { updates, topic, area } = body || {};
    if (!topic || !area || !Array.isArray(updates) || !updates.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (use /api/practice/progress)' },
        { status: 400 }
      );
    }

    const entries = {};
    for (const u of updates) {
      const qids = [
        ...(Array.isArray(u.completed) ? u.completed : []),
        ...(Array.isArray(u.correct) ? u.correct : []),
      ];
      for (const qid of qids) {
        const id = String(qid);
        const wasCorrect = Array.isArray(u.correct) && u.correct.map(String).includes(id);
        entries[id] = {
          completed: true,
          correct: wasCorrect,
          points: wasCorrect ? (u.points || 100) : 0,
          topic: String(topic).trim(),
          area: String(area).trim().toLowerCase(),
        };
      }
    }

    const result = await mergeProgressEntriesToSupabase(supabase, userId, email, entries);
    return NextResponse.json({
      success: true,
      message: 'Progress saved successfully',
      saved: result.saved,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to save progress' },
      { status: 500 }
    );
  }
}
