import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseAdmin, formatAdminDbError } from '@/lib/supabaseAdmin';
import { invalidateCached } from '@/lib/cache/serverTtlCache';
import {
  invalidateRoadmapDaysCache,
  ROADMAPS_SETUP_HINT,
} from '@/lib/roadmaps/roadmapService';

function adminErr(err, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error: formatAdminDbError(err, ROADMAPS_SETUP_HINT),
      setupHint: ROADMAPS_SETUP_HINT,
    },
    { status }
  );
}

function normalizeFocusAreas(raw) {
  const areas = Array.isArray(raw) ? raw : [];
  return areas
    .filter((a) => a?.focus_area?.trim())
    .map((a) => ({
      focus_area: String(a.focus_area).trim(),
      tasks: (a.tasks || [])
        .filter((t) => t?.task?.trim())
        .map((t) => ({
          task_id: t.task_id || uuidv4(),
          task: String(t.task).trim(),
          resources: t.resources ? String(t.resources).trim() : '',
        })),
    }))
    .filter((a) => a.tasks.length > 0);
}

export async function GET(_request, { params }) {
  const { roadmapId } = await params;
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('roadmap_days')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .order('day_number', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, days: data || [] });
  } catch (err) {
    return adminErr(err);
  }
}

export async function POST(request, { params }) {
  const { roadmapId } = await params;
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const day_number = Number(body.day_number);
    if (!Number.isFinite(day_number) || day_number < 1) {
      return NextResponse.json({ success: false, error: 'Valid day_number required' }, { status: 400 });
    }

    const focus_areas = normalizeFocusAreas(body.focus_areas);
    if (!focus_areas.length) {
      return NextResponse.json(
        { success: false, error: 'At least one focus area with tasks required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('roadmap_days')
      .insert({
        roadmap_id: roadmapId,
        day_number,
        focus_areas,
        time_required: body.time_required ? String(body.time_required).trim() : null,
        notes: body.notes ? String(body.notes).trim() : null,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: `Day ${day_number} already exists for this roadmap` },
          { status: 409 }
        );
      }
      if (error.code === '23503') {
        return NextResponse.json(
          { success: false, error: 'Roadmap not found — refresh and try again' },
          { status: 404 }
        );
      }
      throw error;
    }
    invalidateRoadmapDaysCache(roadmapId);
    invalidateCached('roadmap-catalog:all');
    return NextResponse.json({ success: true, day: data });
  } catch (err) {
    return adminErr(err);
  }
}

export async function DELETE(request, { params }) {
  const { roadmapId } = await params;
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dayId = searchParams.get('dayId');
    if (!dayId) {
      return NextResponse.json({ success: false, error: 'dayId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('roadmap_days')
      .delete()
      .eq('id', dayId)
      .eq('roadmap_id', roadmapId);

    if (error) throw error;
    invalidateRoadmapDaysCache(roadmapId);
    invalidateCached('roadmap-catalog:all');
    return NextResponse.json({ success: true });
  } catch (err) {
    return adminErr(err);
  }
}

export async function PATCH(request, { params }) {
  const { roadmapId } = await params;
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const dayId = body.id;
    if (!dayId) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }

    const patch = { updated_at: new Date().toISOString() };
    if (body.day_number != null) {
      const day_number = Number(body.day_number);
      if (!Number.isFinite(day_number) || day_number < 1) {
        return NextResponse.json({ success: false, error: 'Valid day_number required' }, { status: 400 });
      }
      patch.day_number = day_number;
    }
    if (body.time_required !== undefined) {
      patch.time_required = body.time_required ? String(body.time_required).trim() : null;
    }
    if (body.notes !== undefined) {
      patch.notes = body.notes ? String(body.notes).trim() : null;
    }
    if (body.focus_areas != null) {
      const focus_areas = normalizeFocusAreas(body.focus_areas);
      if (!focus_areas.length) {
        return NextResponse.json(
          { success: false, error: 'At least one focus area with tasks required' },
          { status: 400 }
        );
      }
      patch.focus_areas = focus_areas;
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('roadmap_days')
      .update(patch)
      .eq('id', dayId)
      .eq('roadmap_id', roadmapId)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'That day number already exists for this roadmap' },
          { status: 409 }
        );
      }
      throw error;
    }

    invalidateRoadmapDaysCache(roadmapId);
    invalidateCached('roadmap-catalog:all');
    return NextResponse.json({ success: true, day: data });
  } catch (err) {
    return adminErr(err);
  }
}
