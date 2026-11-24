import { randomUUID } from 'crypto';
import { normalizeRow } from '../examtrackerNormalize.js';
import { EXAMTRACKER_STATUS, PUBLISH_VERIFICATION } from '../examtrackerStatus.js';
import {
  generateChapterQuestions,
  stripVerify,
  verifyGeneratedQuestion,
} from './cnTemplates.js';
import { GATE_CSE_CN_CONFIG, mergeGenerationConfig } from './config.js';

/**
 * Build draft examtracker rows for a generation config (CN first; other exams later).
 * No OpenAI — deterministic templates + math verification (Cursor/agent managed).
 */
export function buildGeneratedQuestions(configInput = GATE_CSE_CN_CONFIG) {
  const cfg = mergeGenerationConfig(GATE_CSE_CN_CONFIG, configInput);
  const rows = [];
  const errors = [];

  for (const chapterCfg of cfg.chapters) {
    let generated;
    try {
      generated = generateChapterQuestions(cfg, chapterCfg);
    } catch (err) {
      errors.push({ chapter: chapterCfg.chapter, error: err.message });
      continue;
    }

    for (const raw of generated) {
      const check = verifyGeneratedQuestion(raw);
      if (!check.ok) {
        errors.push({
          chapter: chapterCfg.chapter,
          difficulty: raw.difficulty,
          error: check.error,
        });
        continue;
      }

      const clean = stripVerify(raw);
      const n = normalizeRow(
        {
          ...clean,
          _id: randomUUID(),
          status: cfg.status || EXAMTRACKER_STATUS.DRAFT,
          verification_status: PUBLISH_VERIFICATION.DRAFT,
        },
        {
          category: cfg.category,
          subject: cfg.subject,
          status: cfg.status || EXAMTRACKER_STATUS.DRAFT,
        },
        { defaultStatus: EXAMTRACKER_STATUS.DRAFT }
      );

      if (!n.ok) {
        errors.push({ chapter: chapterCfg.chapter, error: n.error });
        continue;
      }
      rows.push(n.row);
    }
  }

  return { rows, errors, config: cfg };
}

/** Strip columns PostgREST schema cache may not expose yet. */
export function toRestInsertRow(row) {
  const {
    status: _status,
    published_at: _publishedAt,
    published_by: _publishedBy,
    ...rest
  } = row;
  return {
    ...rest,
    verification_status: PUBLISH_VERIFICATION.DRAFT,
  };
}

/**
 * Insert generated draft rows via Supabase REST (same DB the app uses).
 */
export async function insertGeneratedDrafts(supabase, configInput = GATE_CSE_CN_CONFIG) {
  const { rows, errors, config } = buildGeneratedQuestions(configInput);
  if (!rows.length) {
    return {
      success: false,
      inserted: 0,
      errors,
      message: 'No valid rows generated',
      config,
    };
  }

  const payload = rows.map(toRestInsertRow);
  const chunkSize = 50;
  let inserted = 0;
  const dbErrors = [];

  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { data, error } = await supabase.from('examtracker').insert(chunk).select('_id');
    if (error) {
      dbErrors.push({ offset: i, error: error.message });
      break;
    }
    inserted += data?.length || chunk.length;
  }

  return {
    success: dbErrors.length === 0,
    inserted,
    generated: rows.length,
    errors: [...errors, ...dbErrors],
    config,
    sampleIds: rows.slice(0, 5).map((r) => r._id),
  };
}
