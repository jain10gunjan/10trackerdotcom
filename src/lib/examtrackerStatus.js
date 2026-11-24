/** Draft / publish lifecycle for examtracker rows. */

export const EXAMTRACKER_STATUSES = ['draft', 'published', 'rejected'];

export const EXAMTRACKER_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
};

/**
 * PostgREST schema cache on db.10tracker.com can lag behind new DB columns.
 * `status` exists in Postgres but may not be exposed via /rest yet.
 * Mirror draft/reject into `verification_status` (already exposed) so practice
 * and admin filters work immediately.
 */
export const PUBLISH_VERIFICATION = {
  DRAFT: 'unpublished_draft',
  REJECTED: 'publish_rejected',
};

export function normalizeExamtrackerStatus(value, fallback = EXAMTRACKER_STATUS.DRAFT) {
  const s = String(value ?? '')
    .trim()
    .toLowerCase();
  if (EXAMTRACKER_STATUSES.includes(s)) return s;
  return fallback;
}

export function verificationForStatus(status) {
  const s = normalizeExamtrackerStatus(status, '');
  if (s === EXAMTRACKER_STATUS.DRAFT) return PUBLISH_VERIFICATION.DRAFT;
  if (s === EXAMTRACKER_STATUS.REJECTED) return PUBLISH_VERIFICATION.REJECTED;
  return null; // published → clear unpublished sentinel
}

export function statusFromVerification(verificationStatus, statusCol) {
  if (statusCol && EXAMTRACKER_STATUSES.includes(String(statusCol).toLowerCase())) {
    return String(statusCol).toLowerCase();
  }
  const v = String(verificationStatus ?? '');
  if (v === PUBLISH_VERIFICATION.DRAFT) return EXAMTRACKER_STATUS.DRAFT;
  if (v === PUBLISH_VERIFICATION.REJECTED) return EXAMTRACKER_STATUS.REJECTED;
  return EXAMTRACKER_STATUS.PUBLISHED;
}

/**
 * Public practice / mocks / catalog — never surface drafts or rejected.
 * Uses verification_status sentinel (PostgREST-safe).
 */
export function applyPublishedOnly(query) {
  return query.or(
    `verification_status.is.null,verification_status.not.in.(${PUBLISH_VERIFICATION.DRAFT},${PUBLISH_VERIFICATION.REJECTED})`
  );
}

/** Admin list filter when `status` column is not in PostgREST cache. */
export function applyPublishLifecycleFilter(query, status) {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  if (!s || s === 'all') return query;
  if (s === EXAMTRACKER_STATUS.DRAFT) {
    return query.eq('verification_status', PUBLISH_VERIFICATION.DRAFT);
  }
  if (s === EXAMTRACKER_STATUS.REJECTED) {
    return query.eq('verification_status', PUBLISH_VERIFICATION.REJECTED);
  }
  if (s === EXAMTRACKER_STATUS.PUBLISHED) {
    return applyPublishedOnly(query);
  }
  return query;
}

export function isPublishedStatus(value) {
  return normalizeExamtrackerStatus(value, '') === EXAMTRACKER_STATUS.PUBLISHED;
}
