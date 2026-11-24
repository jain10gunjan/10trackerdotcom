import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { insertGeneratedDrafts } from '@/lib/question-gen/generateExamQuestions';
import {
  GATE_CSE_CN_CONFIG,
  mergeGenerationConfig,
} from '@/lib/question-gen/config';

/**
 * POST — generate draft questions (default: GATE CSE Computer Networks).
 * Body optional: { subject, countsByDifficulty, dryRun }
 */
export async function POST(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || 'Admin required' },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) || {};
    const countsByDifficulty = body.countsByDifficulty;
    const dryRun = Boolean(body.dryRun);

    const config = mergeGenerationConfig(GATE_CSE_CN_CONFIG, {
      countsByDifficulty: countsByDifficulty || GATE_CSE_CN_CONFIG.countsByDifficulty,
      subject: body.subject || GATE_CSE_CN_CONFIG.subject,
      category: body.category || GATE_CSE_CN_CONFIG.category,
      status: 'draft',
    });

    if (dryRun) {
      const { buildGeneratedQuestions } = await import(
        '@/lib/question-gen/generateExamQuestions'
      );
      const built = buildGeneratedQuestions(config);
      return NextResponse.json({
        success: true,
        dryRun: true,
        generated: built.rows.length,
        errors: built.errors,
        preview: built.rows.slice(0, 3),
      });
    }

    const supabase = getSupabaseServer(isValidServiceRoleKey());
    const result = await insertGeneratedDrafts(supabase, config);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
