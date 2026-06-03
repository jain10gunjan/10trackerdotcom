import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  PROFILE_SETUP_SQL_HINT,
  resetProfileDbSchemaCache,
  selectProfile,
  upsertProfile,
} from '@/lib/userProfileDb';
import {
  isProfileComplete,
  profileToFormDefaults,
  validateProfilePayload,
} from '@/lib/userProfile';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { grantSignupBonus } from '@/lib/credits/walletService';

function profileClient() {
  return getSupabaseServer(isValidServiceRoleKey());
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
          const suggested = profileToFormDefaults(retry.profile, {
            name: session.user?.name,
            image: session.user?.image,
            email: userEmail,
          });
          return NextResponse.json({
            success: true,
            profile: retry.profile,
            needsProfile: !isProfileComplete(retry.profile),
            suggested,
          });
        }
      }
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          profile: null,
          needsProfile: true,
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

    const suggested = profileToFormDefaults(profile, {
      name: session.user?.name,
      image: session.user?.image,
      email: userEmail,
    });

    let signupGrant = null;
    try {
      signupGrant = await grantSignupBonus(userEmail);
    } catch (bonusErr) {
      console.warn('grantSignupBonus on profile load:', bonusErr?.message);
    }

    return NextResponse.json({
      success: true,
      profile,
      needsProfile: !isProfileComplete(profile),
      suggested,
      signupGrant,
    });
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
    const { email: _omitEmail, user_email: _omitUserEmail, id: _omitId, ...payload } = body || {};
    const validated = validateProfilePayload(payload);
    if (validated.error) {
      return NextResponse.json({ success: false, error: validated.error }, { status: 400 });
    }

    const supabase = profileClient();
    const fields = { ...validated.data };

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
          const suggested = profileToFormDefaults(retry.data, {
            name: session.user?.name,
            image: session.user?.image,
            email: userEmail,
          });
          return NextResponse.json({
            success: true,
            profile: retry.data,
            needsProfile: false,
            suggested,
          });
        }
        if (!retry.error && retry.data) {
          return NextResponse.json(
            { success: false, error: 'Profile saved but required fields are still missing' },
            { status: 400 }
          );
        }
        if (retry.error) {
          error = retry.error;
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
        { success: false, error: 'Profile saved but required fields are still missing' },
        { status: 400 }
      );
    }

    const suggested = profileToFormDefaults(data, {
      name: session.user?.name,
      image: session.user?.image,
      email: userEmail,
    });

    let signupCredits = null;
    try {
      signupCredits = await grantSignupBonus(userEmail);
    } catch (bonusErr) {
      console.warn('Signup bonus grant failed (run setup_credits_subscriptions.sql):', bonusErr?.message);
    }

    return NextResponse.json({
      success: true,
      profile: data,
      needsProfile: false,
      suggested,
      signupCredits,
    });
  } catch (error) {
    console.error('Profile POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
