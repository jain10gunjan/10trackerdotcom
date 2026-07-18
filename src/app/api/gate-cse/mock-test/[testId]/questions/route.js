import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function transformQuestion(q, index) {
  return {
    id: q._id || index + 1,
    question: q.question,
    type: 'MCQ',
    subject: q.subject || q.topic,
    difficulty: q.difficulty,
    options_A: q.options_A,
    options_B: q.options_B,
    options_C: q.options_C,
    options_D: q.options_D,
    correct_option: q.correct_option,
    solution: q.solution || q.solutiontext,
  };
}

export async function GET(request, { params }) {
  try {
    const { testId } = await params;

    const { data: test, error: testError } = await supabase
      .from('mock_tests')
      .select('*')
      .eq('id', testId)
      .eq('is_active', true)
      .single();

    if (testError) {
      console.error('Supabase error:', testError);
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    const categoryVariants = getCategoryVariants('gate-cse');

    // Prefer pinned questions from mock_test_questions when present
    const { data: pinnedRows } = await supabase
      .from('mock_test_questions')
      .select('question_id, question_order')
      .eq('test_id', testId)
      .order('question_order');

    if (pinnedRows?.length) {
      const questionIds = pinnedRows.map((r) => r.question_id).filter(Boolean);
      const { data: pinnedQuestions, error: pinnedError } = await supabase
        .from('examtracker')
        .select('_id, question, options_A, options_B, options_C, options_D, correct_option, solution, solutiontext, topic, difficulty, subject')
        .in('_id', questionIds);

      if (!pinnedError && pinnedQuestions?.length) {
        const byId = new Map(pinnedQuestions.map((q) => [q._id, q]));
        const ordered = pinnedRows
          .map((row, index) => {
            const q = byId.get(row.question_id);
            if (!q) return null;
            return transformQuestion(q, index);
          })
          .filter(Boolean);

        if (ordered.length > 0) {
          return NextResponse.json({ success: true, questions: ordered });
        }
      }
    }

    // Fallback: random pool from examtracker (legacy)
    let query = supabase
      .from("examtracker")
      .select("_id, question, options_A, options_B, options_C, options_D, correct_option, solution, solutiontext, topic, difficulty, subject")
      .in("category", categoryVariants);

    // Apply difficulty filter if specified
    if (test.difficulty && test.difficulty !== 'mixed') {
      query = query.eq("difficulty", test.difficulty);
    }

    // Limit to total questions specified in test
    query = query.limit(test.total_questions);

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      console.error('Supabase error:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this test' },
        { status: 404 }
      );
    }

    const transformedQuestions = questions.map((q, index) => transformQuestion(q, index));

    return NextResponse.json({
      success: true,
      questions: transformedQuestions
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
