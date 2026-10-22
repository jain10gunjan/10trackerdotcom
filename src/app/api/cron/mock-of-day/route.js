import { NextResponse } from 'next/server';
import { runJeeMainMotdCron } from '@/features/mock-test/lib/jeeMainMotdCron';
import { runGateCseMotdCron } from '@/features/mock-test/lib/gateCseMotdCron';
import { runGateEeMotdCron } from '@/features/mock-test/lib/gateEeMotdCron';
import { runGateEcMotdCron } from '@/features/mock-test/lib/gateEcMotdCron';
import { runMhtCetMotdCron } from '@/features/mock-test/lib/mhtCetMotdCron';
import { runViteeeMotdCron } from '@/features/mock-test/lib/viteeeMotdCron';
import { runWbjeeMotdCron } from '@/features/mock-test/lib/wbjeeMotdCron';
import { runKcetMotdCron } from '@/features/mock-test/lib/kcetMotdCron';
import { runCatMotdCron } from '@/features/mock-test/lib/catMotdCron';

function authorizeCron(request) {
  const expected =
    String(process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET || '').trim();
  if (!expected) {
    return { ok: false, error: 'CRON_SECRET (or INTERNAL_API_SECRET) is not configured' };
  }

  const header =
    request.headers.get('authorization') ||
    request.headers.get('x-cron-secret') ||
    '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim();
  const querySecret = new URL(request.url).searchParams.get('secret') || '';

  if (bearer === expected || querySecret === expected) {
    return { ok: true };
  }
  return { ok: false, error: 'Unauthorized' };
}

/**
 * Hostinger cron (once daily ~00:05 IST):
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://www.10tracker.com/api/cron/mock-of-day
 *
 * Runs JEE Main, GATE CSE/EE/EC, MHT-CET, VITEEE, WBJEE, KCET, and CAT MOTD crons (each no-ops if auto_daily disabled).
 */
export async function POST(request) {
  const auth = authorizeCron(request);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.error === 'Unauthorized' ? 401 : 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const force = Boolean(body?.force);
    const [jee, gateCse, gateEe, gateEc, mhtCet, viteee, wbjee, kcet, cat] = await Promise.all([
      runJeeMainMotdCron({ force, createdBy: 'cron' }),
      runGateCseMotdCron({ force, createdBy: 'cron' }),
      runGateEeMotdCron({ force, createdBy: 'cron' }),
      runGateEcMotdCron({ force, createdBy: 'cron' }),
      runMhtCetMotdCron({ force, createdBy: 'cron' }),
      runViteeeMotdCron({ force, createdBy: 'cron' }),
      runWbjeeMotdCron({ force, createdBy: 'cron' }),
      runKcetMotdCron({ force, createdBy: 'cron' }),
      runCatMotdCron({ force, createdBy: 'cron' }),
    ]);
    const success =
      (jee.ok || jee.skipped) &&
      (gateCse.ok || gateCse.skipped) &&
      (gateEe.ok || gateEe.skipped) &&
      (gateEc.ok || gateEc.skipped) &&
      (mhtCet.ok || mhtCet.skipped) &&
      (viteee.ok || viteee.skipped) &&
      (wbjee.ok || wbjee.skipped) &&
      (kcet.ok || kcet.skipped) &&
      (cat.ok || cat.skipped);
    return NextResponse.json({
      success,
      jeeMain: jee,
      gateCse,
      gateEe,
      gateEc,
      mhtCet,
      viteee,
      wbjee,
      kcet,
      cat,
    });
  } catch (err) {
    console.error('cron mock-of-day', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Cron failed' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return POST(request);
}
