# Coding contests (Judge0)

Vendor-scoped multi-language coding contests judged by Judge0. Students use the institute portal; staff create contests under admin.

## Routes

| Who | Path |
| --- | --- |
| Students | `/practice-tests/<slug>/coding-contests` |
| Problem IDE | `/practice-tests/<slug>/coding-contests/<id>/problems/<pid>` |
| Leaderboard | `/practice-tests/<slug>/coding-contests/<id>/leaderboard` |
| Admin | `/practice-tests/<slug>/admin/coding-contests` |

Access follows the same `vendor_members` rules as practice tests (NextAuth Google).

## One-time database setup

1. Run `supabase/migrations/setup_coding_contests.sql` in the Supabase SQL Editor.
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (service_role JWT) on the Next app and the worker.
3. Sync languages: Admin → **Sync Judge0 languages**, or:

```bash
npm run seed:judge0-languages
```

## Judge0 env (provider-agnostic)

All Judge0 calls go through `src/lib/judge0/client.js` on the **server only**.

### RapidAPI (default)

```env
JUDGE0_BASE_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_AUTH_HEADER_NAME=X-RapidAPI-Key
JUDGE0_AUTH_HEADER_VALUE=your_rapidapi_key
JUDGE0_HOST_HEADER=judge0-ce.p.rapidapi.com
JUDGE0_WEBHOOK_SECRET=long-random-string
JUDGE0_CALLBACK_BASE_URL=https://your-public-domain.com
```

Put secrets in `.env.local` only — never commit them.

### Self-hosted Judge0

Change only env values, for example:

```env
JUDGE0_BASE_URL=https://judge0.example.com
JUDGE0_AUTH_HEADER_NAME=X-Auth-Token
JUDGE0_AUTH_HEADER_VALUE=your_token
# JUDGE0_HOST_HEADER=   (omit unless needed)
```

## Architecture (no Redis)

1. Submit/Run API inserts `coding_submissions` + a row in `coding_judge_jobs`.
2. A **separate Node worker** claims jobs via `claim_coding_judge_job` (SKIP LOCKED).
3. Worker creates Judge0 submissions (batch or sequential ICPC stop-on-fail) with `callback_url` when configured.
4. `/api/judge0/webhook` updates results (idempotent, secret-checked). Polling jobs are the fallback (important on RapidAPI).
5. When all tests finish, verdict/score and ICPC leaderboard are updated.
6. Clients use SSE (`/api/practice-tests/.../coding-submissions/[id]/stream`) and leaderboard short polling. Hidden test I/O is never sent to the browser.

## Hostinger Node.js deployment (two apps)

Hostinger Node hosting has no Docker/root and usually no Redis. Deploy:

### App 1 — Next.js

- Build / start: `npm install && npm run build` then `npm start` (or Hostinger’s Node start command).
- Env: NextAuth, Supabase (incl. service role), Judge0 vars, `JUDGE0_CALLBACK_BASE_URL` = this app’s public HTTPS URL.

### App 2 — Judge worker (microservice)

- Same git repo (or copy of it).
- Start command: `node worker/judge.mjs`
- Working directory: project root (`cattracker/`).
- Env: same Supabase service role + Judge0 vars (webhook secret optional for worker but needed on App 1).
- Optional tuning: `JUDGE_WORKER_CONCURRENCY`, `JUDGE_WORKER_POLL_MS`, `JUDGE_WORKER_GLOBAL_RPM`.

Locally:

```bash
npm run worker:judge
```

Keep the worker process running whenever contests accept submissions.

## Scoring

Default **ICPC**: solved count, then penalty (time to first AC + 20 minutes per wrong attempt before AC). Compilation Errors are ignored for penalty by default (`ignore_ce_penalty`). Points-based scoring is wired behind the same interface for later.

## Security checklist

- Judge0 API key only in server env.
- Hidden test cases only via service-role server code.
- Webhook rejects bad/missing `JUDGE0_WEBHOOK_SECRET` (timing-safe compare).
- Zod validation on submit/run/admin inputs; source size capped at 64KB; cooldowns on submit/run.
- DB rate limits + max in-flight submissions per user (see scale migration).

## Scaling to ~1000 concurrent users

**Hard limit:** Judge0 (RapidAPI) requests/minute. The app can queue thousands of jobs; verdicts only finish as fast as Judge0 allows.

1. Run `supabase/migrations/setup_coding_contests_scale.sql`.
2. Set `JUDGE_WORKER_GLOBAL_RPM` to your real Judge0 plan RPM (do not exceed it).
3. Deploy **2–4** Hostinger worker apps (`node worker/judge.mjs`) with unique `JUDGE_WORKER_ID` — they share the DB queue via `SKIP LOCKED`.
4. Prefer fewer test cases per problem (e.g. 5–10) for contest throughput.
5. For max throughput, turn off `stop_on_first_fail` so the worker can batch Judge0 calls.
6. When RapidAPI is not enough: self-host Judge0 CE/Extra on a VPS/cluster and only change Judge0 env vars.

Optional later (not required for v1): Upstash Redis + BullMQ for even lower claim latency.
