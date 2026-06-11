import { fetchExamSubjects } from '@/lib/examHub/fetchExamSubjects';
import { normalizeCategorySlug } from '@/lib/examHub/categoryKey';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let categoryParam = searchParams.get('category');

    if (categoryParam) {
      categoryParam = decodeURIComponent(categoryParam);
    }

    if (!categoryParam) {
      return Response.json({ error: 'Category parameter is required' }, { status: 400 });
    }

    const slug = normalizeCategorySlug(categoryParam);
    const subjectsData = await fetchExamSubjects(slug);

    return Response.json(
      { subjectsData },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    return Response.json(
      {
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
