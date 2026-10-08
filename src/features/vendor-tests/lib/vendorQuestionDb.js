import { toIntOrNull } from '@/features/vendor-tests/lib/vendorQuestionNormalize';

/**
 * Insert/update vendor_questions with column stripping / rename when schema drifts.
 * Postgres folds unquoted mixed-case columns; remap before stripping so we don't lose data.
 */

const FOLDED_COLUMN_ALIASES = {
  options_A: 'options_a',
  options_B: 'options_b',
  options_C: 'options_c',
  options_D: 'options_d',
  directionHTML: 'directionhtml',
  questionImage: 'questionimage',
  questionCode: 'questioncode',
  topicList: 'topiclist',
};

function sanitizeRow(row) {
  const next = { ...row };
  if ('year' in next) next.year = toIntOrNull(next.year);
  if ('order_index' in next) next.order_index = toIntOrNull(next.order_index);
  for (const [from, to] of Object.entries(FOLDED_COLUMN_ALIASES)) {
    if (Object.prototype.hasOwnProperty.call(next, from)) {
      if (next[to] == null) next[to] = next[from];
      delete next[from];
    }
  }
  return next;
}

export async function insertVendorQuestions(supabase, rows) {
  if (!rows?.length) return { data: [], error: null };

  let payload = rows.map((r) => sanitizeRow(r));
  let lastError = null;
  let data = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const result = await supabase.from('vendor_questions').insert(payload).select('_id, source_question_id, topic');
    if (!result.error) {
      return { data: result.data || [], error: null };
    }
    lastError = result.error;
    const msg = lastError.message || '';
    const isMissingCol =
      lastError.code === 'PGRST204' ||
      /column .* does not exist/i.test(msg) ||
      /Could not find the '[^']+' column/i.test(msg);
    if (!isMissingCol) break;

    const match =
      /Could not find the '([^']+)' column/i.exec(msg) ||
      /column (?:[\w.]+\.)?["']?(\w+)["']? does not exist/i.exec(msg);
    const missing = match?.[1];
    if (!missing) break;

    const folded = FOLDED_COLUMN_ALIASES[missing];
    let changed = false;
    payload = payload.map((row) => {
      if (!Object.prototype.hasOwnProperty.call(row, missing)) return row;
      changed = true;
      const next = { ...row };
      if (folded && next[folded] == null) next[folded] = next[missing];
      delete next[missing];
      return next;
    });
    if (!changed) break;
  }

  return { data, error: lastError };
}

export async function upsertVendorQuestion(supabase, row) {
  const { data, error } = await insertVendorQuestions(supabase, [row]);
  if (error) return { data: null, error };
  return { data: data?.[0] || null, error: null };
}
