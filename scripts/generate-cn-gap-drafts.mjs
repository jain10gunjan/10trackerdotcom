/**
 * Insert CN gap-fill drafts (100–150) for thin/missing topics.
 * Does NOT delete or modify published questions.
 *
 * node --env-file=.env.local scripts/generate-cn-gap-drafts.mjs
 */
import { createClient } from '@supabase/supabase-js';
import {
  buildGeneratedQuestions,
  toRestInsertRow,
} from '../src/lib/question-gen/generateExamQuestions.js';
import { GATE_CSE_CN_GAP_CONFIG } from '../src/lib/question-gen/config.js';
import { GENERATED_YEAR_LABEL } from '../src/lib/question-gen/cnTemplates.js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase env');
  process.exit(1);
}

const supabase = createClient(url, key);

const { rows, errors, config } = buildGeneratedQuestions(GATE_CSE_CN_GAP_CONFIG);
if (errors.length) {
  console.error('generation errors', errors);
  process.exit(1);
}

const payload = rows.map(toRestInsertRow);
console.log('generated', payload.length, 'drafts; year=', GENERATED_YEAR_LABEL);

let inserted = 0;
for (let i = 0; i < payload.length; i += 50) {
  const chunk = payload.slice(i, i + 50);
  const { data, error } = await supabase.from('examtracker').insert(chunk).select('_id');
  if (error) {
    console.error('insert failed at', i, error.message);
    process.exit(1);
  }
  inserted += data?.length || chunk.length;
}

const byTopic = {};
for (const r of rows) {
  byTopic[r.topic] = (byTopic[r.topic] || 0) + 1;
}

const { count: draftCount } = await supabase
  .from('examtracker')
  .select('_id', { count: 'exact', head: true })
  .eq('subject', 'computer-networks')
  .eq('verification_status', 'unpublished_draft');

const { data: sample } = await supabase
  .from('examtracker')
  .select('year,topic,chapter,solution,solutiontext,correct_option,difficulty')
  .eq('verification_status', 'unpublished_draft')
  .eq('subject', 'computer-networks')
  .eq('year', GENERATED_YEAR_LABEL)
  .order('_id')
  .limit(3);

console.log(
  JSON.stringify(
    {
      inserted,
      draftsNow: draftCount,
      byTopic,
      chapters: config.chapters.map((c) => c.topic),
      sample: (sample || []).map((r) => ({
        topic: r.topic,
        chapter: r.chapter,
        difficulty: r.difficulty,
        year: r.year,
        solutionEmpty: !String(r.solution || '').trim(),
        answer: r.correct_option,
        solutionPreview: String(r.solutiontext || '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 120),
      })),
    },
    null,
    2
  )
);
