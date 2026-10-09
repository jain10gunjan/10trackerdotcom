/**
 * Normalize enrollment / roll number for storage and uniqueness checks.
 */

export const DEFAULT_ENROLLMENT_RULES = {
  minLength: 1,
  maxLength: 64,
  digitsOnly: false,
  prefix: '',
  hint: '',
};

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function normalizeRollNo(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

export function enrollmentRulesFromSettings(settings) {
  const minLength = clampInt(settings?.enrollment_min_length, 1, 64, DEFAULT_ENROLLMENT_RULES.minLength);
  let maxLength = clampInt(settings?.enrollment_max_length, 1, 64, DEFAULT_ENROLLMENT_RULES.maxLength);
  if (maxLength < minLength) maxLength = minLength;
  return {
    minLength,
    maxLength,
    digitsOnly: Boolean(settings?.enrollment_digits_only),
    prefix: String(settings?.enrollment_prefix || '').trim().slice(0, 20),
    hint: String(settings?.enrollment_hint || '').trim().slice(0, 160),
  };
}

export function enrollmentHelpText(rules = DEFAULT_ENROLLMENT_RULES) {
  const bits = [];
  if (rules.hint) bits.push(rules.hint);
  bits.push(`${rules.minLength}–${rules.maxLength} characters`);
  if (rules.digitsOnly) bits.push('digits only');
  if (rules.prefix) bits.push(`must start with ${rules.prefix}`);
  bits.push('must be unique in this institute');
  return `${bits.join('. ')}.`;
}

/** Format check. Uniqueness is separate. */
export function validateRollNo(value, rules = DEFAULT_ENROLLMENT_RULES) {
  const rollNo = normalizeRollNo(value);
  if (!rollNo) {
    return { ok: false, error: 'Enrollment / roll number is required' };
  }
  if (rollNo.length < rules.minLength || rollNo.length > rules.maxLength) {
    return {
      ok: false,
      error: `Enrollment number must be ${rules.minLength}–${rules.maxLength} characters`,
    };
  }
  if (rules.digitsOnly && !/^\d+$/.test(rollNo)) {
    return { ok: false, error: 'Enrollment number must contain digits only' };
  }
  if (rules.prefix && !rollNo.toLowerCase().startsWith(rules.prefix.toLowerCase())) {
    return { ok: false, error: `Enrollment number must start with ${rules.prefix}` };
  }
  return { ok: true, rollNo };
}

/**
 * Validate admin-edited rule fields. `current` fills gaps when only some fields are sent.
 */
export function parseEnrollmentSettings(body, current = {}) {
  const out = {};
  const has = (key) => body[key] !== undefined;

  if (has('enrollment_min_length')) out.enrollment_min_length = body.enrollment_min_length;
  if (has('enrollment_max_length')) out.enrollment_max_length = body.enrollment_max_length;
  if (has('enrollment_digits_only')) out.enrollment_digits_only = !!body.enrollment_digits_only;
  if (has('enrollment_prefix')) {
    out.enrollment_prefix =
      body.enrollment_prefix == null || body.enrollment_prefix === ''
        ? null
        : String(body.enrollment_prefix).trim();
  }
  if (has('enrollment_hint')) {
    out.enrollment_hint =
      body.enrollment_hint == null || body.enrollment_hint === ''
        ? null
        : String(body.enrollment_hint).trim();
  }

  if (!Object.keys(out).length) return { data: out };

  const merged = enrollmentRulesFromSettings({ ...current, ...out });
  if (out.enrollment_prefix && out.enrollment_prefix.length > 20) {
    return { error: 'Enrollment prefix must be 20 characters or less' };
  }
  if (out.enrollment_hint && out.enrollment_hint.length > 160) {
    return { error: 'Enrollment hint must be 160 characters or less' };
  }
  if (
    has('enrollment_min_length') &&
    (!Number.isFinite(Number(body.enrollment_min_length)) ||
      Number(body.enrollment_min_length) < 1 ||
      Number(body.enrollment_min_length) > 64)
  ) {
    return { error: 'Minimum length must be 1–64' };
  }
  if (
    has('enrollment_max_length') &&
    (!Number.isFinite(Number(body.enrollment_max_length)) ||
      Number(body.enrollment_max_length) < 1 ||
      Number(body.enrollment_max_length) > 64)
  ) {
    return { error: 'Maximum length must be 1–64' };
  }
  if (merged.minLength > merged.maxLength) {
    return { error: 'Minimum length cannot be greater than maximum length' };
  }
  if (merged.prefix && merged.digitsOnly && !/^\d+$/.test(merged.prefix)) {
    return { error: 'Prefix must be digits when enrollment numbers are digits only' };
  }
  if (merged.prefix && merged.prefix.length > merged.maxLength) {
    return { error: 'Prefix is longer than the maximum enrollment length' };
  }

  if (has('enrollment_min_length')) out.enrollment_min_length = merged.minLength;
  if (has('enrollment_max_length')) out.enrollment_max_length = merged.maxLength;
  return { data: out };
}

export function hasRollNo(member) {
  return Boolean(normalizeRollNo(member?.roll_no));
}

/**
 * Ensure roll_no is free within vendor (excluding optional member id).
 */
export async function assertRollNoUnique(
  supabase,
  vendorId,
  rollNo,
  excludeMemberId = null,
  excludeEmail = null
) {
  const normalized = normalizeRollNo(rollNo);
  if (!normalized) {
    return { ok: false, error: 'Enrollment / roll number is required' };
  }

  let query = supabase
    .from('vendor_members')
    .select('id, user_email, roll_no')
    .eq('vendor_id', vendorId)
    .neq('roll_no', '')
    .not('roll_no', 'is', null);

  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };

  const key = normalized.toLowerCase();
  const skipEmail = excludeEmail ? String(excludeEmail).trim().toLowerCase() : '';
  const clash = (data || []).find((row) => {
    if (excludeMemberId && row.id === excludeMemberId) return false;
    if (skipEmail && String(row.user_email || '').trim().toLowerCase() === skipEmail) return false;
    return normalizeRollNo(row.roll_no)?.toLowerCase() === key;
  });

  if (clash) {
    return {
      ok: false,
      error: 'This enrollment / roll number is already used by another member',
    };
  }
  return { ok: true, rollNo: normalized };
}
