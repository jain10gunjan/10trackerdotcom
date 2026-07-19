import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  PROFILE_SETUP_SQL_HINT,
  resetProfileDbSchemaCache,
  selectProfile,
  upsertProfile,
} from '@/lib/userProfileDb';
import {
  getProfileGateStatus,
  hasCurrentTermsAcceptance,
  isProfileComplete,
  isProfileFieldsComplete,
  needsTermsReacceptance,
  profileToFormDefaults,
  validateProfilePayload,
} from '@/lib/userProfile';
import { validateTermsAcceptance, TERMS_VERSION } from '@/features/billing/lib/legal';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { grantSignupBonus } from '@/features/credits/lib/walletService';

function profileClient() {
  return getSupabaseServer(isValidServiceRoleKey());
}

function gatePayload(profile) {
  return getProfileGateStatus(profile);
}

function jsonProfileSuccess(profile, session, extra = {}) {
  const suggested = profileToFormDefaults(profile, {
    name: session.user?.name,
    image: session.user?.image,
    email: normalizeEmail(session.user?.email),
  });
  return NextResponse.json({
    success: true,
    profile,
    suggested,
    ...gatePayload(profile),
    ...extra,
  });
}

export async function GET() {
  try {
    const session = await auth();
    const userEmail = normalizeEmail(session?.user?.email);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const supabase = profileClient();
    const { profile, error } = await selectProfile(supabase, userEmail);

    if (error) {
      console.error('Profile fetch error:', error);
      if (error.code === '42703' || error.code === 'PGRST204') {
        resetProfileDbSchemaCache();
        const retry = await selectProfile(supabase, userEmail);
        if (!retry.error) {
          return jsonProfileSuccess(retry.profile, session);
        }
      }
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          profile: null,
          needsProfile: true,
          needsProfileCompletion: true,
          needsTermsReacceptance: false,
          suggested: profileToFormDefaults(null, {
            name: session.user?.name,
            image: session.user?.image,
            email: userEmail,
          }),
          dbSetupRequired: true,
          setupHint: PROFILE_SETUP_SQL_HINT,
        });
      }
      if (error.code === 'PROFILE_DB_NOT_READY' || error.code === '42P17') {
        return NextResponse.json({
          success: false,
          error: error.message || PROFILE_SETUP_SQL_HINT,
          dbSetupRequired: true,
          setupHint: PROFILE_SETUP_SQL_HINT,
        }, { status: 503 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return jsonProfileSuccess(profile, session);
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    const userEmail = normalizeEmail(session?.user?.email);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = profileClient();
    const { profile: existingProfile } = await selectProfile(supabase, userEmail);

    // Terms-only re-acceptance (existing users after TERMS_VERSION bump)
    if (body?.termsOnly === true) {
      if (!isProfileFieldsComplete(existingProfile)) {
        return NextResponse.json(
          { success: false, error: 'Complete your profile before accepting terms.' },
          { status: 400 }
        );
      }
      const termsCheck = validateTermsAcceptance(body);
      if (!termsCheck.ok) {
        return NextResponse.json({ success: false, error: termsCheck.error }, { status: 400 });
      }

      const { data, error } = await upsertProfile(supabase, userEmail, {
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
        profile_completed: true,
      });

      if (error) {
        console.error('Terms accept error:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to save acceptance' },
          { status: 500 }
        );
      }

      return jsonProfileSuccess(data, session);
    }

    const { email: _omitEmail, user_email: _omitUserEmail, id: _omitId, ...payload } = body || {};
    const validated = validateProfilePayload(payload);
    if (validated.error) {
      return NextResponse.json({ success: false, error: validated.error }, { status: 400 });
    }

    const fields = { ...validated.data };
    const firstCompletion = !isProfileFieldsComplete(existingProfile);
    const mustAcceptTerms =
      firstCompletion || needsTermsReacceptance(existingProfile) || !hasCurrentTermsAcceptance(existingProfile);

    if (mustAcceptTerms) {
      const termsCheck = validateTermsAcceptance(body);
      if (!termsCheck.ok) {
        return NextResponse.json({ success: false, error: termsCheck.error }, { status: 400 });
      }
      fields.terms_accepted_at = new Date().toISOString();
      fields.terms_version = TERMS_VERSION;
    } else if (existingProfile?.terms_accepted_at) {
      fields.terms_accepted_at = existingProfile.terms_accepted_at;
      fields.terms_version = existingProfile.terms_version || TERMS_VERSION;
    }

    if (!fields.avatar_url && session.user?.image) {
      fields.avatar_url = session.user.image;
    }

    const { data, error } = await upsertProfile(supabase, userEmail, fields);

    if (error) {
      console.error('Profile save error:', error);
      if (error.code === '42703' || error.code === 'PGRST204') {
        resetProfileDbSchemaCache();
        const retry = await upsertProfile(supabase, userEmail, fields);
        if (!retry.error && isProfileComplete(retry.data)) {
          return jsonProfileSuccess(retry.data, session);
        }
        if (!retry.error && retry.data) {
          return NextResponse.json(
            { success: false, error: 'Profile saved but required fields are still missing' },
            { status: 400 }
          );
        }
        if (retry.error) {
          error.message = retry.error.message;
        }
      }
      const setupHint = PROFILE_SETUP_SQL_HINT;
      let message = error.message || 'Failed to save profile';
      if (
        error.code === '42P01' ||
        error.code === 'PROFILE_DB_NOT_READY' ||
        error.code === '42703' ||
        error.code === 'PGRST204' ||
        error.code === '42501' ||
        error.code === '42P17' ||
        error.code === '23503'
      ) {
        message = error.code === '23503' ? message : `${message} ${setupHint}`;
      }
      return NextResponse.json(
        {
          success: false,
          error: message,
          dbSetupRequired: error.code === '42P01' || error.code === 'PROFILE_DB_NOT_READY',
          setupHint,
        },
        { status: error.code === 'PROFILE_DB_NOT_READY' ? 503 : 500 }
      );
    }

    if (!isProfileComplete(data)) {
      return NextResponse.json(
        { success: false, error: 'Profile saved but acceptance or required fields are still missing' },
        { status: 400 }
      );
    }

    let signupCredits = null;
    try {
      signupCredits = await grantSignupBonus(userEmail);
    } catch (bonusErr) {
      console.warn('Signup bonus grant failed:', bonusErr?.message);
    }

    return jsonProfileSuccess(data, session, { signupCredits });
  } catch (error) {
    console.error('Profile POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
