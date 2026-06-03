/**
 * Supabase user_profiles — detects email vs user_email, update-then-insert writes.
 */

import { normalizeEmail } from '@/lib/normalizeEmail';
import { parseTargetExams } from '@/lib/examProfile';

export const PROFILE_SETUP_SQL_HINT =
  'Run scripts/ensure_user_profiles.sql in Supabase → SQL Editor, then restart the app.';

const EMAIL_COLUMN_CANDIDATES = ['user_email', 'email'];

const PROFILE_FIELDS = [
  'display_name',
  'first_name',
  'last_name',
  'country',
  'phone_number',
  'city',
  'state',
  'bio',
  'target_exam',
  'target_exams',
  'avatar_url',
  'profile_completed',
  'updated_at',
];

let cachedSchema = null;

export function resetProfileDbSchemaCache() {
  cachedSchema = null;
}

function extractMissingColumn(message = '') {
  const match = /Could not find the '([^']+)' column/i.exec(message);
  return match?.[1] || null;
}

function isMissingColumnError(error) {
  return error?.code === '42703' || error?.code === 'PGRST204';
}

function isTableMissingError(error) {
  if (!error) return false;
  if (error.code === '42P01') return true;
  return /relation.*user_profiles.*does not exist/i.test(error.message || '');
}

function isRlsRecursionError(error) {
  if (!error) return false;
  if (error.code === '42P17') return true;
  return /infinite recursion detected in policy/i.test(error.message || '');
}

function isForeignKeyError(error) {
  if (!error || error.code !== '23503') return false;
  return /foreign key constraint/i.test(error.message || '');
}

function schemaNotReadyError(detail) {
  return {
    code: 'PROFILE_DB_NOT_READY',
    message: detail || `Profile storage is not set up. ${PROFILE_SETUP_SQL_HINT}`,
  };
}

/** Probe table + email columns (does not treat RLS errors as "column missing"). */
async function probeUserProfilesSchema(supabase) {
  const { error: tableError } = await supabase.from('user_profiles').select('*').limit(1);

  if (isRlsRecursionError(tableError)) {
    return {
      tableReady: false,
      tableMissing: false,
      rlsBroken: true,
      emailColumn: 'user_email',
      emailColumns: [],
      setupError: schemaNotReadyError(
        `Profile table RLS policies are misconfigured (infinite recursion). ${PROFILE_SETUP_SQL_HINT}`
      ),
    };
  }

  if (isTableMissingError(tableError)) {
    return {
      tableReady: false,
      tableMissing: true,
      emailColumn: 'user_email',
      emailColumns: [],
      setupError: schemaNotReadyError(),
    };
  }

  const emailColumns = [];
  for (const col of EMAIL_COLUMN_CANDIDATES) {
    const { error } = await supabase.from('user_profiles').select(col).limit(1);
    if (!error || error.code === 'PGRST116') {
      emailColumns.push(col);
      continue;
    }
    if (isMissingColumnError(error)) continue;
    if (!isTableMissingError(error)) {
      emailColumns.push(col);
    }
  }

  const unique = [...new Set(emailColumns.length ? emailColumns : EMAIL_COLUMN_CANDIDATES)];

  return {
    tableReady: true,
    tableMissing: false,
    emailColumn: unique[0],
    emailColumns: unique,
  };
}

export async function getProfileDbSchema(supabase, { force = false } = {}) {
  if (cachedSchema && !force) return cachedSchema;
  cachedSchema = await probeUserProfilesSchema(supabase);
  return cachedSchema;
}

export function normalizeProfileRow(row, emailColumn) {
  if (!row) return null;
  const resolvedEmail =
    row.user_email || row.email || (emailColumn ? row[emailColumn] : null);

  let target_exams = parseTargetExams(row.target_exams);
  let target_exam = row.target_exam != null ? String(row.target_exam).trim().toLowerCase() : '';
  if (!target_exams.length && target_exam) {
    target_exams = parseTargetExams([target_exam]);
  }
  if (!target_exam && target_exams.length) {
    target_exam = target_exams[0];
  }

  return {
    ...row,
    user_email: resolvedEmail,
    email: row.email || resolvedEmail,
    first_name: row.first_name ?? '',
    last_name: row.last_name ?? '',
    country: row.country ?? '',
    phone_number: row.phone_number ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    bio: row.bio ?? '',
    target_exam,
    target_exams,
    avatar_url: row.avatar_url ?? '',
    display_name: row.display_name ?? '',
    profile_completed: Boolean(row.profile_completed),
  };
}

