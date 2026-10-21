import { randomUUID } from 'crypto';
import { getSupabaseServer, isValidServiceRoleKey } from '../../../lib/supabaseServer.js';
import { claimJobs, completeJob, failJob, requeueStaleJobs } from '../lib/jobQueue.js';
import { logContest } from '../lib/logger.js';
import { processJudgeJob } from './processJudgeJob.js';

function getSupabase() {
  if (!isValidServiceRoleKey()) {
    throw new Error(
      'Worker requires SUPABASE_SERVICE_ROLE_KEY (service_role JWT) to claim jobs and update results.'
    );
  }
  return getSupabaseServer(true);
}

/**
 * Token-bucket paced worker for Hostinger (scale by running multiple instances).
 * Env:
 *   JUDGE_WORKER_CONCURRENCY (default 8)
 *   JUDGE_WORKER_POLL_MS (default 400)
 *   JUDGE_WORKER_CLAIM_BATCH (default 5)
 *   JUDGE_WORKER_GLOBAL_RPM (default 40 — set to your Judge0 plan limit)
 *   JUDGE_WORKER_STALE_SECONDS (default 120)
 */
export async function startWorker() {
  const workerId = process.env.JUDGE_WORKER_ID || `worker-${randomUUID().slice(0, 8)}`;
  const concurrency = Math.max(1, Number(process.env.JUDGE_WORKER_CONCURRENCY || 8));
  const pollMs = Math.max(200, Number(process.env.JUDGE_WORKER_POLL_MS || 400));
  const claimBatch = Math.max(1, Number(process.env.JUDGE_WORKER_CLAIM_BATCH || 5));
  const globalRpm = Number(process.env.JUDGE_WORKER_GLOBAL_RPM || 40);
  const staleSeconds = Math.max(30, Number(process.env.JUDGE_WORKER_STALE_SECONDS || 120));
  const minGapMs = globalRpm > 0 ? Math.ceil(60000 / globalRpm) : 0;

  const supabase = getSupabase();
  let active = 0;
  let lastJudgeCall = 0;
  let lastRequeueAt = 0;
  let stopping = false;

  logContest('info', 'worker_started', {
    workerId,
    concurrency,
    pollMs,
    claimBatch,
    globalRpm,
  });

  const shutdown = () => {
    stopping = true;
    logContest('info', 'worker_stopping', { workerId });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  while (!stopping) {
    if (Date.now() - lastRequeueAt > 15000) {
      lastRequeueAt = Date.now();
      const n = await requeueStaleJobs(supabase, staleSeconds);
      if (n > 0) logContest('warn', 'stale_jobs_requeued', { count: n, workerId });
    }

    const slots = concurrency - active;
    if (slots > 0) {
      const waitForRate = minGapMs ? Math.max(0, minGapMs - (Date.now() - lastJudgeCall)) : 0;
      if (waitForRate > 0) {
        await sleep(Math.min(waitForRate, pollMs));
      } else {
        let jobs = [];
        try {
          jobs = await claimJobs(supabase, workerId, Math.min(slots, claimBatch));
        } catch (err) {
          logContest('error', 'claim_error', { error: err.message });
          await sleep(pollMs);
          continue;
        }

        for (const job of jobs) {
          if (minGapMs && Date.now() - lastJudgeCall < minGapMs) {
            // Put job back softly by failing with retry — better: leave processing.
            // Pace by delaying start.
            await sleep(minGapMs - (Date.now() - lastJudgeCall));
          }
          active += 1;
          lastJudgeCall = Date.now();
          (async () => {
            try {
              await processJudgeJob(supabase, job);
              await completeJob(supabase, job.id);
            } catch (err) {
              logContest('error', 'job_failed', {
                jobId: job.id,
                error: err.message,
              });
              await failJob(supabase, job.id, err.message, {
                attempts: job.attempts,
                maxAttempts: job.max_attempts,
              });
            } finally {
              active -= 1;
            }
          })();
        }

        if (!jobs.length) await sleep(pollMs);
      }
    } else {
      await sleep(pollMs);
    }
  }

  while (active > 0) await sleep(200);
  logContest('info', 'worker_stopped', { workerId });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const isDirect =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('/startWorker.js');

if (isDirect) {
  startWorker().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
