/**
 * Dense rank: same score → same rank; next differs (1, 2, 2, 4).
 * Prefer SQL RPC; fall back to batched JS updates.
 */

export function computeDenseRanks(attempts) {
  const sorted = [...(attempts || [])].sort((a, b) => {
    const sa = Number(a.score) || 0;
    const sb = Number(b.score) || 0;
    if (sb !== sa) return sb - sa;
    const ta = Number(a.duration_taken);
    const tb = Number(b.duration_taken);
    const aTime = Number.isFinite(ta) ? ta : Number.POSITIVE_INFINITY;
    const bTime = Number.isFinite(tb) ? tb : Number.POSITIVE_INFINITY;
    if (aTime !== bTime) return aTime - bTime;
    return String(a.id).localeCompare(String(b.id));
  });

  let dense = 0;
  let prevKey = null;
  const byId = {};

  sorted.forEach((row, index) => {
    const scoreKey = String(Number(row.score) || 0);
    if (scoreKey !== prevKey) {
      dense += 1;
      prevKey = scoreKey;
    }
    const total = sorted.length;
    const percentile =
      total > 0 ? Math.round(((total - dense + 1) / total) * 10000) / 100 : 0;
    byId[row.id] = {
      dense_rank: dense,
      rank: index + 1,
      percentile,
    };
  });

  return { ordered: sorted, byId, total: sorted.length };
}

/**
 * Recompute ranks for all finished attempts on a test.
 * Uses Postgres function when available (single set-based UPDATE).
 */
export async function recomputeVendorTestRanks(supabase, vendorId, testId) {
  const { data: rpcCount, error: rpcError } = await supabase.rpc(
    'recompute_vendor_test_ranks',
    {
      p_vendor_id: vendorId,
      p_test_id: testId,
    }
  );

  if (!rpcError) {
    return { error: null, updated: Number(rpcCount) || 0, via: 'rpc' };
  }

  // Fallback if migration not applied yet
  const missingFn =
    rpcError.code === 'PGRST202' ||
    /could not find the function|does not exist/i.test(rpcError.message || '');
  if (!missingFn) {
    return { error: rpcError, updated: 0 };
  }

  const { data: rows, error } = await supabase
    .from('vendor_attempts')
    .select('id, score, duration_taken')
    .eq('vendor_id', vendorId)
    .eq('test_id', testId)
    .in('status', ['submitted', 'auto_submitted']);

  if (error) return { error, updated: 0 };

  const { byId } = computeDenseRanks(rows || []);
  const now = new Date().toISOString();
  const updates = (rows || [])
    .map((row) => {
      const ranks = byId[row.id];
      if (!ranks) return null;
      return {
        id: row.id,
        dense_rank: ranks.dense_rank,
        rank: ranks.rank,
        updated_at: now,
      };
    })
    .filter(Boolean);

  // Batch in chunks of 50 parallel updates (better than fully serial)
  let updated = 0;
  const chunkSize = 50;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map((u) =>
        supabase
          .from('vendor_attempts')
          .update({
            dense_rank: u.dense_rank,
            rank: u.rank,
            updated_at: u.updated_at,
          })
          .eq('id', u.id)
          .eq('vendor_id', vendorId)
      )
    );
    updated += results.filter((r) => !r.error).length;
  }

  return { error: null, updated, total: (rows || []).length, via: 'js_fallback' };
}

export function percentileFromDenseRank(denseRank, total) {
  if (!total || !denseRank) return null;
  return Math.round(((total - denseRank + 1) / total) * 10000) / 100;
}
