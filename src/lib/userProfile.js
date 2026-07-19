/** Shared user profile validation and completion checks */

import { isValidExamSlug, normalizeTargetExamsPayload, parseTargetExams } from '@/lib/examProfile';
import { TERMS_VERSION } from '@/features/billing/lib/legal';

export const PROFILE_REQUIRED_FIELDS = ['first_name', 'last_name', 'country', 'phone_number'];

export function parseSessionName(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return { first_name: '', last_name: '' };
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

export function buildDisplayName(firstName, lastName) {
  return [firstName, lastName].map((s) => String(s || '').trim()).filter(Boolean).join(' ');
}

/** Required profile fields + exams filled (ignores terms) */
export function isProfileFieldsComplete(profile) {
  if (!profile) return false;
  for (const field of PROFILE_REQUIRED_FIELDS) {
    const val = profile[field];
    if (val == null || String(val).trim() === '') return false;
  }
  const display = profile.display_name || buildDisplayName(profile.first_name, profile.last_name);
  if (!display || display.length < 2) return false;

  const exams = parseTargetExams(profile.target_exams);
  const primary = String(profile.target_exam || '').trim().toLowerCase();
  if (exams.length === 0) return false;
  if (!primary || !isValidExamSlug(primary) || !exams.includes(primary)) return false;

  return true;
}

/** User accepted the current TERMS_VERSION */
export function hasCurrentTermsAcceptance(profile) {
  if (!profile?.terms_accepted_at) return false;
  return String(profile.terms_version || '') === TERMS_VERSION;
}

/** @deprecated use hasCurrentTermsAcceptance */
export function hasTermsAcceptance(profile) {
  return hasCurrentTermsAcceptance(profile);
}

export function needsTermsReacceptance(profile) {
  return isProfileFieldsComplete(profile) && !hasCurrentTermsAcceptance(profile);
}

export function isProfileComplete(profile) {
  return isProfileFieldsComplete(profile) && hasCurrentTermsAcceptance(profile);
}

export function getProfileGateStatus(profile) {
  const needsProfileCompletion = !isProfileFieldsComplete(profile);
  const needsTermsReaccept = needsTermsReacceptance(profile);
  return {
    needsProfile: needsProfileCompletion || needsTermsReaccept,
    needsProfileCompletion,
    needsTermsReacceptance: needsTermsReaccept,
    termsVersion: profile?.terms_version ?? null,
    currentTermsVersion: TERMS_VERSION,
  };
}

export function validatePhoneNumber(phone) {
  const raw = String(phone || '').trim();
  if (!raw) return 'Phone number is required';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    return 'Enter a valid phone number (8–15 digits)';
  }
  return null;
}

/** Returns an error string, or null when empty/valid. */
export function validateAvatarUrl(avatarUrl) {
  const avatar = String(avatarUrl || '').trim();
  if (!avatar) return null;
  if (avatar.length > 2048) return 'Photo URL is too long';
  try {
    const url = new URL(avatar);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return 'Photo URL must start with http:// or https://';
    }
  } catch {
    return 'Enter a valid photo URL';
  }
  return null;
}

/** Client-side validation — mirrors server rules for immediate feedback */
export function validateProfileFormFields(
  form,
  { requireTerms = false, termsAccepted = false, skipExamFields = false } = {}
) {
  const errors = {};
  const first = String(form.first_name || '').trim();
  const last = String(form.last_name || '').trim();

  if (!first) errors.first_name = 'First name is required';
  else if (first.length > 50) errors.first_name = 'First name is too long';

  if (!last) errors.last_name = 'Last name is required';
  else if (last.length > 50) errors.last_name = 'Last name is too long';

  if (!String(form.country || '').trim()) errors.country = 'Country is required';

  const phoneErr = validatePhoneNumber(form.phone_number);
  if (phoneErr) errors.phone_number = phoneErr;

  if (!skipExamFields) {
    const exams = Array.isArray(form.target_exams) ? form.target_exams : [];
    if (!exams.length) errors.target_exams = 'Select at least one exam';
    else if (!form.target_exam || !exams.includes(form.target_exam)) {
      errors.target_exam = 'Choose a primary exam';
    }
  }

  const avatarErr = validateAvatarUrl(form.avatar_url);
  if (avatarErr) errors.avatar_url = avatarErr;

  const bio = String(form.bio || '');
  if (bio.length > 300) errors.bio = 'Bio must be 300 characters or less';

  if (requireTerms && !termsAccepted) {
    errors.terms = 'You must accept the Terms of Service and Privacy Policy';
  }

  return errors;
}

