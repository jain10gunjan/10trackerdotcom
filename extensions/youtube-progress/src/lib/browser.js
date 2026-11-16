/**
 * Cross-browser namespace.
 * Prefer chrome on Chromium. On Firefox use browser (polyfill provides it).
 */
import 'webextension-polyfill';

const api = globalThis.chrome?.runtime
  ? globalThis.chrome
  : globalThis.browser;

export default api;
export { api as browser };
