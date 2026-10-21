import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { getCodingContestsDb } from '@/features/coding-contests/server/db';
import { updateContestSchema } from '@/features/coding-contests/lib/schemas';
import { ensureParticipant, isContestActive } from '@/features/coding-contests/lib/contestAccess';
import { getCodingUser } from '@/features/coding-contests/server/getCodingUser';

function emptyToNull(v) {
  if (v === '' || v === undefined) return null;
  return v;
}

async function loadContest(supabase, vendorId, contestId) {
  const { data, error } = await supabase
    .from('coding_contests')
    .select('*')
    .eq('id', contestId)
    .eq('vendor_id', vendorId)
    .maybeSingle();
  return { data, error };
}

export async function GET(_request, { params }) {
  const { slug, contestId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  try {
    const supabase = getCodingContestsDb();
    const { data: contest, error: dbErr } = await loadContest(
      supabase,
      ctx.vendor.id,
      contestId
    );
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }
    if (!contest) {
      return NextResponse.json({ success: false, error: 'Contest not found' }, { status: 404 });
    }

    const isStaff =
      ctx.role === 'vendor_staff' ||
      ctx.role === 'vendor_admin' ||
      ctx.isSuperAdmin;
    if (!isStaff && contest.status !== 'published') {
      return NextResponse.json({ success: false, error: 'Contest not found' }, { status: 404 });
    }

    const { data: problems } = await supabase
      .from('coding_problems')
      .select(
        'id, title, slug, points, sort_order, cpu_time_limit, wall_time_limit, memory_limit_kb'
      )
      .eq('contest_id', contestId)
      .order('sort_order', { ascending: true });

    if (!isStaff) {
      const user = await getCodingUser();
      if (user.ok) {
        await ensureParticipant(supabase, contestId, {
          userId: user.userId,
          userEmail: user.email || ctx.email,
          displayName: user.name || ctx.member?.display_name,
        });
      }
    }

    return NextResponse.json({
      success: true,
      contest,
      problems: problems || [],
      active: isContestActive(contest),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { slug, contestId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = updateContestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    const supabase = getCodingContestsDb();
    const { data: existing } = await loadContest(supabase, ctx.vendor.id, contestId);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Contest not found' }, { status: 404 });
    }

    const v = parsed.data;
    const patch = { updated_at: new Date().toISOString() };
    for (const key of Object.keys(v)) {
      if (key === 'starts_at' || key === 'ends_at' || key === 'description') {
        patch[key] = emptyToNull(v[key]);
      } else {
        patch[key] = v[key];
      }
    }

    const { data, error: dbErr } = await supabase
      .from('coding_contests')
      .update(patch)
      .eq('id', contestId)
      .select('*')
      .single();
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, contest: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const { slug, contestId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  try {
    const supabase = getCodingContestsDb();
    const { data: existing } = await loadContest(supabase, ctx.vendor.id, contestId);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Contest not found' }, { status: 404 });
    }
    const { error: dbErr } = await supabase
      .from('coding_contests')
      .delete()
      .eq('id', contestId);
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