export function validateProfilePayload(body) {
  const first_name = String(body.first_name || body.firstName || '').trim();
  const last_name = String(body.last_name || body.lastName || '').trim();
  const country = String(body.country || '').trim();
  const phone_number = String(body.phone_number || body.phoneNumber || '').trim();
  const city = String(body.city || '').trim().slice(0, 80);
  const state = String(body.state || '').trim().slice(0, 80);
  const bio = String(body.bio || '').trim();
  const rawAvatar = body.avatar_url ?? body.avatarUrl ?? null;
  const avatar_url = rawAvatar != null ? String(rawAvatar).trim() || null : null;

  if (!first_name || first_name.length < 1) {
    return { error: 'First name is required' };
  }
  if (first_name.length > 50) {
    return { error: 'First name is too long' };
  }
  if (!last_name || last_name.length < 1) {
    return { error: 'Last name is required' };
  }
  if (last_name.length > 50) {
    return { error: 'Last name is too long' };
  }
  if (!country) {
    return { error: 'Country is required' };
  }
  const phoneErr = validatePhoneNumber(phone_number);
  if (phoneErr) {
    return { error: phoneErr };
  }

  const avatarErr = validateAvatarUrl(avatar_url);
  if (avatarErr) {
    return { error: avatarErr };
  }

  if (bio.length > 300) {
    return { error: 'Bio must be 300 characters or less' };
  }

  const examFields = normalizeTargetExamsPayload(body);
  if (examFields.error) {
    return { error: examFields.error };
  }

  const display_name = buildDisplayName(first_name, last_name);
  if (display_name.length > 60) {
    return { error: 'Name is too long' };
  }

  return {
    data: {
      first_name,
      last_name,
      country,
      phone_number,
      city: city || null,
      state: state || null,
      bio: bio ? bio.slice(0, 300) : null,
      target_exam: examFields.target_exam,
      target_exams: examFields.target_exams,
      avatar_url,
      display_name,
      profile_completed: true,
    },
  };
}

export function profileToFormDefaults(profile, session = {}) {
  const fromSession = parseSessionName(session.name);
  const hasStoredProfile =
    profile &&
    PROFILE_REQUIRED_FIELDS.some((f) => {
      const v = profile[f];
      return v != null && String(v).trim() !== '';
    });

  const target_exams = parseTargetExams(profile?.target_exams);
  let target_exam = profile?.target_exam != null ? String(profile.target_exam).trim().toLowerCase() : '';

  if (!target_exams.length && target_exam && !isValidExamSlug(target_exam)) {
    target_exam = '';
  } else if (!target_exam && target_exams.length) {
    target_exam = target_exams[0];
  }

  return {
    first_name: profile?.first_name || fromSession.first_name || '',
    last_name: profile?.last_name || fromSession.last_name || '',
    country: profile?.country || (hasStoredProfile ? '' : 'India'),
    phone_number: profile?.phone_number || '',
    city: profile?.city != null ? String(profile.city) : '',
    state: profile?.state != null ? String(profile.state) : '',
    bio: profile?.bio != null ? String(profile.bio) : '',
    target_exam,
    target_exams,
    legacy_target_exam:
      profile?.target_exam && !isValidExamSlug(profile.target_exam)
        ? String(profile.target_exam)
        : '',
    avatar_url: profile?.avatar_url || session.image || '',
    email: session.email || profile?.user_email || '',
  };
}
