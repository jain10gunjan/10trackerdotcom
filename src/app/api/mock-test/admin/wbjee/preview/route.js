import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { previewWbjeePaper, previewWbjeeSubject } from '@/features/mock-test/lib/wbjeeGenerator';
import { isWbjeeExamSlug, WBJEE_PAPER } from '@/features/mock-test/lib/wbjeeBlueprint';
import { getIstCalendarDate, istDayIndex } from '@/features/mock-test/lib/mockOfTheDay';

export async function POST(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const {
      subject = null,
      excludedIds = [],
      dayIndex = istDayIndex(getIstCalendarDate()),
      examCategory = 'wbjee',
    } = body || {};

    if (!isWbjeeExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for wbjee' },
        { status: 400 }
      );
    }

    if (subject) {
      const result = await previewWbjeeSubject({ subject, excludedIds, dayIndex });
      return NextResponse.json({
        success: true,
        ok: result.ok,
        mode: 'subject',
        subject: result.subject,
        count: result.count,
        pickIds: result.ok ? result.picks.map((p) => p._id) : [],
        audit: result.audit,
        dayIndex: result.dayIndex,
        paper: WBJEE_PAPER,
      });
    }

    const result = await previewWbjeePaper({ excludedIds, dayIndex });
    return NextResponse.json({
      success: true,
      ok: result.ok,
      mode: 'full',
      subjects: result.subjects.map((s) => ({
        subject: s.subject,
        ok: s.ok,
        count: s.count,
        audit: s.audit,
        pickIds: s.ok ? s.picks.map((p) => p._id) : [],
      })),
      pickIds: result.ok ? result.picks.map((p) => p._id) : [],
      paper: WBJEE_PAPER,
    });
  } catch (err) {
    console.error('wbjee preview', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Preview failed' },
      { status: 500 }
    );
  }
}
