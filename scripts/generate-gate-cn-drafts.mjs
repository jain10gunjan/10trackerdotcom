/**
 * Generate GATE CSE Computer Networks drafts into the LIVE examtracker DB
 * (via Supabase REST — same DB as the app). No OpenAI.
 *
 * From cattracker/:
 *   npm run generate:gate-cn-drafts:dry
 *   npm run generate:gate-cn-drafts
 *   node --env-file=.env.local scripts/generate-gate-cn-drafts.mjs --easy=5 --medium=5 --hard=5
 *
 * Review + publish at /admin/question-review
 */

import { createClient } from '@supabase/supabase-js';
import {
  buildGeneratedQuestions,
  toRestInsertRow,
} from '../src/lib/question-gen/generateExamQuestions.js';

function num(args, flag, fallback) {
  const hit = args.find((a) => a.startsWith(`${flag}=`));
  if (!hit) return fallback;
  const n = Number(hit.split('=')[1]);
  return Number.isFinite(n) ? n : fallback;
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const { rows, errors, config } = buildGeneratedQuestions({
  countsByDifficulty: {
    easy: num(args, '--easy', 5),
    medium: num(args, '--medium', 5),
    hard: num(args, '--hard', 5),
  },
});

console.log(
  JSON.stringify(
    {
      dryRun,
      generated: rows.length,
      errorCount: errors.length,
      errors: errors.slice(0, 10),
      config,
      sample: rows.slice(0, 2).map((r) => ({
        _id: r._id,
        chapter: r.chapter,
        difficulty: r.difficulty,
        verification_status: r.verification_status,
        correct_option: r.correct_option,
      })),
    },
    null,
    2
  )
);

if (errors.length) process.exit(1);
if (dryRun) process.exit(0);

const supabase = createClient(url, key);
const payload = rows.map(toRestInsertRow);
const chunkSize = 50;
let inserted = 0;

for (let i = 0; i < payload.length; i += chunkSize) {
  const chunk = payload.slice(i, i + chunkSize);
  const { data, error } = await supabase.from('examtracker').insert(chunk).select('_id');
  if (error) {
    console.error('Insert failed at', i, error.message);
    process.exit(1);
  }
  inserted += data?.length || chunk.length;
}

console.log(`Inserted ${inserted} draft questions. Review at /admin/question-review (status=Draft).`);
