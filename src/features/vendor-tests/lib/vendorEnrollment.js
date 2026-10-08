/**
 * Normalize enrollment / roll number for storage and uniqueness checks.
 */
export function normalizeRollNo(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

export function hasRollNo(member) {
  return Boolean(normalizeRollNo(member?.roll_no));
}

/**
 * Ensure roll_no is free within vendor (excluding optional member id).
 */
export async function assertRollNoUnique(supabase, vendorId, rollNo, excludeMemberId = null) {
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
  const clash = (data || []).find((row) => {
    if (excludeMemberId && row.id === excludeMemberId) return false;
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
