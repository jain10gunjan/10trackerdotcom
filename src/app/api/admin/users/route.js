import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  buildActivityBuckets,
  computeEngagement,
  resolveActivityForUser,
  summarizeEngagement,
} from '@/lib/adminUserActivity';
import {
  buildUsageIndex,
  fetchClerkUsers,
  fetchOauthUsers,
  fetchWalletsByEmail,
  mapClerkUser,
  mergeAdminUsers,
} from '@/lib/adminUserSources';

export async function GET() {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseAdmin = getSupabaseAdmin();

    let progressRows = [];
    let attemptRows = [];

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const [progressRes, attemptsRes] = await Promise.all([
        supabase
          .from('user_progress')
          .select(
            'user_id, topic, area, points, completedquestions, correctanswers, updated_at, created_at'
          ),
        supabase
          .from('user_test_attempts')
          .select('user_email, started_at, submitted_at, created_at, is_completed, status')
          .order('started_at', { ascending: false })
          .limit(8000),
      ]);

      if (!progressRes.error && progressRes.data) progressRows = progressRes.data;
      if (!attemptsRes.error && attemptsRes.data) attemptRows = attemptsRes.data;
    }

    const usageByKey = buildUsageIndex(progressRows);

    const { users: clerkRaw, error: clerkError } = await fetchClerkUsers(clerkSecret);

    const legacyMapped = clerkRaw.map((cu) => {
      const email =
        cu.primary_email_address?.email_address ||
        cu.email_addresses?.[0]?.email_address ||
        cu.email ||
        null;
      return { cu, email };
    });

    const clerkEmailSet = new Set(
      legacyMapped.map((x) => normalizeEmail(x.email)).filter(Boolean)
    );

    const clerkIdToEmail = {};
    for (const { cu, email } of legacyMapped) {
      if (email) clerkIdToEmail[cu.id] = normalizeEmail(email);
    }

    const walletEmails = [
      ...clerkEmailSet,
      ...progressRows
        .map((r) => r.user_id)
        .filter((id) => String(id || '').includes('@'))
        .map((e) => normalizeEmail(e)),
      ...attemptRows.map((a) => a.user_email).filter(Boolean),
    ];

    const walletsByEmail = await fetchWalletsByEmail(supabaseAdmin, walletEmails);

    const legacyUsers = legacyMapped.map(({ cu }) =>
      mapClerkUser(cu, { usageByKey, walletsByEmail })
    );

    const oauthUsers = await fetchOauthUsers(supabaseAdmin, {
      clerkEmailSet,
      usageByKey,
      walletsByEmail,
    });

    for (const u of oauthUsers) {
      if (!u.wallet && u.email) {
        u.wallet = walletsByEmail[normalizeEmail(u.email)] || null;
      }
    }

    const merged = mergeAdminUsers(legacyUsers, oauthUsers);

    const activityByKey = buildActivityBuckets({
      progressRows,
      attemptRows,
      clerkIdToEmail,
    });

    const users = merged.map((user) => {
      const rawActivity = resolveActivityForUser(user, activityByKey);
      const engagement = computeEngagement(rawActivity);

      return {
        ...user,
        activity: {
          practiceTopics: rawActivity.practiceTopics,
          mockAttempts: rawActivity.mockAttempts,
          mockCompleted: rawActivity.mockCompleted,
          lastSignInAt: rawActivity.lastSignInAt,
        },
        engagement,
      };
    });

    const summary = summarizeEngagement(users);

    return NextResponse.json({
      success: true,
      users,
      summary,
      counts: {
        total: users.length,
        clerkOnly: users.filter((u) => u.authSources?.length === 1 && u.authSources[0] === 'clerk').length,
        oauthOnly: users.filter((u) => u.authSources?.length === 1 && u.authSources[0] === 'oauth').length,
        both: users.filter((u) => (u.authSources || []).length > 1).length,
      },
      clerkError: clerkError || null,
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}
