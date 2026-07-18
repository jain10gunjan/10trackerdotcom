import { NextResponse } from 'next/server';
import { fetchActiveExamCatalog } from '@/features/exams/lib/fetchActiveExamCatalog';

export async function GET() {
  try {
    const exams = await fetchActiveExamCatalog();
    return NextResponse.json(
      { success: true, exams, source: 'catalog' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('exams/active', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}
