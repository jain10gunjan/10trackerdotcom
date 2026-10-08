# OG Trackers — Judge batch sync

## Deploy Edge Function

```bash
supabase functions deploy sync-og-judges
```

Set secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OG_JUDGE_SYNC_SECRET` (optional shared secret for Next.js triggers)

## Schedule

In Supabase Dashboard → Edge Functions → Schedules, run every 6 hours:

`POST https://<project>.supabase.co/functions/v1/sync-og-judges`  
Header: `Authorization: Bearer <SERVICE_ROLE_KEY>`

## SQL migration

Run [`setup_og_trackers.sql`](../migrations/setup_og_trackers.sql) in the SQL Editor before using the product.

## Env (Next.js)

- `OG_TRACKERS_PREMIUM_PAISE` — optional, default `49900` (₹499)
- `NEXT_PUBLIC_OG_TRACKERS_PREMIUM_PAISE` — optional, for client price display
- `NEXTAUTH_SECRET` — used to sign video progress beacon tokens

LeetCode / CodeStudio clients are **mocked** until real APIs are wired in:

- `src/features/og-trackers/lib/leetcode.js`
- `src/features/og-trackers/lib/codestudio.js`
