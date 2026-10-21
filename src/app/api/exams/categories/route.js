import { NextResponse } from 'next/server';
import { fetchExamCatalog } from '@/features/exams/lib/fetchExamCatalog';

// Next.js only accepts a literal here. Same interval as EXAM_CATALOG_REVALIDATE_SECONDS.
export const revalidate = 120;

/**
 * Active exam catalog as "categories" for older clients.
 * Uses platform_exams + cached examtracker counts (no full-table scan).
 */
export async function GET() {
  try {
    const exams = await fetchExamCatalog({ activeOnly: true });

    const data = exams.map((exam) => ({
      slug: exam.slug,
      name: exam.name,
      count: exam.count || 0,
      icon: exam.icon || '📖',
      color: exam.color || 'from-neutral-500 to-neutral-600',
      category: exam.category,
      description: exam.description,
    }));

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('Error in exam categories API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch exam categories',
      },
      { status: 500 }
    );
  }
}