/** Read full row — avoids failures when optional columns differ per project schema. */
async function fetchProfileRow(supabase, emailColumn, userEmail) {
  const email = normalizeEmail(userEmail);

  const tryFetch = async (column, value) => {
    return supabase.from('user_profiles').select('*').eq(column, value).maybeSingle();
  };

  let { data, error } = await tryFetch(emailColumn, email);
  if (!error && data) return { data, error: null, emailColumn };

  ({ data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .ilike(emailColumn, email)
    .maybeSingle());

  if (!error && data) return { data, error: null, emailColumn };

  for (const altCol of EMAIL_COLUMN_CANDIDATES) {
    if (altCol === emailColumn) continue;
    ({ data, error } = await tryFetch(altCol, email));
    if (!error && data) return { data, error: null, emailColumn: altCol };
  }

  if (userEmail !== email) {
    ({ data, error } = await tryFetch(emailColumn, userEmail));
    if (!error && data) return { data, error: null, emailColumn };
  }

  return { data, error, emailColumn };
}

export async function selectProfile(supabase, userEmail) {
  let schema = await getProfileDbSchema(supabase);

  if (schema.setupError) {
    return { profile: null, emailColumn: schema.emailColumn, error: schema.setupError };
  }

  if (!schema.tableReady || schema.tableMissing) {
    return { profile: null, emailColumn: schema.emailColumn, error: null };
  }

  let lastError = null;

  for (const emailColumn of schema.emailColumns) {
    const { data, error } = await fetchProfileRow(supabase, emailColumn, userEmail);

    if (!error && data) {
      return {
        profile: normalizeProfileRow(data, emailColumn),
        emailColumn,
        error: null,
      };
    }

    if (isMissingColumnError(error)) {
      resetProfileDbSchemaCache();
      schema = await getProfileDbSchema(supabase, { force: true });
      continue;
    }

    lastError = error;
    break;
  }

  if (lastError?.code === 'PGRST116') {
    return { profile: null, emailColumn: schema.emailColumn, error: null };
  }

  if (isRlsRecursionError(lastError)) {
    return {
      profile: null,
      emailColumn: schema.emailColumn,
      error: schemaNotReadyError(
        `Profile table RLS policies are misconfigured (infinite recursion). ${PROFILE_SETUP_SQL_HINT}`
      ),
    };
  }

  return { profile: null, emailColumn: schema.emailColumn, error: lastError };
}

function stripRowForWrite(row, emailColumn) {
  const cleaned = { ...row };
  delete cleaned.user_email;
  delete cleaned.email;
  delete cleaned.id;
  return cleaned;
}

async function tryUpdate(supabase, emailColumn, userEmail, cleaned, existingProfile) {
  const email = normalizeEmail(userEmail);

  if (existingProfile?.id) {
    const byId = await supabase
      .from('user_profiles')
      .update(cleaned)
      .eq('id', existingProfile.id)
      .select()
      .maybeSingle();
    if (!byId.error && byId.data) return byId;
  }

  let result = await supabase
    .from('user_profiles')
    .update(cleaned)
    .eq(emailColumn, email)
    .select()
    .maybeSingle();

  if (!result.error && result.data) return result;

  return supabase
    .from('user_profiles')
    .update(cleaned)
    .ilike(emailColumn, email)
    .select()
    .maybeSingle();
}

async function tryInsert(supabase, emailColumn, userEmail, cleaned) {
  const timestamp = new Date().toISOString();
  const email = normalizeEmail(userEmail);
  const insertRow = {
    ...cleaned,
    [emailColumn]: email,
    updated_at: cleaned.updated_at || timestamp,
    created_at: cleaned.created_at || timestamp,
  };
  // Do not set id — legacy id may FK to auth.users; app uses NextAuth + user_email
  return supabase.from('user_profiles').insert(insertRow).select().single();
}

async function saveWithEmailColumn(supabase, emailColumn, userEmail, fields, schema, existingProfile) {
  const row = { updated_at: new Date().toISOString(), ...fields };
  let cleaned = stripRowForWrite(row, emailColumn);
  let lastError = null;

  for (let attempt = 0; attempt < 12; attempt++) {
    const updateResult = await tryUpdate(
      supabase,
      emailColumn,
      userEmail,
      cleaned,
      existingProfile
    );

    if (!updateResult.error && updateResult.data) {
      return {
        data: normalizeProfileRow(updateResult.data, emailColumn),
        error: null,
        emailColumn,
      };
    }

    if (updateResult.error && !isMissingColumnError(updateResult.error)) {
      const isNoRow =
        !updateResult.data &&
        (updateResult.error.code === 'PGRST116' ||
          updateResult.error.details?.includes('0 rows') ||
          updateResult.error.message?.includes('0 rows'));
      if (!isNoRow && updateResult.error.code !== 'PGRST116') {
        lastError = updateResult.error;
        if (updateResult.error.code !== '406') {
          break;
        }
      }
    }

    if (updateResult.error && isMissingColumnError(updateResult.error)) {
      const missing = extractMissingColumn(updateResult.error.message);
      if (missing && Object.prototype.hasOwnProperty.call(cleaned, missing)) {
        delete cleaned[missing];
        continue;
      }
    }

    const insertResult = await tryInsert(supabase, emailColumn, userEmail, cleaned);

    if (!insertResult.error && insertResult.data) {
      return {
        data: normalizeProfileRow(insertResult.data, emailColumn),
        error: null,
        emailColumn,
      };
    }

    lastError = insertResult.error || updateResult.error;

    if (lastError && isForeignKeyError(lastError)) {
      return {
        data: null,
        error: {
          code: '23503',
          message:
            'Profile id is linked to Supabase auth.users but you sign in with Google (NextAuth). ' +
            'Run scripts/fix_user_profiles_schema.sql in Supabase SQL Editor (drops user_profiles_id_fkey).',
        },
        emailColumn,
      };
    }

    if (lastError?.code === '23505') {
      const retryUpdate = await tryUpdate(supabase, emailColumn, userEmail, cleaned);
      if (!retryUpdate.error && retryUpdate.data) {
        return {
          data: normalizeProfileRow(retryUpdate.data, emailColumn),
          error: null,
          emailColumn,
        };
      }
      lastError = retryUpdate.error || lastError;
    }

    if (lastError && isMissingColumnError(lastError)) {
      const missing = extractMissingColumn(lastError.message);
      if (missing && Object.prototype.hasOwnProperty.call(cleaned, missing)) {
        delete cleaned[missing];
        continue;
      }
    }

    break;
  }

  return { data: null, error: lastError, emailColumn };
}

export async function upsertProfile(supabase, userEmail, fields) {
  const schema = await getProfileDbSchema(supabase);

  if (schema.setupError) {
    return { data: null, error: schema.setupError, emailColumn: 'user_email' };
  }

  if (schema.tableMissing || !schema.tableReady) {
    return { data: null, error: schemaNotReadyError(), emailColumn: 'user_email' };
  }

  const normalizedEmail = normalizeEmail(userEmail);
  const { profile: existingProfile } = await selectProfile(supabase, normalizedEmail);

  let lastError = null;

  for (const emailColumn of schema.emailColumns) {
    const result = await saveWithEmailColumn(
      supabase,
      emailColumn,
      normalizedEmail,
      fields,
      schema,
      existingProfile
    );
    if (result.data) {
      const refetch = await selectProfile(supabase, normalizedEmail);
      return {
        data: refetch.profile || result.data,
        error: null,
        emailColumn: result.emailColumn,
      };
    }
    lastError = result.error;
    if (lastError && isRlsRecursionError(lastError)) {
      return {
        data: null,
        error: schemaNotReadyError(
          `Profile table RLS policies are misconfigured (infinite recursion). ${PROFILE_SETUP_SQL_HINT}`
        ),
        emailColumn,
      };
    }
    if (lastError && !isMissingColumnError(lastError)) {
      if (lastError.code === 'PROFILE_DB_NOT_READY') {
        return { data: null, error: lastError, emailColumn };
      }
      return { data: null, error: lastError, emailColumn };
    }
  }

  resetProfileDbSchemaCache();
  const retrySchema = await getProfileDbSchema(supabase, { force: true });
  if (retrySchema.setupError) {
    return { data: null, error: retrySchema.setupError, emailColumn: 'user_email' };
  }
  if (retrySchema.tableMissing) {
    return { data: null, error: schemaNotReadyError(), emailColumn: 'user_email' };
  }

  const { profile: existingOnRetry } = await selectProfile(supabase, normalizedEmail);

  for (const emailColumn of retrySchema.emailColumns) {
    const result = await saveWithEmailColumn(
      supabase,
      emailColumn,
      normalizedEmail,
      fields,
      retrySchema,
      existingOnRetry
    );
    if (result.data) {
      const refetch = await selectProfile(supabase, normalizedEmail);
      return {
        data: refetch.profile || result.data,
        error: null,
        emailColumn: result.emailColumn,
      };
    }
    lastError = result.error;
  }

  return {
    data: null,
    error: lastError || schemaNotReadyError(),
    emailColumn: retrySchema.emailColumn,
  };
}
