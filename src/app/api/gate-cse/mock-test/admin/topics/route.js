import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: subjects, error: subjectsError } = await supabase
      .from('examtracker')
      .select('subject')
      .eq('category', 'GATE-CSE')
      .not('subject', 'is', null);

    if (subjectsError) {
      console.error('Error fetching subjects:', subjectsError);
      return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
    }

    const { data: topics, error: topicsError } = await supabase
      .from('examtracker')
      .select('topic')
      .eq('category', 'GATE-CSE')
      .not('topic', 'is', null);

    if (topicsError) {
      console.error('Error fetching topics:', topicsError);
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }

    const uniqueSubjects = [...new Set(subjects.map((s) => s.subject))].sort();
    const uniqueTopics = [...new Set(topics.map((t) => t.topic))].sort();

    return NextResponse.json({
      success: true,
      subjects: uniqueSubjects,
      topics: uniqueTopics,
    });
  } catch (error) {
    console.error('Error fetching topics and subjects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
