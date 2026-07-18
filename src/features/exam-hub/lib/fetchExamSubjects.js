import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { categorySlugToDbKey } from '@/features/exam-hub/lib/categoryKey';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function processExamtrackerRows(allData) {
  const subjectsWithTopics = allData.reduce((acc, row) => {
    if (!row.subject || !row.topic) return acc;

    if (!acc[row.subject]) {
      acc[row.subject] = { subject: row.subject, subtopics: [] };
    }

    const topicIndex = acc[row.subject].subtopics.findIndex((topic) => topic.title === row.topic);

    if (topicIndex === -1) {
      acc[row.subject].subtopics.push({
        title: row.topic,
        count: 1,
        category: row.category,
      });
    } else {
      acc[row.subject].subtopics[topicIndex].count += 1;
    }

    return acc;
  }, {});

  return Object.values(subjectsWithTopics);
}

const getCachedExamSubjects = unstable_cache(
  async (dbCategory) => {
    const supabase = getSupabase();
    const allData = [];
    let from = 0;
    const pageSize = 1000;
    let fetchMore = true;

    while (fetchMore) {
      const { data, error } = await supabase
        .from('examtracker')
        .select('subject, topic, category')
        .eq('category', dbCategory)
        .range(from, from + pageSize - 1);

      if (error) throw error;

      if (data?.length) {
        allData.push(...data);
        from += pageSize;
        fetchMore = data.length === pageSize;
      } else {
        fetchMore = false;
      }
    }

    return processExamtrackerRows(allData);
  },
  ['exam-hub-subjects'],
  {
    tags: ['examtracker'],
    revalidate: 120,
  }
);

export async function fetchExamSubjects(categorySlug) {
  const dbCategory = categorySlugToDbKey(categorySlug);
  if (!dbCategory) return [];
  try {
    return await getCachedExamSubjects(dbCategory);
  } catch (err) {
    console.error('fetchExamSubjects', categorySlug, err);
    return [];
  }
}
