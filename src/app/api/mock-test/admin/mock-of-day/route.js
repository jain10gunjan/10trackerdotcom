import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import {
  MOTD_DEFAULTS,
  MOTD_SETUP_HINT,
  listMotdPool,
  generateMotdMock,
  addMockToMotdPool,
  updateMotdPoolItem,
  removeMotdPoolItem,
  resolveMockOfTheDay,
  normalizeMotdExamSlug,
} from '@/features/mock-test/lib/mockOfTheDay';
import {
  formatAdminDbError,
  SUPABASE_ADMIN_SETUP_HINT,
} from '@/lib/supabaseAdmin';

const SETUP_HINT = MOTD_SETUP_HINT;

export async function GET(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const examCategory = normalizeMotdExamSlug(searchParams.get('category') || '');
    if (!examCategory) {
      return NextResponse.json(
        { success: false, error: 'category is required' },
        { status: 400 }
      );
    }

    const { items, setupRequired, error, setupHint } = await listMotdPool(examCategory);
    if (error && !setupRequired) {
      return NextResponse.json(
        {
          success: false,
          error: formatAdminDbError(error),
          setupHint: setupHint || SETUP_HINT,
        },
        { status: 500 }
      );
    }

    const today = await resolveMockOfTheDay(examCategory);

    return NextResponse.json({
      success: true,
      examCategory,
      defaults: MOTD_DEFAULTS,
      pool: items,
      today,
      setupRequired: Boolean(setupRequired),
      setupHint: setupRequired ? setupHint || SETUP_HINT : null,
    });
  } catch (err) {
    console.error('motd GET', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load MOTD pool' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { isAdmin, userEmail, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const action = String(body.action || '').trim();
    const examCategory = normalizeMotdExamSlug(body.examCategory || body.category || '');

    if (!examCategory) {
      return NextResponse.json(
        { success: false, error: 'examCategory is required' },
        { status: 400 }
      );
    }

    if (action === 'generate') {
      const result = await generateMotdMock({
        examCategory,
        totalQuestions: body.totalQuestions ?? MOTD_DEFAULTS.totalQuestions,
        duration: body.duration ?? MOTD_DEFAULTS.duration,
        difficulty: body.difficulty ?? MOTD_DEFAULTS.difficulty,
        createdBy: userEmail || 'admin',
      });

      if (result.setupRequired) {
        return NextResponse.json(
          {
            success: false,
            error: result.poolError?.message || 'MOTD setup required',
            setupHint: result.setupHint || SETUP_HINT,
            testId: result.test?.id,
          },
          { status: 400 }
        );
      }

      if (result.poolError) {
        return NextResponse.json(
          {
            success: false,
            error: formatAdminDbError(result.poolError),
            setupHint: result.setupHint || SETUP_HINT,
            testId: result.test?.id,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Generated MOTD mock with ${result.questionCount} questions and added to pool`,
        testId: result.test.id,
        testName: result.test.name,
        questionCount: result.questionCount,
        poolItem: result.poolItem,
      });
    }

    if (action === 'add') {
      const mockTestId = body.mockTestId;
      if (!mockTestId) {
        return NextResponse.json(
          { success: false, error: 'mockTestId is required' },
          { status: 400 }
        );
      }

      const { item, error, setupRequired, setupHint } = await addMockToMotdPool({
        examCategory,
        mockTestId,
      });

      if (setupRequired) {
        return NextResponse.json(
          {
            success: false,
            error: error?.message || 'MOTD setup required',
            setupHint: setupHint || SETUP_HINT,
          },
          { status: 400 }
        );
      }
      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: formatAdminDbError(error) || error.message,
            setupHint: setupHint || undefined,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Added to Mock of the Day pool',
        poolItem: item,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action. Use generate or add.' },
      { status: 400 }
    );
  } catch (err) {
    console.error('motd POST', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to update MOTD pool',
        setupHint: SUPABASE_ADMIN_SETUP_HINT,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const examCategory = normalizeMotdExamSlug(body.examCategory || body.category || '');
    const poolId = body.poolId ?? body.id;

    if (!examCategory || poolId == null) {
      return NextResponse.json(
        { success: false, error: 'examCategory and poolId are required' },
        { status: 400 }
      );
    }

    const { item, error, setupRequired } = await updateMotdPoolItem({
      poolId,
      examCategory,
      is_active: body.is_active,
      sort_order: body.sort_order,
    });

    if (setupRequired) {
      return NextResponse.json(
        { success: false, error: 'MOTD pool table missing', setupHint: SETUP_HINT },
        { status: 400 }
      );
    }
    if (error) {
      return NextResponse.json(
        { success: false, error: formatAdminDbError(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, poolItem: item });
  } catch (err) {
    console.error('motd PATCH', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update pool item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const examCategory = normalizeMotdExamSlug(body.examCategory || body.category || '');
    const poolId = body.poolId ?? body.id;

    if (!examCategory || poolId == null) {
      return NextResponse.json(
        { success: false, error: 'examCategory and poolId are required' },
        { status: 400 }
      );
    }

    const { error, setupRequired } = await removeMotdPoolItem({ poolId, examCategory });

    if (setupRequired) {
      return NextResponse.json(
        { success: false, error: 'MOTD pool table missing', setupHint: SETUP_HINT },
        { status: 400 }
      );
    }
    if (error) {
      return NextResponse.json(
        { success: false, error: formatAdminDbError(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Removed from MOTD pool' });
  } catch (err) {
    console.error('motd DELETE', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to remove pool item' },
      { status: 500 }
    );
  }
}
