import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import {
  previewJeeMainPaper,
  previewJeeMainSubject,
} from '@/features/mock-test/lib/jeeMainGenerator';
import { JEE_MAIN_PAPER, isJeeMainExamSlug } from '@/features/mock-test/lib/jeeMainBlueprint';
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
      examCategory = 'jee-main',
    } = body || {};

    if (!isJeeMainExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for jee-main' },
        { status: 400 }
      );
    }

    if (subject) {
      const result = await previewJeeMainSubject({
        subject,
        excludedIds,
        dayIndex,
      });
      return NextResponse.json({
        success: true,
        ok: result.ok,
        mode: 'subject',
        subject: result.subject,
        picks: result.ok
          ? result.picks.map((p) => ({
              id: p._id,
              subject: p.subject,
              chapter: p.chapter,
              topic: p.topic,
              difficulty: p.difficulty,
              section: p._section,
              qType: p._qType,
              blueprintKey: p._blueprintKey,
            }))
          : [],
        pickIds: result.ok ? result.picks.map((p) => p._id) : [],
        audit: result.audit,
        dayIndex: result.dayIndex,
        paper: JEE_MAIN_PAPER,
      });
    }

    const result = await previewJeeMainPaper({ excludedIds, dayIndex });
    return NextResponse.json({
      success: true,
      ok: result.ok,
      mode: 'full',
      subjects: result.subjects.map((s) => ({
        subject: s.subject,
        ok: s.ok,
        audit: s.audit,
        pickIds: s.ok ? s.picks.map((p) => p._id) : [],
        picks: s.ok
          ? s.picks.map((p) => ({
              id: p._id,
              subject: p.subject,
              chapter: p.chapter,
              topic: p.topic,
              difficulty: p.difficulty,
              section: p._section,
              qType: p._qType,
              blueprintKey: p._blueprintKey,
            }))
          : [],
      })),
      pickIds: result.ok ? result.picks.map((p) => p._id) : [],
      dayIndex: result.dayIndex,
      paper: result.paper,
    });
  } catch (err) {
    console.error('jee-main preview', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Preview failed' },
      { status: 500 }
    );
  }
}
