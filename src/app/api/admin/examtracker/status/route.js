import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import {
  applyCategoryFilter,
  applyChapterFilter,
  applyDifficultyFilter,
  applySubjectFilter,
} from '@/lib/examtrackerFilters';
import {
  EXAMTRACKER_STATUS,
  EXAMTRACKER_STATUSES,
  normalizeExamtrackerStatus,
  verificationForStatus,
  applyPublishLifecycleFilter,
} from '@/lib/examtrackerStatus';

const MAX_IDS = 250;
const MAX_FILTER_IDS = 5000;

async function collectMatchingIds(supabase, filter) {
  const ids = [];
  let offset = 0;
  const page = 1000;

  while (ids.length < MAX_FILTER_IDS) {
    let q = supabase
      .from('examtracker')
      .select('_id')
      .order('_id', { ascending: true })
      .range(offset, offset + page - 1);

    if (filter.category) q = applyCategoryFilter(q, filter.category);
    if (filter.subject) q = applySubjectFilter(q, filter.subject);
    if (filter.chapter) q = applyChapterFilter(q, filter.chapter);
    if (filter.topic) q = q.eq('topic', filter.topic);
    if (filter.difficulty) q = applyDifficultyFilter(q, filter.difficulty);
    if (filter.status) q = applyPublishLifecycleFilter(q, filter.status);

    const { data, error } = await q;
    if (error) throw error;
    const batch = data ?? [];
    if (!batch.length) break;
    for (const row of batch) {
      if (row?._id) ids.push(String(row._id));
    }
    if (batch.length < page) break;
    offset += page;
  }

  return ids.slice(0, MAX_FILTER_IDS);
}

/**
 * PATCH — publish / reject / revert to draft.
 * Writes PostgREST-visible `verification_status` (and `status` when the schema allows).
 */
export async function PATCH(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || 'Admin required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const nextStatus = normalizeExamtrackerStatus(body?.status, '');
    if (!EXAMTRACKER_STATUSES.includes(nextStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: 'status must be draft, published, or rejected',
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer(isValidServiceRoleKey());
    let ids = [];

    if (body?.mode === 'all-matching') {
      const filter = body.filter && typeof body.filter === 'object' ? body.filter : {};
      ids = await collectMatchingIds(supabase, filter);
    } else {
      const rawIds = Array.isArray(body?.ids) ? body.ids : [];
      ids = [...new Set(rawIds.map((id) => String(id ?? '').trim()).filter(Boolean))];
      if (ids.length > MAX_IDS) {
        return NextResponse.json(
          {
            success: false,
            error: `Too many ids (max ${MAX_IDS}). Use mode all-matching for large batches.`,
          },
          { status: 400 }
        );
      }
    }

    if (!ids.length) {
      return NextResponse.json(
        { success: false, error: 'No matching questions to update' },
        { status: 400 }
      );
    }

    const verification = verificationForStatus(nextStatus);
    const patch = { verification_status: verification };

    let updated = 0;
    for (let i = 0; i < ids.length; i += MAX_IDS) {
      const chunk = ids.slice(i, i + MAX_IDS);
      const { error, count } = await supabase
        .from('examtracker')
        .update(patch, { count: 'exact' })
        .in('_id', chunk);

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            updatedCount: updated,
          },
          { status: 500 }
        );
      }
      updated += count ?? chunk.length;
    }

    return NextResponse.json({
      success: true,
      status: nextStatus,
      updatedCount: updated,
      requestedCount: ids.length,
      verification_status: verification,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}
