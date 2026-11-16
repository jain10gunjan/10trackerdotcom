/**
 * Issue a one-time connect code and return the connected URL for the extension
 * content script to pick up.
 */
export async function authorizeExtension({
  label = 'Chrome · YouTube Progress',
} = {}) {
  const res = await fetch('/api/extension/auth/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ label }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to authorize extension');
  }
  const path =
    json.connectedPath ||
    `/extension/connected?code=${encodeURIComponent(json.code)}`;
  return { path, code: json.code, expiresAt: json.expiresAt };
}
