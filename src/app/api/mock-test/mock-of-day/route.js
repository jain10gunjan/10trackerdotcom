import { NextResponse } from 'next/server';
import { resolveMockOfTheDay, normalizeMotdExamSlug } from '@/features/mock-test/lib/mockOfTheDay';

/** Public: today's Mock of the Day for an exam (IST rotation). */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const examCategory = normalizeMotdExamSlug(
      searchParams.get('category') || searchParams.get('exam') || ''
    );
    if (!examCategory) {
      return NextResponse.json(
        { success: false, error: 'category is required' },
        { status: 400 }
      );
    }

    const motd = await resolveMockOfTheDay(examCategory);
    return NextResponse.json({ success: true, examCategory, mockOfTheDay: motd });
  } catch (err) {
    console.error('public motd GET', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load mock of the day' },
      { status: 500 }
    );
  }
}
