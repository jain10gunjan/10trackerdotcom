import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseAdmin, formatAdminDbError } from '@/lib/supabaseAdmin';
import { invalidateCached } from '@/lib/cache/serverTtlCache';
import {
  isValidSlug,
  normalizeSlug,
  ROADMAPS_SETUP_HINT,
} from '@/features/roadmaps/lib/roadmapService';

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

export async function GET() {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error?.code === '42P01') {
      return NextResponse.json({ success: false, setupHint: ROADMAPS_SETUP_HINT, roadmaps: [] });
    }
    if (error) throw error;

    return NextResponse.json({ success: true, roadmaps: data || [] });
  } catch (err) {
    console.error('[admin roadmaps GET]', err);
    return adminErr(err);
  }
}

export async function POST(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const slug = normalizeSlug(body.slug);
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const price_inr = Number(body.price_inr);
    const free_preview_days = Number(body.free_preview_days);
    const sort_order = Number(body.sort_order) || 0;
    const is_active = body.is_active !== false;
    const exam_slug = body.exam_slug
      ? normalizeSlug(String(body.exam_slug))
      : null;

    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { success: false, error: 'Slug must be 2–64 chars: lowercase letters, numbers, hyphens' },
        { status: 400 }
      );
    }
    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    if (!Number.isFinite(price_inr) || price_inr < 1) {
      return NextResponse.json({ success: false, error: 'Valid price_inr required' }, { status: 400 });
    }
    if (!Number.isFinite(free_preview_days) || free_preview_days < 0) {
      return NextResponse.json(
        { success: false, error: 'free_preview_days is required (0 or more)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('roadmaps')
      .insert({
        slug,
        title,
        description,
        price_inr: Math.round(price_inr),
        free_preview_days: Math.round(free_preview_days),
        sort_order,
        is_active,
        exam_slug: exam_slug || null,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Slug already exists — choose a different slug' },
          { status: 409 }
        );
      }
      throw error;
    }
    invalidateCached('roadmap-catalog:all');
    return NextResponse.json({ success: true, roadmap: data });
  } catch (err) {
    console.error('[admin roadmaps POST]', err);
    return adminErr(err);
  }
}

export async function PATCH(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }

    const patch = { updated_at: new Date().toISOString() };
    if (body.slug != null) {
      const slug = normalizeSlug(body.slug);
      if (!isValidSlug(slug)) {
        return NextResponse.json({ success: false, error: 'Invalid slug' }, { status: 400 });
      }
      patch.slug = slug;
    }
    if (body.title != null) patch.title = String(body.title).trim();
    if (body.description != null) patch.description = String(body.description).trim();
    if (body.price_inr != null) patch.price_inr = Math.round(Number(body.price_inr));
    if (body.free_preview_days != null) {
      patch.free_preview_days = Math.round(Number(body.free_preview_days));
    }
    if (body.sort_order != null) patch.sort_order = Number(body.sort_order) || 0;
    if (body.is_active != null) patch.is_active = Boolean(body.is_active);
    if (body.exam_slug !== undefined) {
      patch.exam_slug = body.exam_slug ? normalizeSlug(String(body.exam_slug)) : null;
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('roadmaps')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Slug already in use by another roadmap' },
          { status: 409 }
        );
      }
      throw error;
    }
    invalidateCached('roadmap-catalog:all');
    return NextResponse.json({ success: true, roadmap: data });
  } catch (err) {
    console.error('[admin roadmaps PATCH]', err);
    return adminErr(err);
  }
}
