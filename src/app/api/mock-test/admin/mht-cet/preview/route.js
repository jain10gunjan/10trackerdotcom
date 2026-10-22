import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { previewMhtCetPaper, previewMhtCetSubject } from '@/features/mock-test/lib/mhtCetGenerator';
import { isMhtCetExamSlug, MHT_CET_PAPER } from '@/features/mock-test/lib/mhtCetBlueprint';
import { getIstCalendarDate, istDayIndex } from '@/features/mock-test/lib/mockOfTheDay';

function publicPick(pick) {
  return {
    id: pick._id,
    subject: pick.subject,
    chapter: pick.chapter,
    topic: pick.topic,
    difficulty: pick.difficulty,
    classLevel: pick._classLevel,
    marks: pick._marks,
    blueprintKey: pick._blueprintKey,
  };
}

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
      examCategory = 'mht-cet',
    } = body || {};

    if (!isMhtCetExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for mht-cet' },
        { status: 400 }
      );
    }

    if (subject) {
      const result = await previewMhtCetSubject({ subject, excludedIds, dayIndex });
      return NextResponse.json({
        success: true,
        ok: result.ok,
        mode: 'subject',
        subject: result.subject,
        picks: result.ok ? result.picks.map(publicPick) : [],
        pickIds: result.ok ? result.picks.map((p) => p._id) : [],
        audit: result.audit,
        dayIndex: result.dayIndex,
        paper: MHT_CET_PAPER,
      });
    }

    const result = await previewMhtCetPaper({ excludedIds, dayIndex });
    return NextResponse.json({
      success: true,
      ok: result.ok,
      mode: 'full',
      subjects: result.subjects.map((s) => ({
        subject: s.subject,
        ok: s.ok,
        audit: s.audit,
        pickIds: s.ok ? s.picks.map((p) => p._id) : [],
      })),
      pickIds: result.ok ? result.picks.map((p) => p._id) : [],
      paper: MHT_CET_PAPER,
    });
  } catch (err) {
    console.error('mht-cet preview', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Preview failed' },
      { status: 500 }
    );
  }
}
