import { fromVendorQuestionRow } from './vendorQuestionNormalize';

function optionValue(row, letter) {
  if (!row) return null;
  const upper = letter.toUpperCase();
  const lower = upper.toLowerCase();
  const v =
    row[`options_${upper}`] ??
    row[`options_${lower}`] ??
    row[`option_${upper}`] ??
    row[`option${upper}`];
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

export function questionHasOptions(row) {
  return ['A', 'B', 'C', 'D'].some((L) => !!optionValue(row, L));
}

/**
 * Questions imported before options_A→options_a remapping often landed with NULL options.
 * Refill from examtracker when source_question_id is set, persist, and return enriched rows.
 */
export async function backfillMissingOptionsFromPlatform(supabase, questions) {
  const list = (questions || []).map((q) => fromVendorQuestionRow(q));
  const needing = list.filter(
    (q) => !questionHasOptions(q) && q.source_question_id
  );
  if (!needing.length) return list;

  const sourceIds = [...new Set(needing.map((q) => String(q.source_question_id)))];
  const { data: sources, error } = await supabase
    .from('examtracker')
    .select('_id, options_A, options_B, options_C, options_D')
    .in('_id', sourceIds);

  if (error || !sources?.length) {
    if (error) console.error('backfillMissingOptionsFromPlatform', error);
    return list;
  }

  const bySource = Object.fromEntries(sources.map((s) => [String(s._id), s]));
  const updates = [];

  const enriched = list.map((q) => {
    if (questionHasOptions(q) || !q.source_question_id) return q;
    const src = bySource[String(q.source_question_id)];
    if (!src || !questionHasOptions(src)) return q;

    const options_A = optionValue(src, 'A');
    const options_B = optionValue(src, 'B');
    const options_C = optionValue(src, 'C');
    const options_D = optionValue(src, 'D');

    updates.push({
      _id: q._id,
      vendor_id: q.vendor_id,
      options_a: options_A,
      options_b: options_B,
      options_c: options_C,
      options_d: options_D,
      updated_at: new Date().toISOString(),
    });

    return fromVendorQuestionRow({
      ...q,
      options_a: options_A,
      options_b: options_B,
      options_c: options_C,
      options_d: options_D,
      options_A,
      options_B,
      options_C,
      options_D,
    });
  });

  // Persist in background-ish sequential updates (small banks)
  for (const u of updates) {
    const { vendor_id, _id, ...patch } = u;
    const { error: upErr } = await supabase
      .from('vendor_questions')
      .update(patch)
      .eq('_id', _id)
      .eq('vendor_id', vendor_id);
    if (upErr) console.error('option backfill update failed', _id, upErr);
  }

  return enriched;
}
