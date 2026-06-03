/**
 * react-hot-toast helpers: toast.promise for async UX + safe JSON parsing.
 */
import toast from 'react-hot-toast';

/**
 * Run an async function under toast.promise (loading → success | error).
 * @param {() => Promise<*>} fn
 * @param {{ loading?: string, success?: string | ((value: *) => string), error?: string | ((err: Error) => string) }} messages
 */
export function toastPromise(fn, messages = {}) {
  const loading = messages.loading ?? 'Please wait…';
  const success =
    messages.success ??
    ((value) => (typeof value === 'string' ? value : 'Done'));
  const error =
    messages.error ??
    ((err) => err?.message || 'Something went wrong');

  return toast.promise(fn(), { loading, success, error });
}

/** @deprecated Use toastPromise */
export async function withLoadingToast(promise, messages = {}) {
  return toastPromise(() => promise, messages);
}

/** Parse fetch Response body without throwing on empty/invalid JSON */
export async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text?.trim()) {
    if (!res.ok) {
      throw new Error(res.statusText || `Request failed (${res.status})`);
    }
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid server response');
  }
}
