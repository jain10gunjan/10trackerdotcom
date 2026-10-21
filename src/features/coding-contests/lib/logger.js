/**
 * Minimal structured logger for coding-contests / Judge0 paths.
 * @param {string} level
 * @param {string} message
 * @param {Record<string, unknown>} [fields]
 */
export function logContest(level, message, fields = {}) {
  const payload = {
    ts: new Date().toISOString(),
    scope: 'coding-contests',
    level,
    message,
    ...fields,
  };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
