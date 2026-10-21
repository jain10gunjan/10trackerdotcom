import { OUTPUT_TRUNCATE_BYTES } from './constants.js';

/**
 * @param {string|null|undefined} text
 * @param {number} [maxBytes]
 */
export function truncateOutput(text, maxBytes = OUTPUT_TRUNCATE_BYTES) {
  if (text == null) return null;
  const buf = Buffer.from(String(text), 'utf8');
  if (buf.length <= maxBytes) return String(text);
  const sliced = buf.subarray(0, maxBytes).toString('utf8');
  return `${sliced}\n…[truncated ${buf.length - maxBytes} bytes]`;
}
