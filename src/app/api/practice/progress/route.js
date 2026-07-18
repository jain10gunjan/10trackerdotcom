import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { getProgressUserId } from '@/lib/progressIdentity';
import { applyProgressUserFilter } from '@/lib/progressIdentity';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { mergeProgressEntriesToSupabase } from '@/lib/server/mergeProgressEntries';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';
import { logPracticeMetric } from '@/lib/practiceMetrics';

export async function GET(request) {
  const { email, error, status } = await requireSessionEmail();
  if (error) {
    return NextResponse.json({ success: false, error }, { status });
  }

  const limit = checkApiRateLimit(email, 'practice-progress-get', {
    windowMs: 60_000,
    max: 90,
  });
  if (!limit.ok) {
    const r = rateLimitResponse(limit);
    return NextResponse.json(r.body, { status: r.status, headers: r.headers });
  }

  try {
    const { searchParams } = new URL(request.url);
    const area = String(searchParams.get('area') || '').trim().toLowerCase();
    const topicsRaw = searchParams.get('topics') || '';
    const topics = topicsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (!area || !topics.length) {
      return NextResponse.json(
        { success: false, error: 'area and topics required' },
        { status: 400 }
      );
    }

    const userId = getProgressUserId({ email });
    const supabase = getSupabaseAdmin();
    let q = supabase
      .from('user_progress')
      .select('topic, completedquestions, correctanswers, points')
      .eq('area', area)
      .in('topic', topics);
    q = applyProgressUserFilter(q, { email, id: userId });

    const { data, error: pe } = await q;
    if (pe && pe.code !== 'PGRST116') throw pe;

    const completed = new Set();
    const correct = new Set();
    let points = 0;
    for (const item of data ?? []) {
      (Array.isArray(item.completedquestions) ? item.completedquestions : []).forEach((id) => {
        if (id != null) completed.add(String(id));
      });
      (Array.isArray(item.correctanswers) ? item.correctanswers : []).forEach((id) => {
        if (id != null) correct.add(String(id));
      });
      points += typeof item.points === 'number' ? item.points : 0;
    }

    return NextResponse.json({
      success: true,
      completed: [...completed],
      correct: [...correct],
      points,
    });
  } catch (e) {
    logPracticeMetric('progress_read_error', { error: e?.message });
    return NextResponse.json(
      { success: false, error: e?.message || 'Failed to load progress' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { email, error, status } = await requireSessionEmail();
  if (error) {
    return NextResponse.json({ success: false, error }, { status });
  }

  const limit = checkApiRateLimit(email, 'practice-progress-post', {
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

    const entries = body?.entries;
    if (!entries || typeof entries !== 'object') {
      return NextResponse.json(
        { success: false, error: 'entries object required' },
        { status: 400 }
      );
    }

    const userId = getProgressUserId({ email });
    const supabase = getSupabaseAdmin();
    const result = await mergeProgressEntriesToSupabase(supabase, userId, email, entries);

    logPracticeMetric('progress_save_ok', { email, saved: result.saved });
    return NextResponse.json({ success: true, saved: result.saved });
  } catch (e) {
    logPracticeMetric('progress_save_error', { error: e?.message });
    return NextResponse.json(
      { success: false, error: e?.message || 'Failed to save progress' },
      { status: 500 }
    );
  }
}
