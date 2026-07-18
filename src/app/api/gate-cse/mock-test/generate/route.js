import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { getSupabaseServer } from '@/lib/supabaseServer';

/**
 * Auto-generate a mock test: mock_tests + mock_test_questions from examtracker.
 * POST { examCategory, name, totalQuestions, duration, difficulty? }
 */
export async function POST(request) {
  const { isAdmin, userEmail, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      examCategory = 'gate-cse',
      name,
      totalQuestions = 65,
      duration = 180,
      difficulty,
    } = body;

    if (!name || !totalQuestions) {
      return NextResponse.json(
        { success: false, error: 'name and totalQuestions are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer(true);
    const category = getCategoryVariants(examCategory)[0] || 'GATE-CSE';
    const limit = Math.min(Math.max(1, Number(totalQuestions)), 200);

    let qQuery = supabase
      .from('examtracker')
      .select('_id, subject, topic, difficulty')
      .eq('category', category)
      .limit(limit * 3);

    if (difficulty && difficulty !== 'mixed') {
      qQuery = qQuery.eq('difficulty', difficulty);
    }

    const { data: pool, error: poolError } = await qQuery;
    if (poolError) throw poolError;
    if (!pool?.length) {
      return NextResponse.json(
        { success: false, error: `No questions found for category ${category}` },
        { status: 404 }
      );
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, limit);

    const { data: testRow, error: testError } = await supabase
      .from('mock_tests')
      .insert({
        name,
        description: `Auto-generated ${category} mock test`,
        duration,
        total_questions: shuffled.length,
        difficulty: difficulty || 'mixed',
        category,
        created_by: userEmail || 'admin',
        is_active: true,
        creation_mode: 'auto',
      })
      .select()
      .single();

    if (testError) throw testError;

    const mappings = shuffled.map((q, index) => ({
      test_id: testRow.id,
      question_id: q._id,
      question_order: index + 1,
      subject: q.subject || 'General',
      topic: q.topic || 'General',
      difficulty: q.difficulty || 'medium',
    }));

    const { error: mapError } = await supabase.from('mock_test_questions').insert(mappings);
    if (mapError) {
      await supabase.from('mock_tests').delete().eq('id', testRow.id);
      throw mapError;
    }

    return NextResponse.json({
      success: true,
      message: 'Mock test generated successfully',
      testId: testRow.id,
      testName: testRow.name,
      questionCount: shuffled.length,
      href: `/mock-test/${String(examCategory).toLowerCase()}/attempt/${testRow.id}`,
    });
  } catch (error) {
    console.error('Generate test error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate test' },
      { status: 500 }
    );
  }
}
