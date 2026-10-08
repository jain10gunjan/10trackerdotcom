import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import { toVendorQuestionInsert } from '@/features/vendor-tests/lib/vendorQuestionNormalize';
import { insertVendorQuestions } from '@/features/vendor-tests/lib/vendorQuestionDb';

/**
 * POST — create a small sample bank + published test if the vendor has no tests yet.
 * Prefer copying from examtracker; fall back to two built-in MCQs.
 */
export async function POST(_request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_admin');
  if (error) return error;

  const { count: testCount } = await ctx.supabase
    .from('vendor_tests')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', ctx.vendor.id);

  if (testCount > 0) {
    return NextResponse.json(
      { success: false, error: 'Vendor already has tests. Sample seed skipped.' },
      { status: 409 }
    );
  }

  let questionIds = [];

  const { data: platform } = await ctx.supabase
    .from('examtracker')
    .select(
      '_id, topic, category, subject, chapter, difficulty, year, question, options_A, options_B, options_C, options_D, correct_option, solution, directionHTML'
    )
    .limit(5);

  if (platform?.length) {
    const inserts = platform.map((src) =>
      toVendorQuestionInsert(
        {
          ...src,
          _id: randomUUID(),
          category: src.category || 'SAMPLE',
          topic: src.topic || 'sample',
          difficulty: src.difficulty || 'easy',
          question: src.question,
        },
        {
          vendorId: ctx.vendor.id,
          source: 'copied_from_platform',
          sourceQuestionId: String(src._id),
          createdBy: ctx.email,
        }
      )
    );
    const { data: saved, error: insError } = await insertVendorQuestions(
      ctx.supabase,
      inserts
    );
    if (insError) {
      return NextResponse.json({ success: false, error: insError.message }, { status: 500 });
    }
    questionIds = (saved || []).map((q) => q._id);
  } else {
    const samples = [
      {
        _id: randomUUID(),
        topic: 'sample-aptitude',
        category: 'VENDOR-SAMPLE',
        subject: 'Arithmetic',
        chapter: 'Basics',
        difficulty: 'easy',
        question: '<p>What is 15% of 200?</p>',
        options_A: '20',
        options_B: '30',
        options_C: '25',
        options_D: '35',
        correct_option: 'B',
        solution: '<p>15% of 200 = 30.</p>',
      },
      {
        _id: randomUUID(),
        topic: 'sample-aptitude',
        category: 'VENDOR-SAMPLE',
        subject: 'Arithmetic',
        chapter: 'Basics',
        difficulty: 'easy',
        question: '<p>If a train covers 60 km in 45 minutes, its speed in km/h is?</p>',
        options_A: '60',
        options_B: '75',
        options_C: '80',
        options_D: '90',
        correct_option: 'C',
        solution: '<p>60 km in 0.75 h → 80 km/h.</p>',
      },
    ];
    const inserts = samples.map((row) =>
      toVendorQuestionInsert(row, {
        vendorId: ctx.vendor.id,
        source: 'manual',
        createdBy: ctx.email,
      })
    );
    const { data: saved, error: insError } = await insertVendorQuestions(
      ctx.supabase,
      inserts
    );
    if (insError) {
      return NextResponse.json({ success: false, error: insError.message }, { status: 500 });
    }
    questionIds = (saved || []).map((q) => q._id);
  }

  const { data: test, error: testError } = await ctx.supabase
    .from('vendor_tests')
    .insert({
      vendor_id: ctx.vendor.id,
      title: 'Sample Placement Aptitude Test',
      description: 'Auto-seeded sample test for this institute portal.',
      instructions: 'Answer all questions. No negative marking on this sample.',
      duration_minutes: 30,
      status: 'published',
      negative_marking: 0,
      max_attempts: 3,
      result_release: 'instant',
      anti_cheat_enabled: true,
      total_questions: questionIds.length,
      total_marks: questionIds.length,
      created_by: ctx.email,
    })
    .select()
    .single();

  if (testError) {
    return NextResponse.json({ success: false, error: testError.message }, { status: 500 });
  }

  const pins = questionIds.map((qid, index) => ({
    vendor_id: ctx.vendor.id,
    test_id: test.id,
    question_id: qid,
    question_order: index + 1,
    marks: 1,
  }));
  await ctx.supabase.from('vendor_test_questions').insert(pins);

  await writeVendorAuditLog(ctx.supabase, {
    vendorId: ctx.vendor.id,
    actorEmail: ctx.email,
    action: 'vendor.sample_seeded',
    entityType: 'vendor_test',
    entityId: test.id,
    details: { questionCount: questionIds.length },
  });

  return NextResponse.json({
    success: true,
    test,
    questionCount: questionIds.length,
  });
}
