/** Per-submission Judge0 limits from Problem row, with sane defaults + caps. */

export const DEFAULT_CPU_TIME_LIMIT = 2; // seconds
export const DEFAULT_WALL_TIME_LIMIT = 5; // seconds
export const DEFAULT_MEMORY_LIMIT = 128000; // KB (~128 MB)

export const CAP_CPU_TIME_LIMIT = 10;
export const CAP_WALL_TIME_LIMIT = 20;
export const CAP_MEMORY_LIMIT = 512000; // KB

/**
 * @param {{
 *   cpu_time_limit?: number|null,
 *   wall_time_limit?: number|null,
 *   memory_limit_kb?: number|null,
 *   time_limit_sec?: number|null,
 *   memory_limit?: number|null,
 * }} [problem]
 */
export function resolveSubmissionLimits(problem = {}) {
  const cpuRaw = problem.cpu_time_limit ?? problem.time_limit_sec ?? DEFAULT_CPU_TIME_LIMIT;
  const wallRaw = problem.wall_time_limit ?? DEFAULT_WALL_TIME_LIMIT;
  const memRaw = problem.memory_limit_kb ?? problem.memory_limit ?? DEFAULT_MEMORY_LIMIT;

  const cpu_time_limit = clampNumber(cpuRaw, 0.1, CAP_CPU_TIME_LIMIT, DEFAULT_CPU_TIME_LIMIT);
  const wall_time_limit = clampNumber(wallRaw, 1, CAP_WALL_TIME_LIMIT, DEFAULT_WALL_TIME_LIMIT);
  const memory_limit = Math.round(
    clampNumber(memRaw, 1024, CAP_MEMORY_LIMIT, DEFAULT_MEMORY_LIMIT)
  );

  return { cpu_time_limit, wall_time_limit, memory_limit };
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
