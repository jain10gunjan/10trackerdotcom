import { NextResponse } from 'next/server';
import { fetchExamCatalog } from '@/features/exams/lib/fetchExamCatalog';

export async function GET() {
  try {
    const exams = await fetchExamCatalog({ activeOnly: true });
    return NextResponse.json(
      { success: true, exams, source: 'catalog' },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } }
    );
  } catch (err) {
    console.error('exams/active', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}
