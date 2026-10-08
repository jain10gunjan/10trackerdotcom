import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function normalizeCategory(param) {
  if (!param || typeof param !== 'string') return 'GATE-CSE';
  return param.trim().toUpperCase().replace(/_/g, '-');
}

export async function POST(request) {
  const { isAdmin, error: authError, userEmail } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      category,
      title,
      description,
      date_for,
      scopeSubject,
      scopeTopic,
      scopeChapter,
      questionIds,
      createdBy,
    } = body;

    if (!category || !title || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: category, title, questionIds' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const normalizedCategory = normalizeCategory(category);

    const { data: setRows, error: setError } = await supabase
      .from('daily_practice_sets')
      .insert({
        category: normalizedCategory,
        title,
        description: description || '',
        date_for: date_for || new Date().toISOString().slice(0, 10),
        scope_subject: scopeSubject || null,
        scope_topic: scopeTopic || null,
        scope_chapter: scopeChapter || null,
        created_by: createdBy || userEmail || null,
        is_active: true,
      })
      .select()
      .single();

    if (setError) {
      console.error('Error inserting daily_practice_set:', setError);
      return NextResponse.json(
        { error: 'Failed to create daily practice set' },
        { status: 500 }
      );
    }

    const setId = setRows.id;

    const mappingRows = questionIds.map((qid, index) => ({
      set_id: setId,
      question_id: qid,
      order_index: index + 1,
    }));

    const { error: mappingError } = await supabase
      .from('daily_practice_questions')
      .insert(mappingRows);

    if (mappingError) {
      console.error('Error inserting daily_practice_questions:', mappingError);
      await supabase.from('daily_practice_sets').delete().eq('id', setId);
      return NextResponse.json(
        { error: 'Failed to attach questions to daily practice set' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, setId }, { status: 201 });
  } catch (error) {
    console.error('Daily practice create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
