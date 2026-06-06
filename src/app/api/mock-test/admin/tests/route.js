import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getCategoryVariants } from '@/lib/mockTestUtils';
import { fetchAdminMockTestsList } from '@/lib/mockTestQueries';
import {
  getSupabaseAdmin,
  formatAdminDbError,
  SUPABASE_ADMIN_SETUP_HINT,
} from '@/lib/supabaseAdmin';

function categoryMatchesTest(testCategory, examCategory) {
  const variants = getCategoryVariants(examCategory);
  const normalized = String(testCategory || '').trim().toUpperCase();
  return variants.some(
    (v) =>
      normalized === v.toUpperCase() ||
      normalized.replace(/-/g, '_') === v.toUpperCase().replace(/-/g, '_')
  );
}

/** GET ?category=upsc-prelims — list tests (incl. inactive) for admin */
export async function GET(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const category = new URL(request.url).searchParams.get('category');
    if (!category) {
      return NextResponse.json({ error: 'category query param is required' }, { status: 400 });
    }

    const tests = await fetchAdminMockTestsList(category);

    return NextResponse.json({ success: true, tests });
  } catch (err) {
    console.error('[mock-test admin tests GET]', err);
    return NextResponse.json(
      {
        success: false,
        error: formatAdminDbError(err),
        setupHint: SUPABASE_ADMIN_SETUP_HINT,
      },
      { status: 500 }
    );
  }
}

/** PATCH { testId, patch: { name?, description?, duration?, difficulty?, is_active? } } */
export async function PATCH(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const testId = body?.testId;
    const patch = body?.patch;

    if (!testId || !patch || typeof patch !== 'object') {
      return NextResponse.json(
        { error: 'testId and patch object are required' },
        { status: 400 }
      );
    }

    const allowed = {};
    if (patch.name !== undefined) {
      const name = String(patch.name).trim();
      if (!name) {
        return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 });
      }
      allowed.name = name;
    }
    if (patch.description !== undefined) {
      allowed.description = String(patch.description).trim();
    }
    if (patch.duration !== undefined) {
      const d = Number(patch.duration);
      if (!Number.isFinite(d) || d < 1 || d > 600) {
        return NextResponse.json({ error: 'duration must be 1–600 minutes' }, { status: 400 });
      }
      allowed.duration = Math.round(d);
    }
    if (patch.difficulty !== undefined) {
      const d = String(patch.difficulty).trim().toLowerCase();
      if (!['easy', 'medium', 'hard', 'mixed'].includes(d)) {
        return NextResponse.json({ error: 'invalid difficulty' }, { status: 400 });
      }
      allowed.difficulty = d;
    }
    if (patch.is_active !== undefined) {
      allowed.is_active = Boolean(patch.is_active);
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existing, error: fetchErr } = await supabase
      .from('mock_tests')
      .select('id, category')
      .eq('id', testId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (body.examCategory && !categoryMatchesTest(existing.category, body.examCategory)) {
      return NextResponse.json({ error: 'Test does not belong to this category' }, { status: 403 });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('mock_tests')
      .update(allowed)
      .eq('id', testId)
      .select('id, name, description, duration, total_questions, difficulty, is_active, category')
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, test: updated });
  } catch (err) {
    console.error('[mock-test admin tests PATCH]', err);
    return NextResponse.json(
      {
        success: false,
        error: formatAdminDbError(err),
        setupHint: SUPABASE_ADMIN_SETUP_HINT,
      },
      { status: 500 }
    );
  }
}

/** DELETE { testId } — soft delete only (sets is_active = false) */
export async function DELETE(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const testId = body?.testId;
    if (!testId) {
      return NextResponse.json({ error: 'testId is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existing, error: fetchErr } = await supabase
      .from('mock_tests')
      .select('id, name, category, is_active')
      .eq('id', testId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (body.examCategory && !categoryMatchesTest(existing.category, body.examCategory)) {
      return NextResponse.json({ error: 'Test does not belong to this category' }, { status: 403 });
    }

    if (existing.is_active === false) {
      return NextResponse.json({
        success: true,
        testId,
        message: `"${existing.name}" is already inactive`,
      });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('mock_tests')
      .update({ is_active: false })
      .eq('id', testId)
      .select('id, name, is_active')
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      testId,
      test: updated,
      message: `Deactivated "${existing.name}" (hidden from students, data preserved)`,
    });
  } catch (err) {
    console.error('[mock-test admin tests DELETE]', err);
    return NextResponse.json(
      {
        success: false,
        error: formatAdminDbError(err),
        setupHint: SUPABASE_ADMIN_SETUP_HINT,
      },
      { status: 500 }
    );
  }
}
