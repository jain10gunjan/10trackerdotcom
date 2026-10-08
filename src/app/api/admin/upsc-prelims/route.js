import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseAdmin, formatAdminDbError } from '@/lib/supabaseAdmin';

function normalizeQuestions(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.questions)) return body.questions;
  if (body && typeof body === 'object') return [body];
  return [];
}

function isValidQuestion(q) {
  return (
    q &&
    typeof q === 'object' &&
    typeof q.question === 'string' &&
    q.question.trim() &&
    typeof q.correct_option === 'string' &&
    q.correct_option.trim()
  );
}

export async function POST(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const questions = normalizeQuestions(body).filter(isValidQuestion);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Provide at least one valid question object' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('upscprelims').insert(questions).select();

    if (error) {
      console.error('UPSC prelims insert error:', error);
      return NextResponse.json(
        { error: formatAdminDbError(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || questions.length,
      questions: data || [],
    });
  } catch (error) {
    console.error('UPSC prelims admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
