// import { createClient } from '@supabase/supabase-js';
// import { NextResponse } from 'next/server';

// // Supabase client with connection pooling
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//   {
//     db: { schema: 'public' },
//     global: { headers: { 'x-application-name': 'cattracker-chapter-questions' } }
//   }
// );

// // Simple in-memory cache (cleared on server restart)
// const cache = new Map();
// const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// // Helper function to normalize chapter names for comparison
// const normalizeChapterName = (name) => {
//   if (!name) return '';
//   return name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/-/g, ' ');
// };

// // Helper function to check if two chapter names match
// const chapterNamesMatch = (name1, name2) => {
//   const norm1 = normalizeChapterName(name1);
//   const norm2 = normalizeChapterName(name2);
//   return norm1 === norm2;
// };

// // Function to fetch questions
// const fetchQuestions = async (category, chapter, difficulty, page, limit) => {
//   const offset = (page - 1) * limit;

//   const categoryUpper = category.toUpperCase();
//   const normalizedInput = normalizeChapterName(chapter);

//   // Try a few common chapter variants (spaces vs hyphens, trimmed)
//   const candidates = Array.from(
//     new Set(
//       [
//         chapter,
//         String(chapter).trim(),
//         String(chapter).replace(/-/g, ' '),
//         normalizeChapterName(chapter), // normalized spaces
//         normalizeChapterName(chapter).replace(/\s+/g, '-'), // normalized hyphens
//       ].filter(Boolean)
//     )
//   );

//   const buildQuery = (chapterValue) => {
//     let q = supabase
//       .from('examtracker')
//       .select(
//         '_id, question, options_A, options_B, options_C, options_D, correct_option, solution, solutiontext, difficulty, year, subject, chapter, topic',
//         { count: 'exact' }
//       )
//       .eq('category', categoryUpper)
//       .eq('chapter', chapterValue);

//     if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
//       q = q.eq('difficulty', difficulty);
//     }

//     return q.order('_id', { ascending: true }).range(offset, offset + limit - 1);
//   };

//   // First, try fast exact matches.
//   let data = null;
//   let count = null;
//   let lastError = null;
//   let matchedChapter = candidates[0] ?? chapter;

//   for (const candidate of candidates) {
//     const res = await buildQuery(candidate);
//     if (res.error) {
//       lastError = res.error;
//       continue;
//     }
//     // If it returns rows, we found the correct chapter string.
//     if ((res.data?.length ?? 0) > 0 || (res.count ?? 0) > 0) {
//       data = res.data ?? [];
//       count = res.count ?? 0;
//       matchedChapter = candidate;
//       break;
//     }
//   }

//   if (data == null) {
//     // As a last fallback, keep behavior correct by doing a small scan
//     // limited to chapter-only fields, then re-query by exact chapter string.
//     // This avoids fetching full question payloads in large batches.
//     const { data: chaptersData, error: chaptersError } = await supabase
//       .from('examtracker')
//       .select('chapter')
//       .eq('category', categoryUpper)
//       .limit(5000);

//     if (chaptersError) throw chaptersError;

//     const chapterSet = new Set(
//       (chaptersData ?? [])
//         .map((r) => r?.chapter)
//         .filter(Boolean)
//         .filter((ch) => chapterNamesMatch(ch, normalizedInput))
//     );

//     const resolved = Array.from(chapterSet)[0];
//     if (!resolved) {
//       return {
//         questions: [],
//         hasMore: false,
//         totalCount: 0,
//         currentPage: page,
//         totalPages: 0,
//         matchedChapter: null,
//       };
//     }

//     const res = await buildQuery(resolved);
//     if (res.error) throw res.error;
//     data = res.data ?? [];
//     count = res.count ?? 0;
//     matchedChapter = resolved;
//   }

//   const questions = data ?? [];
//   const hasMorePages = (offset + (questions?.length ?? 0)) < (count ?? 0);

//   return {
//     questions: questions || [],
//     hasMore: hasMorePages,
//     totalCount: count,
//     currentPage: page,
//     totalPages: Math.ceil((count || 0) / limit),
//     matchedChapter,
//   };
// };

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const category = searchParams.get('category');
//     const chapter = searchParams.get('chapter');
//     const difficulty = searchParams.get('difficulty');
//     const page = parseInt(searchParams.get('page') || '1');
//     const limit = parseInt(searchParams.get('limit') || '10');

//     if (!category || !chapter) {
//       return NextResponse.json(
//         { error: 'Missing required parameters: category and chapter' },
//         { status: 400 }
//       );
//     }

//     // Check cache first
//     const cacheKey = `chapter-${category}-${chapter}-${difficulty || 'all'}-${page}-${limit}`;
//     const cached = cache.get(cacheKey);
    
//     if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
//       return NextResponse.json(
//         cached.data,
//         {
//           status: 200,
//           headers: {
//             'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
//             'Content-Type': 'application/json',
//           },
//         }
//       );
//     }

//     // Fetch fresh data
//     const result = await fetchQuestions(category, chapter, difficulty || 'all', page, limit);
    
//     // Store in cache
//     cache.set(cacheKey, {
//       data: result,
//       timestamp: Date.now()
//     });

//     return NextResponse.json(
//       result,
//       {
//         status: 200,
//         headers: {
//           'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
//           'Content-Type': 'application/json',
//         },
//       }
//     );
//   } catch (error) {
//     console.error('Chapter questions API error:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch questions', details: error.message },
//       { status: 500 }
//     );
//   }
// }

// // OPTIONS method for CORS preflight
// export async function OPTIONS() {
//   return new NextResponse(null, {
//     status: 200,
//     headers: {
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Methods': 'GET, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     },
//   });
// }

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
  'Content-Type': 'application/json',
};

const normalizeChapterName = (name) =>
  name ? name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/-/g, ' ') : '';

const getChapterCandidates = (chapter) =>
  Array.from(
    new Set(
      [
        chapter,
        chapter.trim(),
        chapter.replace(/-/g, ' '),
        normalizeChapterName(chapter),
        normalizeChapterName(chapter).replace(/\s+/g, '-'),
      ].filter(Boolean)
    )
  );

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category  = searchParams.get('category');
    const chapter   = searchParams.get('chapter');
    const difficulty = searchParams.get('difficulty');
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    if (!category || !chapter) {
      return NextResponse.json(
        { error: 'Missing required parameters: category and chapter' },
        { status: 400 }
      );
    }

    const offset     = (page - 1) * limit;
    const candidates = getChapterCandidates(chapter);

    let query = supabase
      .from('examtracker')
      .select(
        '_id, question, options_A, options_B, options_C, options_D, correct_option, solution, solutiontext, difficulty, year, subject, chapter, topic',
        { count: 'exact' }
      )
      .eq('category', category.toUpperCase())
      .in('chapter', candidates)
      .order('_id', { ascending: true })
      .range(offset, offset + limit - 1);

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const questions = data ?? [];
    const result = {
      questions,
      hasMore:     offset + questions.length < (count ?? 0),
      totalCount:  count ?? 0,
      currentPage: page,
      totalPages:  Math.ceil((count ?? 0) / limit),
    };

    return NextResponse.json(result, { status: 200, headers: CACHE_HEADERS });

  } catch (error) {
    console.error('Chapter questions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions', details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}