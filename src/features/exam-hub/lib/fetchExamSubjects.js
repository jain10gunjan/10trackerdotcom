import { unstable_cache } from 'next/cache';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { categorySlugToDbKey } from '@/features/exam-hub/lib/categoryKey';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';

const SYLLABUS_SOFT_TIMEOUT_MS = 8_000;

function getSupabase() {
  try {
    if (isValidServiceRoleKey()) return getSupabaseServer(true);
  } catch {
    /* ignore */
  }
  return getSupabaseServer(false);
}

function rowsToSubjects(rows) {
  const subjectsWithTopics = (rows || []).reduce((acc, row) => {
    const subject = String(row.subject || '').trim();
    const topic = String(row.topic || '').trim();
    if (!subject || !topic) return acc;

    if (!acc[subject]) {
      acc[subject] = { subject, subtopics: [] };
    }

    const chapter = row.chapter ? String(row.chapter).trim() : null;
    const count = Number(row.question_count ?? row.count ?? 1) || 1;
    const topicIndex = acc[subject].subtopics.findIndex((t) => t.title === topic);

    if (topicIndex === -1) {
      acc[subject].subtopics.push({
        title: topic,
        count,
        category: row.category || null,
        chapter,
      });
    } else {
      acc[subject].subtopics[topicIndex].count += count;
      if (!acc[subject].subtopics[topicIndex].chapter && chapter) {
        acc[subject].subtopics[topicIndex].chapter = chapter;
      }
    }

    return acc;
  }, {});

  return Object.values(subjectsWithTopics);
}

function isMissingRpc(error) {
  const msg = String(error?.message || '');
  const code = String(error?.code || '');
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    /examtracker_subject_syllabus/i.test(msg) ||
    /could not find the function/i.test(msg) ||
    /schema cache/i.test(msg)
  );
}

function isStatementTimeout(error) {
  const code = String(error?.code || '');
  const msg = String(error?.message || '');
  return (
    code === '57014' ||
    code === 'TIMEOUT' ||
    /statement timeout/i.test(msg) ||
    /syllabus timeout/i.test(msg) ||
    /canceling statement/i.test(msg)
  );
}

function withSoftTimeout(promise, ms = SYLLABUS_SOFT_TIMEOUT_MS) {
  let timer;
  return Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(
          Object.assign(new Error('syllabus timeout'), {
            code: 'TIMEOUT',
          })
        );
      }, ms);
    }),
  ]);
}

/**
 * Preferred path: one grouped SQL RPC (see add_examtracker_subject_syllabus_rpc.sql).
 */
async function loadSyllabusViaRpc(dbCategory) {
  const supabase = getSupabase();
  const variants = getCategoryVariants(dbCategory) || [dbCategory];

  for (const variant of variants) {
    const { data, error } = await supabase.rpc('examtracker_subject_syllabus', {
      p_category: variant,
    });
    if (error) {
      if (isMissingRpc(error)) return { missing: true, subjects: null };
      if (isStatementTimeout(error)) return { missing: false, subjects: [] };
      throw error;
    }
    if (data?.length) {
      return { missing: false, subjects: rowsToSubjects(data) };
    }
  }

  return { missing: false, subjects: [] };
}

/**
 * Fallback: one capped page only — never unbounded scan (statement timeouts on large banks).
 * Prefer installing the RPC for production hubs.
 */
async function loadSyllabusViaCappedPage(dbCategory) {
  const supabase = getSupabase();
  const variants = getCategoryVariants(dbCategory) || [dbCategory];
  const pageSize = 1500;

  for (const variant of variants) {
    const { data, error } = await supabase
      .from('examtracker').or('verification_status.is.null,verification_status.not.in.(unpublished_draft,publish_rejected)')
      .select('subject, topic, category, chapter')
      .eq('category', variant)
      .range(0, pageSize - 1);

    if (error) {
      if (isStatementTimeout(error)) return [];
      throw error;
    }
    if (!data?.length) continue;

    const subjectsWithTopics = data.reduce((acc, row) => {
      if (!row.subject || !row.topic) return acc;
      if (!acc[row.subject]) {
        acc[row.subject] = { subject: row.subject, subtopics: [] };
      }
      const topicIndex = acc[row.subject].subtopics.findIndex((t) => t.title === row.topic);
      if (topicIndex === -1) {
        acc[row.subject].subtopics.push({
          title: row.topic,
          count: 1,
          category: row.category,
          chapter: row.chapter || null,
        });
      } else {
        acc[row.subject].subtopics[topicIndex].count += 1;
        if (!acc[row.subject].subtopics[topicIndex].chapter && row.chapter) {
          acc[row.subject].subtopics[topicIndex].chapter = row.chapter;
        }
      }
      return acc;
    }, {});

    return Object.values(subjectsWithTopics);
  }

  return [];
}

const getCachedExamSubjects = unstable_cache(
  async (dbCategory) => {
    try {
      const viaRpc = await withSoftTimeout(loadSyllabusViaRpc(dbCategory));
      if (!viaRpc.missing) return viaRpc.subjects || [];
      console.warn(
        '[exam-hub] examtracker_subject_syllabus RPC missing — using capped page. Run supabase/migrations/add_examtracker_subject_syllabus_rpc.sql'
      );
      return await withSoftTimeout(loadSyllabusViaCappedPage(dbCategory));
    } catch (err) {
      if (isStatementTimeout(err) || isMissingRpc(err)) {
        console.warn('fetchExamSubjects soft-fail', dbCategory, err?.message || err);
        return [];
      }
      throw err;
    }
  },
  ['exam-hub-subjects-with-chapter-v3-rpc-soft'],
  {
    tags: ['examtracker'],
    revalidate: 300,
  }
);

export async function fetchExamSubjects(categorySlug) {
  const dbCategory = categorySlugToDbKey(categorySlug);
  if (!dbCategory) return [];
  try {
    return await getCachedExamSubjects(dbCategory);
  } catch (err) {
    if (isStatementTimeout(err)) {
      console.warn('fetchExamSubjects timeout', categorySlug);
      return [];
    }
    console.error('fetchExamSubjects', categorySlug, err);
    return [];
  }
}
