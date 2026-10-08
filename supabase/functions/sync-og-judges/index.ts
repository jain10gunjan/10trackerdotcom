/**
 * Supabase Edge Function: sync-og-judges
 *
 * Prefer invoking the Next.js sync path (real LeetCode/HackerRank clients live there):
 *   POST /api/og-trackers/sync/me  (per user, session)
 * Or call syncAllPremiumUsers from a secured Next cron.
 *
 * This Edge Function remains a thin cron stub — redeploy after wiring Deno fetch to the same GraphQL/REST logic if needed.
 *
 * Deploy: supabase functions deploy sync-og-judges
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const secret = Deno.env.get('OG_JUDGE_SYNC_SECRET');
    const provided = req.headers.get('x-og-sync-secret');
    const auth = req.headers.get('Authorization') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const okSecret = secret && provided === secret;
    const okService = serviceKey && auth === `Bearer ${serviceKey}`;
    if (!okSecret && !okService) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      serviceKey,
      { auth: { persistSession: false } }
    );

    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('user_email, leetcode_username, codestudio_username, hackerrank_username')
      .eq('is_premium', true);

    if (error) throw error;

    const results = [];
    for (const u of users || []) {
      if (!u.leetcode_username && !u.codestudio_username && !u.hackerrank_username) continue;
      results.push({
        email: u.user_email,
        ok: true,
        updated: 0,
        note: 'Use Next.js /api/og-trackers/sync for live LeetCode + HackerRank sync',
      });
    }

    return new Response(
      JSON.stringify({ ok: true, users: results.length, results }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
