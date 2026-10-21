import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { getCodingContestsDb } from '@/features/coding-contests/server/db';
import { getLanguages } from '@/lib/judge0/client';

/** GET enabled languages (students) or all (staff) */
export async function GET(_request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  try {
    const supabase = getCodingContestsDb();
    const isStaff =
      ctx.role === 'vendor_staff' ||
      ctx.role === 'vendor_admin' ||
      ctx.isSuperAdmin;
    let query = supabase
      .from('coding_languages')
      .select('id, name, judge0_language_id, enabled')
      .order('name', { ascending: true });
    if (!isStaff) query = query.eq('enabled', true);
    const { data, error: dbErr } = await query;
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, languages: data || [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** POST sync from Judge0 (staff+) */
export async function POST(request, { params }) {
  const { slug } = await params;
  const { error } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  try {
    const body = await request.json().catch(() => ({}));
    const enableDefaults = body.enableDefaults !== false;
    const DEFAULT_ENABLE = ['c++', 'python', 'java', 'javascript', 'c ', 'c('];

    const remote = await getLanguages();
    const supabase = getCodingContestsDb();
    let upserted = 0;
    for (const lang of remote) {
      const name = String(lang.name || '').trim();
      const judge0Id = Number(lang.id);
      if (!name || !Number.isFinite(judge0Id)) continue;
      const lower = name.toLowerCase();
      const enabled = enableDefaults
        ? DEFAULT_ENABLE.some((n) => lower.startsWith(n.trim()))
        : false;

      const { data: existing } = await supabase
        .from('coding_languages')
        .select('id, enabled')
        .eq('judge0_language_id', judge0Id)
        .maybeSingle();

      const { error: upErr } = await supabase.from('coding_languages').upsert(
        {
          name,
          judge0_language_id: judge0Id,
          enabled: existing ? existing.enabled : enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'judge0_language_id' }
      );
      if (!upErr) upserted += 1;
    }

    return NextResponse.json({ success: true, upserted, total: remote.length });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** PATCH toggle enabled */
export async function PATCH(request, { params }) {
  const { slug } = await params;
  const { error } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  try {
    const body = await request.json();
    const id = body?.id;
    if (!id || typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'id and enabled required' },
        { status: 400 }
      );
    }
    const supabase = getCodingContestsDb();
    const { data, error: dbErr } = await supabase
      .from('coding_languages')
      .update({ enabled: body.enabled, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, language: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
