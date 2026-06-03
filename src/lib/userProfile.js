/** Shared user profile validation and completion checks */

import { isValidExamSlug, normalizeTargetExamsPayload, parseTargetExams } from '@/lib/examProfile';

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

export function isProfileComplete(profile) {
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

export function validateProfilePayload(body) {
  const first_name = String(body.first_name || body.firstName || '').trim();
  const last_name = String(body.last_name || body.lastName || '').trim();
  const country = String(body.country || '').trim();
  const phone_number = String(body.phone_number || body.phoneNumber || '').trim();
  const city = String(body.city || '').trim();
  const state = String(body.state || '').trim();
  const bio = String(body.bio || '').trim();
  const avatar_url = body.avatar_url || body.avatarUrl || null;

  if (!first_name || first_name.length < 1) {
    return { error: 'First name is required' };
  }
  if (!last_name || last_name.length < 1) {
    return { error: 'Last name is required' };
  }
  if (!country) {
    return { error: 'Country is required' };
  }
  if (!phone_number) {
    return { error: 'Phone number is required' };
  }
  const digits = phone_number.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    return { error: 'Enter a valid phone number (8–15 digits)' };
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
      avatar_url: avatar_url || null,
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
    // legacy free-text — leave target_exam as-is for banner; clear from dropdown selection
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
