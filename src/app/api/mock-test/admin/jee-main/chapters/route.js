import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { listJeeMainChapters } from '@/features/mock-test/lib/jeeChapterMock';
import { isJeeMainExamSlug } from '@/features/mock-test/lib/jeeMainBlueprint';

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
    const examCategory = searchParams.get('category') || 'jee-main';
    const subject = searchParams.get('subject') || null;

    if (!isJeeMainExamSlug(examCategory)) {
      return NextResponse.json(
        { success: false, error: 'Only for jee-main' },
        { status: 400 }
      );
    }

    const chapters = await listJeeMainChapters({ subject });
    const subjects = [...new Set(chapters.map((c) => c.subject))].sort();

    return NextResponse.json({
      success: true,
      subjects,
      chapters,
      defaults: { totalQuestions: 20, durationMinutes: 45 },
    });
  } catch (err) {
    console.error('jee chapters list', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list chapters' },
      { status: 500 }
    );
  }
}
