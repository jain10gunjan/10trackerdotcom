import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { previewKcetPaper, previewKcetSubject } from '@/features/mock-test/lib/kcetGenerator';
import { isKcetExamSlug, KCET_PAPER } from '@/features/mock-test/lib/kcetBlueprint';
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
      examCategory = 'kcet',
    } = body || {};

    if (!isKcetExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for kcet' },
        { status: 400 }
      );
    }

    if (subject) {
      const result = await previewKcetSubject({ subject, excludedIds, dayIndex });
      return NextResponse.json({
        success: true,
        ok: result.ok,
        mode: 'subject',
        subject: result.subject,
        count: result.count,
        pickIds: result.ok ? result.picks.map((p) => p._id) : [],
        audit: result.audit,
        dayIndex: result.dayIndex,
        paper: KCET_PAPER,
      });
    }

    const result = await previewKcetPaper({ excludedIds, dayIndex });
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
      paper: KCET_PAPER,
    });
  } catch (err) {
    console.error('kcet preview', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Preview failed' },
      { status: 500 }
    );
  }
}
