import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { mapRoadmapCatalogRow } from '@/lib/roadmaps/roadmapCatalogUtils';

const SELECT_BASE =
  'id, slug, title, description, price_inr, free_preview_days, sort_order';
const SELECT_WITH_EXAM = `${SELECT_BASE}, exam_slug`;

async function attachDayCounts(supabase, roadmapIds) {
  if (!roadmapIds.length) return {};

  const { data, error } = await supabase
    .from('roadmap_days')
    .select('roadmap_id')
    .in('roadmap_id', roadmapIds);

  if (error) {
    if (error.code === '42P01') return {};
    throw error;
  }

  const counts = {};
  for (const row of data || []) {
    counts[row.roadmap_id] = (counts[row.roadmap_id] || 0) + 1;
  }
  return counts;
}

async function queryActiveRows(supabase) {
  let result = await supabase
    .from('roadmaps')
    .select(SELECT_WITH_EXAM)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });

  if (result.error?.code === '42703' || result.error?.message?.includes('exam_slug')) {
    result = await supabase
      .from('roadmaps')
      .select(SELECT_BASE)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true });
  }

  return result;
}

export async function fetchRoadmapCatalog() {
  try {
    const supabase = getSupabaseServer(isValidServiceRoleKey());
    const { data, error } = await queryActiveRows(supabase);

    if (error) {
      if (error.code === '42P01') {
        return { roadmaps: [], setupRequired: true };
      }
      throw error;
    }

    const rows = data || [];
    if (!rows.length) {
      return { roadmaps: [], setupRequired: false };
    }

    const dayCounts = await attachDayCounts(
      supabase,
      rows.map((r) => r.id)
    );

    const roadmaps = rows.map((row) =>
      mapRoadmapCatalogRow({
        ...row,
        total_days: dayCounts[row.id] || 0,
      })
    );

    return { roadmaps, setupRequired: false };
  } catch (err) {
    console.error('fetchRoadmapCatalog', err);
    return { roadmaps: [], setupRequired: false, error: err.message };
  }
}
