/**
 * When access is revoked, freeze in-progress attempts for that user in the vendor.
 * Does not auto-submit or score.
 */

export async function freezeInProgressAttempts(supabase, { vendorId, userEmail, reason = 'access_revoked' }) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('vendor_attempts')
    .update({
      status: 'frozen_access_revoked',
      updated_at: now,
      final_stats: { freeze_reason: reason, frozen_at: now },
    })
    .eq('vendor_id', vendorId)
    .eq('user_email', userEmail)
    .eq('status', 'in_progress')
    .select('id');

  return { frozenIds: (data || []).map((r) => r.id), error };
}
