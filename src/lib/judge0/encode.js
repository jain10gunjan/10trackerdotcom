/** base64 helpers for Judge0 base64_encoded=true */

export function toBase64(value) {
  if (value == null) return null;
  return Buffer.from(String(value), 'utf8').toString('base64');
}

export function fromBase64(value) {
  if (value == null || value === '') return value == null ? null : '';
  try {
    return Buffer.from(String(value), 'base64').toString('utf8');
  } catch {
    return String(value);
  }
}

export function decodeSubmissionFields(submission) {
  if (!submission || typeof submission !== 'object') return submission;
  const out = { ...submission };
  for (const key of ['source_code', 'stdin', 'expected_output', 'stdout', 'stderr', 'compile_output', 'message']) {
    if (out[key] != null) out[key] = fromBase64(out[key]);
  }
  return out;
}
