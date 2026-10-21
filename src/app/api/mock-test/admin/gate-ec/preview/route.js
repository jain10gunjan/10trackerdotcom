import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import {
  previewGateEcBlock,
  previewGateEcPaper,
} from '@/features/mock-test/lib/gateEcGenerator';
import {
  GATE_EC_PAPER,
  isGateEcExamSlug,
  listGateEcBlockIds,
} from '@/features/mock-test/lib/gateEcBlueprint';

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
      blockId = null,
      excludedIds = [],
      examCategory = 'gate-ec',
    } = body || {};

    if (!isGateEcExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for gate-ec' },
        { status: 400 }
      );
    }

    if (blockId) {
      if (!listGateEcBlockIds().includes(blockId)) {
        return NextResponse.json(
          { success: false, error: `Unknown blockId: ${blockId}` },
          { status: 400 }
        );
      }
      const result = await previewGateEcBlock({ blockId, excludedIds });
      return NextResponse.json({
        success: true,
        ok: result.ok,
        mode: 'block',
        blockId: result.blockId,
        subject: result.subject,
        picks: result.ok
          ? result.picks.map((p) => ({
              id: p._id,
              subject: p.subject,
              chapter: p.chapter,
              topic: p.topic,
              difficulty: p.difficulty,
              marks: p._marks,
              qType: p._qType,
              blueprintKey: p._blueprintKey,
            }))
          : [],
        pickIds: result.ok ? result.picks.map((p) => p._id) : [],
        audit: result.audit,
        paper: GATE_EC_PAPER,
      });
    }

    const result = await previewGateEcPaper({ excludedIds });
    return NextResponse.json({
      success: true,
      ok: result.ok,
      mode: 'full',
      blocks: result.blocks.map((b) => ({
        blockId: b.blockId,
        subject: b.subject,
        ok: b.ok,
        audit: b.audit,
        pickIds: b.ok ? b.picks.map((p) => p._id) : [],
        picks: b.ok
          ? b.picks.map((p) => ({
              id: p._id,
              subject: p.subject,
              chapter: p.chapter,
              topic: p.topic,
              difficulty: p.difficulty,
              marks: p._marks,
              qType: p._qType,
              blueprintKey: p._blueprintKey,
            }))
          : [],
      })),
      pickIds: result.ok ? result.picks.map((p) => p._id) : [],
      paper: result.paper,
    });
  } catch (err) {
    console.error('gate-ec preview', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Preview failed' },
      { status: 500 }
    );
  }
}
