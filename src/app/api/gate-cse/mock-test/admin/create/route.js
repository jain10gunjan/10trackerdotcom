import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { fetchMockTestsForCategory } from '@/features/mock-test/lib/mockTestQueries';

/** Creates rows in mock_tests (not gate_cse_tests) */
export async function POST(request) {
  const { isAdmin, userEmail, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      totalQuestions,
      duration,
      difficulty,
      examCategory = 'gate-cse',
    } = body;

    if (!name || !totalQuestions || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: name, totalQuestions, duration' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer(true);
    const category = getCategoryVariants(examCategory)[0] || 'GATE-CSE';

    const { data: test, error } = await supabase
      .from('mock_tests')
      .insert({
        name,
        description: description || '',
        total_questions: totalQuestions,
        duration,
        difficulty: difficulty || 'mixed',
        category,
        created_by: userEmail || 'admin',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test created successfully',
      test: { id: test.id, name: test.name, createdAt: test.created_at },
    });
  } catch (error) {
    console.error('Error creating test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const tests = await fetchMockTestsForCategory('gate-cse', { useServiceRole: true });
    return NextResponse.json({ success: true, tests });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
