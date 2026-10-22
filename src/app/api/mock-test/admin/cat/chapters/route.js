import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { listCatTopics, CAT_TOPIC_DEFAULTS } from '@/features/mock-test/lib/catTopicMock';
import { isCatExamSlug } from '@/features/mock-test/lib/catBlueprint';

export async function GET(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const examCategory = searchParams.get('category') || 'cat';
    const subject = searchParams.get('subject') || null;
    if (!isCatExamSlug(examCategory)) {
      return NextResponse.json({ success: false, error: 'Only for cat' }, { status: 400 });
    }

    const chapters = await listCatTopics({ subject });
    const subjects = [...new Set(chapters.map((c) => c.subject))].sort();
    return NextResponse.json({
      success: true,
      subjects,
      chapters,
      defaults: CAT_TOPIC_DEFAULTS,
    });
  } catch (err) {
    console.error('cat topics list', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list topics' },
      { status: 500 }
    );
  }
}
